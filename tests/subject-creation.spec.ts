import { expect, test } from '@playwright/test';
import { admin, browserSignIn, provisionAccount } from './fixtures';

test('Subject name correction is local, accessible and counts Unicode codepoints', async ({ page }) => {
  const learner = await provisionAccount();
  try {
    await browserSignIn(page, learner.email);
    await page.getByRole('button', { name: 'Switch subject' }).click();
    await page.getByRole('menuitem', { name: 'Add subject' }).click();
    const name = page.getByLabel('Subject name', { exact: true });
    const submissions: string[] = [];
    page.on('request', request => {
      if (request.url().endsWith('/api/subjects') && request.method() === 'POST') {
        submissions.push(request.postData() ?? '');
      }
    });
    await name.fill('🧠'.repeat(81));
    await page.getByRole('button', { name: 'Create subject', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('Use 80 characters or fewer.');
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(name).toBeFocused();
    expect(submissions).toEqual([]);
    await expect(name).toHaveValue('🧠'.repeat(81));
    await name.fill(`  ${'🧠'.repeat(80)}  `);
    await page.getByRole('button', { name: 'Create subject', exact: true }).click();
    await expect(page.getByRole('heading', { name: '🧠'.repeat(80), exact: true })).toBeVisible();
    expect(submissions).toEqual([JSON.stringify({ name: '🧠'.repeat(80) })]);
  } finally {
    await admin().auth.admin.deleteUser(learner.id);
  }
});

test('Subject creation preserves pending controls, duplicate input and real outage recovery', async ({ page, request }) => {
  const learner = await provisionAccount();
  const control = process.env.TEST_AUTH_CONTROL_URL;
  let release = () => {};
  try {
    await browserSignIn(page, learner.email);
    await page.getByRole('button', { name: 'Switch subject' }).click();
    await page.getByRole('menuitem', { name: 'Add subject' }).click();
    const name = page.getByLabel('Subject name', { exact: true });
    await name.fill('Recoverable Subject');
    await page.route('**/api/subjects', async route => {
      await new Promise<void>(resolve => { release = resolve; });
      await route.continue();
    });
    await page.getByRole('button', { name: 'Create subject', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Saving…', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeDisabled();
    await expect(name).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeVisible();
    release();
    await expect(page.getByRole('heading', { name: 'Recoverable Subject', exact: true })).toBeVisible();
    await page.unroute('**/api/subjects');
    await page.getByRole('button', { name: 'Switch subject' }).click();
    await page.getByRole('menuitem', { name: 'Add subject' }).click();
    await name.fill('recoverable subject');
    await page.getByRole('button', { name: 'Create subject', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('A Subject with this name already exists.');
    await expect(name).toHaveValue('recoverable subject');
    await name.fill('After outage');
    expect((await request.post(`${control}/control/data/off`)).ok()).toBe(true);
    const failedSubmission = page.waitForResponse(response => response.url().endsWith('/api/subjects'));
    await page.getByRole('button', { name: 'Create subject', exact: true }).click();
    expect((await failedSubmission).status()).toBe(503);
    await expect(page.getByRole('alert')).toContainText('Could not save the Subject.');
    await expect(name).toHaveValue('After outage');
    await expect(name).toBeEnabled();
    expect((await request.post(`${control}/control/data/on`)).ok()).toBe(true);
    await page.getByRole('button', { name: 'Create subject', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'After outage', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'After outage', exact: true })).toBeVisible();
  } finally {
    release();
    await request.post(`${control}/control/data/on`);
    await admin().auth.admin.deleteUser(learner.id);
  }
});

test('Subject creation rejects malformed public responses without leaking diagnostics or losing input', async ({ page }) => {
  const learner = await provisionAccount();
  try {
    await browserSignIn(page, learner.email);
    await page.getByRole('button', { name: 'Switch subject' }).click();
    await page.getByRole('menuitem', { name: 'Add subject' }).click();
    const name = page.getByLabel('Subject name', { exact: true });
    await name.fill('Keep my Subject');
    for (const response of [
      { status: 201, body: 'null' },
      { status: 201, body: JSON.stringify({ id: 42, name: 'Not saved' }) },
      { status: 201, body: JSON.stringify({ id: 'not-a-uuid', name: 'Not saved' }) },
      { status: 201, body: '[]' },
      { status: 503, body: JSON.stringify({ error: 'unsafe synthetic private diagnostic' }) },
      { status: 503, body: '{' },
    ]) {
      await page.route('**/api/subjects', route => route.fulfill({ ...response, contentType: 'application/json' }));
      await page.getByRole('button', { name: 'Create subject', exact: true }).click();
      await expect(page.getByRole('alert')).toContainText('Could not save the Subject.');
      await expect(page.getByRole('dialog')).not.toContainText('unsafe synthetic private diagnostic');
      await expect(name).toHaveValue('Keep my Subject');
      await expect(name).toBeEnabled();
      await page.unroute('**/api/subjects');
    }
    await page.route('**/api/subjects', route => route.abort('failed'));
    await page.getByRole('button', { name: 'Create subject', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Check your connection and try again.');
    await expect(name).toHaveValue('Keep my Subject');
    await page.unroute('**/api/subjects');
    await page.getByRole('button', { name: 'Create subject', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Keep my Subject', exact: true })).toBeVisible();
  } finally {
    await admin().auth.admin.deleteUser(learner.id);
  }
});
