// Stuck sessions ("Ngắt vòng lặp kẹt", server/loops.mjs): the row in Settings → More (on or off, after how many failures,
// after how many minutes of spending with nothing edited). The line in the list is ui/lite.js.
import { $, STATIC } from '../core/env.js';
import { TOKEN } from '../net/live.js';
import { toast } from './activity.js';
import { t as tr } from '../../i18n/index.js';

const DEMO = STATIC || new URLSearchParams(location.search).has('demo');
const tq = () => (TOKEN ? `?k=${encodeURIComponent(TOKEN)}` : '');
const post = (url, body) => fetch(`${url}${tq()}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((x) => x.json()).catch(() => null);

/* ---------- Settings → More: on or off, and its two thresholds (kept by the server: data/prefs.json) ---------- */
let conf = null;
function drawSettings() {
  const box = $('st-loop'); if (!box || !conf) return;
  box.hidden = false;
  box.querySelector('[data-loop-tgl]').setAttribute('aria-checked', String(!!conf.on));
  for (const b of box.querySelectorAll('[data-loop-n]')) { b.setAttribute('aria-pressed', String(Number(b.dataset.loopN) === conf.n)); b.disabled = !conf.on; }
  for (const b of box.querySelectorAll('[data-loop-min]')) { b.setAttribute('aria-pressed', String(Number(b.dataset.loopMin) === conf.min)); b.disabled = !conf.on; }
  $('st-loop-install').hidden = !!conf.hookAt || !conf.on;   // (the hook never heard from: install has to run again)
}
async function load() { if (DEMO) return; const r = await fetch(`/api/loop${tq()}`).then((x) => x.json()).catch(() => null); if (r?.ok) { conf = r; drawSettings(); } }
async function save(change) {
  const r = await post('/api/loop', { op: 'config', ...conf, ...change });
  if (r?.ok) { conf = r; drawSettings(); } else toast(r?.message || tr('drawer.unreachable'), 6000);
}

export function setup() {
  const box = $('st-loop'); if (!box || DEMO) return;
  $('btn-look')?.addEventListener('click', () => { if (!$('pop-look').hidden) load(); });   // (fresh each time Settings opens)
  box.addEventListener('click', (e) => {
    if (!conf) return;
    const t = e.target.closest('[data-loop-tgl]'); if (t) { save({ on: !conf.on }); return; }
    const n = e.target.closest('[data-loop-n]'); if (n) { save({ n: Number(n.dataset.loopN) }); return; }
    const m = e.target.closest('[data-loop-min]'); if (m) save({ min: Number(m.dataset.loopMin) });
  });
}
