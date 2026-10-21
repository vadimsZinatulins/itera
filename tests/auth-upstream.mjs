// Test-only outgoing-boundary adapter. Real requests pass through to local Supabase.
// Never copied into the standalone production image; no request data is logged.
import http from 'node:http';
const target = new URL(process.env.TEST_UPSTREAM_URL);
const unavailable = new Set();
http.createServer((request, response) => {
  const path = new URL(request.url, 'http://test.invalid').pathname;
  const control = path.match(/^\/control\/(auth|data)\/(off|on)$/);
  if (control && request.method === 'POST') {
    if (control[2] === 'off') unavailable.add(control[1]);
    else unavailable.delete(control[1]);
    response.writeHead(204).end();
    return;
  }
  const service = path.startsWith('/auth/v1/') ? 'auth' : path.startsWith('/rest/v1/') ? 'data' : null;
  if (!service) { response.writeHead(404).end(); return; }
  if (unavailable.has(service)) {
    response.writeHead(503, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: 'Synthetic upstream outage' }));
    return;
  }
  const outgoing = http.request({
    hostname: target.hostname, port: target.port, path: request.url,
    method: request.method, headers: { ...request.headers, host: target.host },
  }, incoming => {
    response.writeHead(incoming.statusCode, incoming.headers);
    incoming.pipe(response);
  });
  outgoing.on('error', () => { response.writeHead(503).end(); });
  request.pipe(outgoing);
}).listen(8080, '0.0.0.0');
