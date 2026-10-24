import { expect, test } from '@playwright/test';
import { admin, browserSignIn, provisionAccount } from './fixtures';

test('Subject API preserves Unicode normalization, codepoint and request-unit boundaries', async ({ page }) => {
  const learner = await provisionAccount();
  const origin = process.env.TEST_BASE_URL!;
  try {
    await browserSignIn(page, learner.email);
    for (const name of ['🧠'.repeat(80), 'e\u0301'.repeat(40), '\ufeff\u00a0\tUnicode trim\n\u00a0']) {
      const response = await page.request.post('/api/subjects', { headers: { origin }, data: { name } });
      expect(response.status()).toBe(201);
      expect(await response.json()).toMatchObject({ id: expect.any(String), name: name.trim() });
      expect(response.headers()['cache-control']).toBe('no-store');
    }
    for (const name of ['🧠'.repeat(81), 'e\u0301'.repeat(41)]) {
      const response = await page.request.post('/api/subjects', { headers: { origin }, data: { name } });
      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({ error: 'Use 80 characters or fewer.' });
    }
    // Unknown fields are ignored, but count toward the existing UTF-16 request limit.
    const base = JSON.stringify({ name: 'Unit boundary', padding: '' });
    const exact = JSON.stringify({ name: 'Unit boundary', padding: 'é'.repeat(2048 - base.length) });
    expect(exact.length).toBe(2048);
    expect(Buffer.byteLength(exact, 'utf8')).toBeGreaterThan(2048);
    const accepted = await page.request.post('/api/subjects', {
      headers: { origin, 'Content-Type': 'application/json' }, data: exact,
    });
    expect(accepted.status()).toBe(201);
    expect(await accepted.json()).toMatchObject({ name: 'Unit boundary' });
    const tooLarge = await page.request.post('/api/subjects', {
      headers: { origin, 'Content-Type': 'application/json' }, data: `${exact} `,
    });
    expect(tooLarge.status()).toBe(413);
    expect(await tooLarge.json()).toEqual({ error: 'Request too large.' });
  } finally {
    await admin().auth.admin.deleteUser(learner.id);
  }
});
