import { test, expect, type Page } from '@playwright/test';

// The list (ui/lite.js): the sessions as rows, always all three groups. The demo's sessions, set to known states.
type S = { id: string, name: string, status: string };
type Office = { sessions: Map<string, S>, upsert: (s: object) => void, pauseDemo: () => void, emit: (d: object) => void };
const office = (page: Page) => page.evaluate.bind(page);
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { try { localStorage.setItem('office-tips', 'seen'); localStorage.setItem('office-quality', 'low'); } catch { /* private mode */ } }); });

async function setUp(page: Page) {
  await page.goto('/?demo&debug&layout=pro');
  await expect(page.locator('#lite .v2-row').first()).toBeVisible({ timeout: 90_000 });
  // three of them in known states: one waiting for you, one at work (a checklist, a subagent), one resting
  return office(page)(() => {
    const o = (window as unknown as { __office: Office }).__office; o.pauseDemo();
    const [a, b, c, ...rest] = [...o.sessions.values()];
    o.upsert({ ...a, status: 'wait', last: { type: 'bash', label: 'npm run deploy' }, subs: [], bg: [] });
    o.upsert({ ...b, status: 'work', taskStart: Date.now() - 65_000, last: { type: 'edit', label: 'src/cart.ts' }, todos: [{ status: 'done', text: 'a' }, { status: 'doing', text: 'b' }, { status: 'todo', text: 'c' }], subs: [{ id: 'v2-sub', type: 'Explore', desc: 'find the pager', last: null }], bg: [] });
    o.upsert({ ...c, status: 'rest', lastReply: 'All done: the cart pages now.', subs: [], bg: [] });
    for (const x of rest) o.upsert({ ...x, status: 'rest', subs: [], bg: [] });
    return [a.name, b.name, c.name, o.sessions.size];
  });
}

test('list: approvals on top, then needs you / working / resting, all at once; search and "/", a click opens the session page', async ({ page }) => {
  test.setTimeout(150_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const [waiting, working, resting, n] = await setUp(page);
  const lite = page.locator('#lite');
  // no filters: the three groups are always all there, and the page has no 3D
  await expect(page.locator('#stage')).toHaveCount(0);
  await expect(lite.locator('.v2-tab')).toHaveCount(0);
  await expect(lite.locator('.v2-group.is-wait .v2-row')).toHaveCount(1);
  await expect(lite.locator('.v2-group.is-wait .v2-row')).toContainText(waiting as string);
  await expect(lite.locator('.v2-group.is-wait .v2-now')).toContainText('npm run deploy');
  // working: what it does in words of the work, its checklist, its time, how many subagents
  const w = lite.locator('.v2-row', { hasText: working as string });
  await expect(w.locator('.v2-now')).toContainText('src/cart.ts');
  await expect(w.locator('.v2-time')).toHaveText(/^1:0\d$/);
  await expect(w.locator('.v2-agents')).toBeVisible();
  await expect(lite.locator('.v2-row', { hasText: resting as string }).locator('.v2-now')).toContainText('All done: the cart pages now.');
  await expect(lite.locator('.v2-row')).toHaveCount(n as number);
  // "/" finds one; Esc clears it
  await page.locator('body').click({ position: { x: 5, y: 300 } });
  await page.keyboard.press('/');
  await expect(page.locator('#lite-q')).toBeFocused();
  await page.keyboard.type(resting as string);
  await expect(lite.locator('.v2-row')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(lite.locator('.v2-row')).toHaveCount(n as number);
  // an approval: at the top of the list, in the page's flow, with its buttons; a badge in the top bar counts it
  await office(page)((id) => { const o = (window as unknown as { __office: Office }).__office; o.emit({ k: 'perm', p: { id: 'v2p', sess: id, name: 'demo', tool: 'Bash', type: 'bash', label: 'git push', detail: 'git push origin main', at: Date.now(), until: Date.now() + 45_000, kind: 'perm' } }); },
    await office(page)(() => [...(window as unknown as { __office: Office }).__office.sessions.keys()][0]));
  const card = lite.locator('.v2-perms .perm-card');
  await expect(card).toBeVisible();
  await expect(page.locator('#btn-approvals')).toBeVisible();
  await expect(page.locator('#approvals-n')).toHaveText('1');
  const [cardBox, firstRow] = [await card.boundingBox(), await lite.locator('.v2-row').first().boundingBox()];
  expect(cardBox!.y).toBeLessThan(firstRow!.y);
  // a click opens the session on a page of its own: the card floats over it, and the badge goes back to the list
  await w.click();
  await expect(page.locator('#dr-session')).toBeVisible();
  await expect(page.locator('#perm-stack')).toHaveClass(/is-float/);
  await expect(page.locator('#perm-stack .perm-card')).toBeVisible();
  await page.locator('#btn-approvals').click();
  await expect(page.locator('#dr-session')).toBeHidden();
  await card.locator('.pc-allow').click();
  await expect(card).toHaveCount(0);
  await expect(page.locator('#btn-approvals')).toBeHidden();
  expect(errors).toEqual([]);
});

test('a phone: two tabs (Sessions, Approve), rows that fit, nothing off the screen', async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await setUp(page);
  await expect(page.locator('html')).toHaveClass(/is-phone/);
  await expect(page.locator('.ph-tab')).toHaveCount(2);
  expect(await page.locator('#lite').evaluate((e) => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  // no way to choose a folder from a phone: that is this computer's
  await expect(page.locator('#btn-new')).toBeHidden();
});
