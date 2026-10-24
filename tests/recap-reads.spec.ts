import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { admin, browserSignIn, provisionAccount } from './fixtures';

const headers = () => ({ origin: process.env.TEST_BASE_URL! });

// Public browser transport seam; authentication, Subject and conversation use real local persistence.
test('malformed recap reads are unavailable rather than fabricated reviewed understanding', async ({ page, request }) => {
  const owner = await provisionAccount();
  try {
    await request.post(`${process.env.TEST_AUTH_CONTROL_URL}/control/openai/reset`);
    await browserSignIn(page, owner.email);
    const subjectResponse = await page.request.post('/api/subjects', { headers: headers(), data: { name: 'Recap read contracts' } });
    expect(subjectResponse.status()).toBe(201);
    const subject = (await subjectResponse.json()).id;
    await page.request.put('/api/settings/openai', { headers: headers(), data: { key: 'sk-synthetic-recap-read-key', model: 'gpt-5.4-mini-2026-03-17' } });
    const conversation = randomUUID();
    const sent = await page.request.post('/api/conversations', { headers: headers(), data: { subject, conversation, operation: randomUUID(), text: 'Discuss motion.' } });
    expect(await sent.text()).toContain('"status":"complete"');
    await page.route('**/api/recaps?*', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ recaps: [], observations: [], through: 'PRIVATE_MALFORMED_COVERAGE' }),
    }));
    await page.goto(`/?subject=${subject}&conversation=${conversation}`);
    const recaps = page.getByRole('region', { name: 'Practice recaps', exact: true });
    await expect(recaps.getByRole('status')).toHaveText('Could not load reviewed understanding.');
    await expect(recaps).not.toContainText('PRIVATE_MALFORMED_COVERAGE');
    await expect(recaps).not.toContainText('Reviewed through activity');
    await expect(recaps).not.toContainText('Reviewed observations · 0');
  } finally {
    await admin().auth.admin.deleteUser(owner.id);
  }
});
