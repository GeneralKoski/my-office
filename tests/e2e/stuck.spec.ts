import path from 'node:path';
import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { HOME_DIR } from '../../playwright.config';

// The stuck-loop breaker (server/loops.mjs, ui/stuck.js): the hooks of a session that runs the same failing command
// again and again, the call that gets denied, and Settings.
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { try { localStorage.setItem('office-tips', 'seen'); localStorage.setItem('office-lite', 'on'); } catch { /* private mode */ } }); });

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|WebGL/i.test(m.text())) errors.push(m.text()); });
  return errors;
}
// a session, then `npm test` failing the same way `times` times (each try asked of the synchronous hook first)
async function loopingSession(request: APIRequestContext, sid: string, times = 3) {
  const base = { session_id: sid, cwd: path.join(HOME_DIR, sid), transcript_path: path.join(HOME_DIR, `${sid}.jsonl`) };   // (a folder of its own: the person is named after it)
  const call = { ...base, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'npm test', description: 'Run the tests' } };
  await request.post('/event', { data: { ...base, hook_event_name: 'SessionStart', source: 'startup' } });
  await request.post('/event', { data: { ...base, hook_event_name: 'UserPromptSubmit', prompt: 'make the tests pass' } });
  for (let i = 0; i < times; i++) {
    const r = await request.post('/hook/loop', { data: call });
    expect(await r.text()).toBe('');   // (let through: nothing to say)
    await request.post('/event', { data: call });
    await request.post('/event', { data: { ...call, hook_event_name: 'PostToolUseFailure', error: `Exit code 1\nError: connect ECONNREFUSED 127.0.0.1:5432 (after ${100 + i * 37}ms)`, is_interrupt: false } });
  }
  // another try: the synchronous hook's answer (Claude Code runs the async one beside it, which marks the step begun)
  const check = async () => {
    const [r] = await Promise.all([request.post('/hook/loop', { data: call }), request.post('/event', { data: call })]);
    const t = await r.text(); return t ? JSON.parse(t) : null;
  };
  const end = () => request.post('/event', { data: { ...base, hook_event_name: 'SessionEnd', reason: 'other' } });   // (gone: the next test's office has only its own)
  return { base, call, check, end, name: `${sid}-${sid.slice(0, 2)}` };
}

test('Settings: the breaker can be turned off (then nothing is denied) and its threshold changed', async ({ page, request }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await page.goto('/');
  await expect(async () => { if (!(await page.locator('#pop-look').isVisible())) await page.click('#btn-look'); await expect(page.locator('#pop-look')).toBeVisible({ timeout: 2000 }); }).toPass({ timeout: 120_000 });
  await page.click('#st-tab-more');
  const box = page.locator('#st-loop');
  await expect(box).toBeVisible({ timeout: 20_000 });
  await expect(box.locator('[data-loop-n="3"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(box.locator('[data-loop-min="10"]')).toHaveAttribute('aria-pressed', 'true');
  await box.locator('[data-loop-n="2"]').click();
  await expect(box.locator('[data-loop-n="2"]')).toHaveAttribute('aria-pressed', 'true');
  const two = await loopingSession(request, `e2e-stuck-two-${Date.now()}`, 2);
  expect((await two.check()).hookSpecificOutput.permissionDecision).toBe('deny');
  await box.locator('[data-loop-tgl]').click();
  await expect(box.locator('[data-loop-tgl]')).toHaveAttribute('aria-checked', 'false');
  const off = await loopingSession(request, `e2e-stuck-off-${Date.now()}`, 5);
  expect(await off.check()).toBeNull();
  // back as it was, for the other tests
  await box.locator('[data-loop-tgl]').click();
  await box.locator('[data-loop-n="3"]').click();
  await expect(box.locator('[data-loop-n="3"]')).toHaveAttribute('aria-pressed', 'true');
  expect((await (await request.get('/api/loop')).json())).toMatchObject({ on: true, n: 3, min: 10 });
  await two.end(); await off.end();
  expect(errors).toEqual([]);
});
