import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { admin, browserSignIn, provisionAccount } from './fixtures';

const origin = () => ({ origin: process.env.TEST_BASE_URL! });

// Public browser transport boundary; authentication and saved history use real local services.
test('a malformed trail is unavailable, not an empty successful trail, and reload resumes saved incomplete history', async ({ page }) => {
  const owner = await provisionAccount();
  try {
    await browserSignIn(page, owner.email);
    const subject = await (await page.request.post('/api/subjects', {
      headers: origin(), data: { name: 'Validated conversation trail' },
    })).json();
    const conversation = randomUUID();
    const saved = await page.request.post('/api/conversations', {
      headers: origin(),
      data: { subject: subject.id, conversation, operation: randomUUID(), text: 'Resume this saved question.' },
    });
    expect(saved.ok()).toBe(true);
    await page.route('**/api/conversations?*', async route => {
      const url = new URL(route.request().url());
      if (url.searchParams.has('conversation')) {
        await route.continue();
        return;
      }
      await route.fulfill({ json: [{ id: conversation, title: 42, created_at: '2026-01-01T00:00:00Z' }] });
    });
    await page.goto(`/?subject=${subject.id}`);
    await expect(page.getByLabel('Conversation status')).toContainText('Could not load your trail. Try reloading.');
    await expect(page.getByLabel('Conversation threads')).not.toContainText('Your first saved message');
    await expect(page.getByRole('button', { name: '42', exact: true })).toHaveCount(0);

    await page.unroute('**/api/conversations?*');
    await page.reload();
    await page.getByRole('button', { name: 'Resume this saved question.', exact: true }).click();
    await expect(page.getByLabel('Conversation messages')).toContainText('Resume this saved question.');
    await expect(page.getByLabel('Conversation messages')).toContainText('Companion · incomplete');
    await expect(page.getByRole('button', { name: 'Request another reply', exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`conversation=${conversation}`));
  } finally {
    await admin().auth.admin.deleteUser(owner.id);
  }
});
