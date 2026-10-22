// Loaded only by the Docker test harness, never by deployed application code.
// Substitute exactly the outgoing OpenAI boundary; production has no custom endpoint option.
const originalFetch = globalThis.fetch;
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
