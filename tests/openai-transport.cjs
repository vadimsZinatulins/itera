// Loaded only by the Docker test harness, never by deployed application code.
// Substitute exactly the outgoing OpenAI boundary; production has no custom endpoint option.
const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;
const { format } = process.getBuiltinModule('node:util');
// Observe the real stderr boundary in synthetic tests; never shipped in production.
console.error = (...args) => {
  originalConsoleError(...args);
  void originalFetch('http://upstream.test:8080/control/settings-read-reports', {
    method: 'POST', body: format(...args),
  }).catch(() => { /* Missing observations fail the public test's polling assertion. */ });
};
const realNow = Date.now.bind(Date);
let clockOffset = 0;
Date.now = () => realNow() + clockOffset;
globalThis.fetch = async function(input, options) {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  // A harness-only controllable server clock. No production environment flag,
  // route or clock override is shipped. Real database leases keep real DB time.
  if (url.includes('/rest/v1/')) {
    const clock = await originalFetch('http://upstream.test:8080/control/clock');
    clockOffset = (await clock.json()).offset;
  }
  if (url.startsWith('https://api.openai.com/v1/')) {
    return originalFetch('http://upstream.test:8080/openai/' + url.slice('https://api.openai.com/v1/'.length), options);
  }
  return originalFetch(input, options);
};
