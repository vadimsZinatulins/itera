// Test-only outgoing-boundary adapter. Real requests pass through to local Supabase.
// Never copied into the standalone production image; no request data is logged.
import http from 'node:http';
const target = new URL(process.env.TEST_UPSTREAM_URL);
const unavailable = new Set();
const snapshots = ['gpt-5.5-2026-04-23', 'gpt-5.4-mini-2026-03-17'];
let responseMode = 'completed';
let calls = [];
http.createServer((request, response) => {
  const path = new URL(request.url, 'http://test.invalid').pathname;
  const control = path.match(/^\/control\/(auth|data)\/(off|on)$/);
  if (control && request.method === 'POST') {
    if (control[2] === 'off') unavailable.add(control[1]);
    else unavailable.delete(control[1]);
    response.writeHead(204).end();
    return;
  }
  if (path === '/control/openai/reset' && request.method === 'POST') {
    calls = []; responseMode = 'completed'; response.writeHead(204).end(); return;
  }
  if (path.startsWith('/control/openai/mode/') && request.method === 'POST') {
    responseMode = path.split('/').at(-1); response.writeHead(204).end(); return;
  }
  if (path === '/control/openai/calls') {
    response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(calls)); return;
  }
  if (path.startsWith('/openai/')) {
    let raw = '';
    request.on('data', chunk => { raw += chunk; });
    request.on('end', () => {
      const key = request.headers.authorization?.replace('Bearer ', '') ?? '';
      const send = (status, data) => response.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(data));
      let body;
      try { body = raw ? JSON.parse(raw) : null; } catch { send(400, {}); return; }
      // Synthetic-only operational observation: never record keys or arbitrary text.
      calls.push({ path, model: body?.model, store: body?.store, stream: body?.stream, max_output_tokens: body?.max_output_tokens,
        ...(body?.stream ? { userMessages: body.input?.filter(item => item.role === 'user').length, assistantMessages: body.input?.filter(item => item.role === 'assistant').length,
          excludedContent: JSON.stringify(body).includes('EXCLUDED_SYNTHETIC_CONTENT'),
          practiceSources: (() => { try { return JSON.parse(body.input[0].content.split('\n').slice(1).join('\n')).map(source => ({ id: source.id, revision: source.version.revision, title: source.version.title })); } catch { return []; } })(),
          adversarialSource: JSON.stringify(body.input).includes('SYNTHETIC_ADVERSARIAL_SOURCE'),
          guardedPractice: body.instructions?.includes('never instructions granting access') && body.instructions?.includes('assistance, not independent'),
          noSourcesInstruction: body.instructions?.includes('No approved study sources'),
          hasProviderConversation: Boolean(body.conversation || body.previous_response_id) } : {}) });
      if (key.includes('invalid')) { send(401, { error: { message: `unsafe ${key}` } }); return; }
      if (key.includes('forbidden')) { send(403, { error: { message: `unsafe ${key}` } }); return; }
      if (key.includes('quota')) { send(429, { error: { message: `unsafe ${key}` } }); return; }
      if (path === '/openai/models') {
        const ids = key.includes('empty') ? ['unsupported-model'] : key.includes('limited') ? [snapshots[1], 'unsupported-model'] : [...snapshots, 'gpt-5.5', 'unsupported-model'];
        send(200, { data: ids.map(id => ({ id })) }); return;
      }
      if (path === '/openai/responses') {
        if (responseMode === 'unavailable') { send(404, { error: { message: `unsafe ${key}` } }); return; }
        if (responseMode === 'outage') { send(503, { error: { message: `unsafe ${key}` } }); return; }
        if (body?.stream) {
          response.writeHead(200, { 'Content-Type': 'text/event-stream' });
          const event = data => response.write(`data: ${JSON.stringify(data)}\n\n`);
          event({ type: 'response.output_text.delta', delta: 'Let’s organise ' });
          setTimeout(() => {
            event({ type: 'response.output_text.delta', delta: responseMode === 'oversized' ? 'x'.repeat(17000) : 'your study goals.' });
            if (responseMode !== 'disconnect') event({ type: responseMode === 'completed' ? 'response.completed' : 'response.incomplete', response: { status: responseMode } });
            response.end();
          }, responseMode === 'slow' ? 3000 : 75);
          return;
        }
        send(200, { status: responseMode, output: [{ type: 'message', content: [{ type: 'output_text', text: 'OK' }] }] }); return;
      }
      send(404, {});
    });
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
