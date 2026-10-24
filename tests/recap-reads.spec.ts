import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { admin, browserSignIn, provisionAccount } from './fixtures';

const headers = () => ({ origin: process.env.TEST_BASE_URL! });

async function createConversation(page: Page) {
  const subject = (await (await page.request.post('/api/subjects', { headers: headers(), data: { name: 'Recap lifecycle' } })).json()).id;
  await page.request.put('/api/settings/openai', { headers: headers(), data: { key: 'sk-synthetic-recap-read-key', model: 'gpt-5.4-mini-2026-03-17' } });
  const conversation = randomUUID();
  const sent = await page.request.post('/api/conversations', { headers: headers(), data: { subject, conversation, operation: randomUUID(), text: 'Discuss motion.' } });
  expect(await sent.text()).toContain('"status":"complete"');
  return { subject, conversation };
}

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

test('recap loading, malformed and failed reads stay distinct from a successful empty read and recover explicitly', async ({ page, request }) => {
  const owner = await provisionAccount();
  let releaseRead = () => {};
  const waitForRead = new Promise<void>(resolve => { releaseRead = resolve; });
  try {
    await request.post(`${process.env.TEST_AUTH_CONTROL_URL}/control/openai/reset`);
    await browserSignIn(page, owner.email);
    const { subject, conversation } = await createConversation(page);
    await page.route('**/api/recaps?*', async route => {
      await waitForRead;
      await route.continue();
    });
    await page.goto(`/?subject=${subject}&conversation=${conversation}`);
    const recaps = page.getByRole('region', { name: 'Practice recaps', exact: true });
    await expect(recaps.getByRole('status')).toHaveText('Loading reviewed understanding…');
    await expect(recaps).not.toContainText('Reviewed through activity');
    await expect(recaps).not.toContainText('Reviewed observations · 0');
    releaseRead();
    await expect(recaps).toContainText('Reviewed through activity 0');
    await expect(recaps).toContainText('Reviewed observations · 0');
    await page.unroute('**/api/recaps?*');
    for (const body of ['null', '[]', '{"recaps":[null],"observations":[],"through":0}', '{invalid', '{"error":"unsafe synthetic private recap diagnostic"}']) {
      await page.route('**/api/recaps?*', route => route.fulfill({ status: body.includes('diagnostic') ? 503 : 200, contentType: 'application/json', body }));
      await page.reload();
      await expect(recaps.getByRole('status')).toHaveText('Could not load reviewed understanding.');
      await expect(recaps).not.toContainText('Reviewed through activity');
      await expect(recaps).not.toContainText('Reviewed observations · 0');
      await expect(recaps).not.toContainText('unsafe synthetic');
      await page.unroute('**/api/recaps?*');
    }
    await page.reload();
    await expect(recaps).toContainText('Reviewed through activity 0');
    await expect(recaps).toContainText('Reviewed observations · 0');
  } finally {
    releaseRead();
    await admin().auth.admin.deleteUser(owner.id);
  }
});

test('a malformed post-review reload never reports fabricated success or repeats generation', async ({ page, request }) => {
  const owner = await provisionAccount();
  const control = process.env.TEST_AUTH_CONTROL_URL;
  try {
    await request.post(`${control}/control/openai/reset`);
    await browserSignIn(page, owner.email);
    const { subject, conversation } = await createConversation(page);
    const document = randomUUID();
    expect((await page.request.post('/api/documents', { headers: headers(), data: { id: document, subjectId: subject, revision: 0, title: 'Motion', description: '', blocks: [{ id: 'b', markdown: 'Velocity is displacement over time.' }] } })).ok()).toBe(true);
    expect((await page.request.post('/api/documents/approve', { headers: headers(), data: { id: document, subjectId: subject, revision: 1 } })).ok()).toBe(true);
    expect(await (await page.request.post('/api/conversations', { headers: headers(), data: { subject, conversation, operation: randomUUID(), text: 'Practise motion.', practice: true } })).text()).toContain('"status":"complete"');
    const operation = randomUUID();
    expect((await page.request.post('/api/recaps', { headers: headers(), data: { subject, conversation, operation, action: 'generate' } })).ok()).toBe(true);
    await page.goto(`/?subject=${subject}&conversation=${conversation}`);
    const recaps = page.getByRole('region', { name: 'Practice recaps', exact: true });
    await expect(recaps.getByRole('button', { name: 'Accept recap', exact: true })).toBeVisible();
    const callsBefore = await (await request.get(`${control}/control/openai/calls`)).json();
    await page.route('**/api/recaps?*', route => route.fulfill({ json: { recaps: [], observations: null, through: 2 } }));
    await recaps.getByRole('button', { name: 'Accept recap', exact: true }).click();
    await expect(recaps.getByRole('status')).toHaveText('Could not load reviewed understanding.');
    await expect(recaps).not.toContainText('Reviewed observation saved.');
    await expect(recaps).not.toContainText('Reviewed through activity');
    expect(await (await request.get(`${control}/control/openai/calls`)).json()).toEqual(callsBefore);
    await page.unroute('**/api/recaps?*');
    const persisted = await (await page.request.get(`/api/recaps?subject=${subject}&conversation=${conversation}`)).json();
    expect(persisted.observations).toHaveLength(1);
    expect(persisted.recaps[0].status).toBe('accepted');
    await page.reload();
    await expect(recaps).toContainText('Reviewed through activity 2');
    await expect(recaps).toContainText('Reviewed observations · 1');
  } finally {
    await admin().auth.admin.deleteUser(owner.id);
  }
});
