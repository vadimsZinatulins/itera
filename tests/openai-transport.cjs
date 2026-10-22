// Loaded only by the Docker test harness, never by deployed application code.
// Substitute exactly the outgoing OpenAI boundary; production has no custom endpoint option.
const originalFetch = globalThis.fetch;
globalThis.fetch = function(input, options) {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.startsWith('https://api.openai.com/v1/')) {
    return originalFetch('http://upstream.test:8080/openai/' + url.slice('https://api.openai.com/v1/'.length), options);
  }
  return originalFetch(input, options);
};
