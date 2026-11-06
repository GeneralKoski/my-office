import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { HOME_DIR, DATA_DIR } from '../../playwright.config';

// New session (ui/folders.js, server/browse.mjs): the folders of this computer one level at a time, starred ones, the
// chats that ran in a folder, a new chat started there and a kept one carried on. tests/e2e/fake-claude.sh stands in for
// Claude Code; the e2e office's home is HOME_DIR.
const ROOT = path.join(HOME_DIR, 'Work'), ALPHA = path.join(ROOT, 'alpha'), BETA = path.join(ROOT, 'beta');
const SID = 'e2e-kept-0001';
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { try { localStorage.setItem('office-tips', 'seen'); } catch { /* private mode */ } }); });

const asked = () => { try { return fs.readFileSync(path.join(HOME_DIR, '.fake-claude.log'), 'utf8').trim().split('\n'); } catch { return []; } };
const actions = () => { try { return fs.readFileSync(path.join(DATA_DIR, 'actions.log'), 'utf8'); } catch { return ''; } };

test.beforeAll(() => {
  fs.mkdirSync(path.join(ALPHA, '.git'), { recursive: true }); fs.mkdirSync(path.join(BETA, 'inner'), { recursive: true }); fs.mkdirSync(path.join(ROOT, '.hidden'), { recursive: true });
  // a conversation Claude Code kept, that ran in alpha: the vault reads it
  const proj = path.join(HOME_DIR, '.claude', 'projects', '-e2e-alpha');
  fs.mkdirSync(proj, { recursive: true });
  const at = (n: number) => new Date(Date.now() - n * 60_000).toISOString();
  fs.writeFileSync(path.join(proj, `${SID}.jsonl`), [
    { type: 'user', cwd: ALPHA, sessionId: SID, timestamp: at(30), message: { role: 'user', content: 'plan the alpha release' } },
    { type: 'assistant', cwd: ALPHA, sessionId: SID, timestamp: at(29), message: { role: 'assistant', content: [{ type: 'text', text: 'Here is the plan.' }] } },
    { type: 'custom-title', customTitle: 'Alpha release plan', sessionId: SID },
  ].map((l) => JSON.stringify(l)).join('\n') + '\n');
});

test('the folders API: one level, git and chat counts, hidden ones on request, stars, and what is not a folder', async ({ request }) => {
  await request.get('/api/vault?fresh=1');   // (the vault reads the kept conversation now)
  const r = await (await request.get(`/api/browse?path=${encodeURIComponent(ROOT)}`)).json();
  expect(r.ok).toBe(true);
  expect(r.path).toBe(ROOT);
  expect(r.parent).toBe(HOME_DIR);
  expect(r.entries.map((e: { name: string }) => e.name)).toEqual(['alpha', 'beta']);
  const alpha = r.entries.find((e: { name: string }) => e.name === 'alpha'), beta = r.entries.find((e: { name: string }) => e.name === 'beta');
  expect(alpha).toMatchObject({ git: true, here: 1, deep: 1 });
  expect(beta).toMatchObject({ git: false, here: 0, deep: 0 });
  expect(r.deep).toBe(1);
  expect((await (await request.get(`/api/browse?path=${encodeURIComponent(ROOT)}&hidden=1`)).json()).entries.map((e: { name: string }) => e.name)).toContain('.hidden');
  // the chats that ran right in a folder (words masked as everywhere), newest first
  const a = await (await request.get(`/api/browse?path=${encodeURIComponent(ALPHA)}`)).json();
  expect(a.chats).toHaveLength(1);
  expect(a.chats[0]).toMatchObject({ sid: SID, title: 'Alpha release plan', n: 2 });
  expect((await (await request.get(`/api/browse?path=${encodeURIComponent(BETA)}`)).json()).chats).toEqual([]);
  // recent: the folder chats ran in
  expect((await (await request.get('/api/browse')).json()).recent.map((f: { path: string }) => f.path)).toContain(ALPHA);
  // not a folder, or one that is gone
  expect((await (await request.get(`/api/browse?path=${encodeURIComponent(path.join(ROOT, 'nope'))}`)).json())).toMatchObject({ ok: false, code: 'noDir' });
  expect((await (await request.get(`/api/browse?path=${encodeURIComponent(path.join(BETA, '..', '..', 'Work', 'alpha', '.git', 'x'))}`)).json()).ok).toBe(false);
  // starred and unstarred (kept for the next time)
  const on = await (await request.post('/api/browse/star', { data: { path: BETA, on: true } })).json();
  expect(on.favs.map((f: { path: string }) => f.path)).toEqual([BETA]);
  expect((await (await request.get('/api/browse')).json()).favs.map((f: { path: string }) => f.path)).toEqual([BETA]);
  expect((await (await request.post('/api/browse/star', { data: { path: BETA, on: false } })).json()).favs).toEqual([]);
  expect((await (await request.post('/api/browse/star', { data: { path: path.join(ROOT, 'nope'), on: true } })).json()).ok).toBe(false);
});

const kept = (sid: string, cwd: string) => {
  const proj = path.join(HOME_DIR, '.claude', 'projects', `-e2e-${sid}`);
  fs.mkdirSync(cwd, { recursive: true }); fs.mkdirSync(proj, { recursive: true });
  fs.writeFileSync(path.join(proj, `${sid}.jsonl`), `${JSON.stringify({ type: 'user', cwd, sessionId: sid, timestamp: new Date().toISOString(), message: { role: 'user', content: `work in ${sid}` } })}\n`);
};

test('recent folders: read again when the page opens, and two with one name say where each is', async ({ page, request }) => {
  test.setTimeout(150_000);
  await request.get('/api/vault?fresh=1');
  // chats made after the last reading: the page's own opening reads them
  kept('e2e-dup-0001', path.join(HOME_DIR, 'Other', 'one', 'korsia')); kept('e2e-dup-0002', path.join(HOME_DIR, 'Other', 'two', 'korsia'));
  expect((await (await request.get('/api/browse')).json()).recent.map((f: { name: string }) => f.name)).not.toContain('korsia');
  expect((await (await request.get('/api/browse?fresh=1')).json()).recent.filter((f: { name: string }) => f.name === 'korsia')).toHaveLength(2);
  await page.goto('/');
  await page.locator('#btn-new').click({ timeout: 120_000 });
  const recent = page.locator('.fo-rsec', { hasText: 'Recent' }).locator('.fo-ritem', { hasText: 'korsia' });
  await expect(recent).toHaveCount(2);
  await expect(recent.locator('small')).toHaveCount(2);
  expect((await recent.locator('small').allTextContents()).sort()).toEqual(['~/Other/one', '~/Other/two']);
  // one name alone: no second line
  await expect(page.locator('.fo-rsec', { hasText: 'Recent' }).locator('.fo-ritem', { hasText: 'alpha' }).locator('small')).toHaveCount(0);
});

test('a new chat or a kept one: any folder this computer picks, a conversation carried on where it ran', async ({ request }) => {
  await request.get('/api/vault?fresh=1');
  // (a folder no session has worked in: still fine from this computer's own page)
  const r = await (await request.post('/api/tasks', { data: { dir: BETA, text: 'make the beta page', fresh: true } })).json();
  expect(r.ok).toBe(true);
  await expect.poll(actions, { timeout: 20_000 }).toContain(`new in ${BETA} started make the beta page`);
  // not a folder that exists: refused, whoever asks
  expect((await request.post('/api/tasks', { data: { dir: path.join(ROOT, 'nope'), text: 'x' } })).status()).toBe(400);
  expect((await request.post('/api/tasks', { data: { dir: '', text: 'x' } })).status()).toBe(400);
  await expect.poll(async () => (await (await request.get('/api/tasks')).json()).running.length, { timeout: 20_000 }).toBe(0);
  // a kept conversation: carried on with its own id
  const c = await (await request.post('/api/tasks', { data: { sid: SID, dir: ALPHA, text: 'now write the changelog' } })).json();
  expect(c.ok).toBe(true);
  await expect.poll(() => asked().at(-1) || '', { timeout: 20_000 }).toMatch(new RegExp(`^-p now write the changelog .*--resume ${SID}`));
  expect(asked().at(-1)).not.toContain('--fork-session');
  await expect.poll(actions, { timeout: 20_000 }).toContain(`carry ${SID} started now write the changelog`);
});

test('the page: browse down from home, star a folder, start a chat there, carry on a kept one', async ({ page, request }) => {
  test.setTimeout(150_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await request.get('/api/vault?fresh=1');
  await request.post('/api/browse/star', { data: { path: BETA, on: false } });
  await page.goto('/');
  await page.locator('#btn-new').click({ timeout: 120_000 });
  const here = page.locator('#fo-here');
  await expect(page.locator('#folders')).toBeVisible();
  await expect(page.locator('#fo-crumbs .fo-seg.is-last')).toHaveText('Home');
  // down to Work, then alpha (a git project, with the chat that ran in it)
  await page.locator('.fo-card', { hasText: 'Work' }).locator('.fo-cgo').click();
  await expect(page.locator('#fo-crumbs')).toContainText('Work');
  await expect(page.locator('.fo-card')).toHaveCount(2);
  await expect(page.locator('.fo-card', { hasText: 'alpha' }).locator('.fo-tag')).toHaveText('git');
  await expect(page.locator('.fo-card', { hasText: 'alpha' })).toContainText('1 chat inside');
  // the filter
  await page.locator('#fo-q').fill('bet');
  await expect(page.locator('.fo-card')).toHaveCount(1);
  await page.locator('#fo-q').fill('');
  // starred: it shows in the rail, and stays through a reload
  const card = page.locator('.fo-card', { hasText: 'beta' });
  await card.hover(); await card.locator('.fo-star').click();
  await expect(page.locator('.fo-rsec').first()).toContainText('beta');
  await page.reload();
  await page.locator('#btn-new').click();
  await expect(page.locator('.fo-rsec').first().locator('.fo-rgo', { hasText: 'beta' })).toBeVisible();
  // alpha: its chat, and a new one with Enter
  await page.locator('.fo-card', { hasText: 'alpha' }).locator('.fo-cgo').click();
  await expect(here.locator('h3')).toHaveText('alpha');
  await expect(here.locator('.fo-chat')).toContainText('Alpha release plan');
  await here.locator('.fo-new').click();
  await here.locator('.fo-compose textarea').fill('build the alpha page');
  await page.keyboard.press('Enter');
  await expect(page.locator('#folders')).toBeHidden();
  await expect.poll(actions, { timeout: 20_000 }).toContain(`new in ${ALPHA} started build the alpha page`);
  // the kept chat: "Carry on" opens the box for it
  await expect.poll(async () => (await (await request.get('/api/tasks')).json()).running.length, { timeout: 20_000 }).toBe(0);
  await page.locator('#btn-new').click();
  await expect(here.locator('h3')).toHaveText('alpha');
  await here.locator('.fo-chat', { hasText: 'Alpha release plan' }).getByRole('button', { name: 'Carry on' }).click();
  await expect(here.locator('.fo-compose h4')).toContainText('Alpha release plan');
  await here.locator('.fo-compose textarea').fill('and a test too');
  await page.keyboard.press('Enter');
  await expect(page.locator('#folders')).toBeHidden();
  await expect.poll(() => asked().find((l) => l.includes('and a test too')) || '', { timeout: 20_000 }).toContain(`--resume ${SID}`);
  // Esc closes the box, then the page
  await page.locator('#btn-new').click();
  await here.locator('.fo-new').click();
  await page.locator('.fo-compose textarea').press('Escape');
  await expect(here.locator('.fo-compose')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#folders')).toBeHidden();
  expect(errors).toEqual([]);
});
