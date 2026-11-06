// How a session's prompt cache reads on screen ("Đồng hồ bộ nhớ đệm", src/shared/cache-clock.js): the line under the
// session page's folder.
import { $, nowMs } from '../core/env.js';
import { state } from '../core/state.js';
import { sessions } from '../core/sessions.js';
import { cacheClock } from '../../shared/cache-clock.js';
import { t as tr, num } from '../../i18n/index.js';

const mins = (ms) => Math.max(1, Math.round(ms / 60e3));
const tok = (n) => (n >= 1e6 ? `${num(n / 1e6, 1)}M` : `${Math.max(1, Math.round(n / 1000))}k`);
/** cache (a session's, from the server) -> { state: 'warm' | 'cold' | 'none', text } ("Bộ nhớ đệm còn ấm ~23 phút") */
function cacheWords(cache) {
  const k = cacheClock(cache, nowMs());
  if (k.state === 'none') return { state: 'none', text: '' };
  const text = `${k.state === 'warm' ? tr('drawer.cache.warm', { n: mins(k.left) }) : tr(k.tokens ? 'drawer.cache.cold' : 'drawer.cache.coldNoSize', { tokens: tok(k.tokens) })}${k.guessed ? ` ${tr('drawer.cache.guessed')}` : ''}`;
  return { state: k.state, text };
}
/** The session drawer's line (session-drawer.js draws the rest of its head). */
export function drawDrawerCache() {
  const p = $('ds-cache'); if (!p) return;
  const s = sessions.get(state.selectedId), w = s ? cacheWords(s.cache) : { state: 'none', text: '' };
  p.hidden = !w.text; p.dataset.state = w.state;
  if (p.textContent !== w.text) p.textContent = w.text;
}

export function setup() {
  // the minutes go by between updates: the drawer's line again every 20 s while it is open
  setInterval(() => { if ($('dr-session') && !$('dr-session').hidden) drawDrawerCache(); }, 20_000);
}
