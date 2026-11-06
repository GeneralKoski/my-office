import path from 'node:path';
import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { HOME_DIR } from '../../playwright.config';

// The prompt cache's clock (src/shared/cache-clock.js): the drawer's line and the list row say how long a resting
// session's cache stays warm.
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { try { localStorage.setItem('office-tips', 'seen'); localStorage.setItem('office-quality', 'low'); } catch { /* private mode */ } }); });

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|WebGL/i.test(m.text())) errors.push(m.text()); });
  return errors;
}
// a session that did one turn and rests; its status line says (or doesn't) how its prompt cache stands
async function restingSession(request: APIRequestContext, sid: string) {
  const base = { session_id: sid, cwd: path.join(HOME_DIR, sid), transcript_path: path.join(HOME_DIR, `${sid}.jsonl`) };
  await request.post('/event', { data: { ...base, hook_event_name: 'SessionStart', source: 'startup' } });
  await request.post('/event', { data: { ...base, hook_event_name: 'UserPromptSubmit', prompt: 'tidy the README' } });
  await request.post('/event', { data: { ...base, hook_event_name: 'Stop', last_assistant_message: 'Done, shall I also fix the links?' } });
  // (the status line's own fields: code.claude.com/docs/en/statusline)
  const status = (prompt_cache: object | undefined) => request.post('/hook/status', { data: { session_id: sid, context_window: { context_window_size: 200000, used_percentage: 90 }, cost: { total_cost_usd: 1.2 }, prompt_cache } });
  return { base, status, name: `${sid}-${sid.slice(0, 2)}`, end: () => request.post('/event', { data: { ...base, hook_event_name: 'SessionEnd', reason: 'other' } }) };
}

test('no word from Claude Code (an older version): guessed from the end of the turn, and said to be a guess', async ({ page, request }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await page.addInitScript(() => { try { localStorage.setItem('office-lite', 'on'); } catch { /* private mode */ } });
  const s = await restingSession(request, `cg-${Date.now() % 1e6}`);
  await page.goto('/');
  await page.locator('#lite .v2-row', { hasText: s.name }).click({ timeout: 120_000 });   // (the 2D view: its own list of the sessions)
  // (an API key's five minutes, or a subscription's hour once the office has heard of plan limits, as it has when
  // what-eats-your-plan's spec ran first on the same office)
  await expect(page.locator('#ds-cache')).toHaveText(/^Prompt cache still warm for ~(?:[345]|5[5-9]|60) minutes \(estimated\)$/);
  await expect(page.locator('#lite .v2-row', { hasText: s.name }).locator('.v2-sub')).toContainText(/☕ warm (?:[345]|5[5-9]|60) min/);
  await s.end();
  expect(errors).toEqual([]);
});
