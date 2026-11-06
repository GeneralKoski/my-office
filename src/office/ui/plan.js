// The plan's limits (from Claude Code's status line): the 5 hours and the week as two rings in the top bar, a toast as
// a window fills up, and the words for the accounts the session page's "Change account" lists.
import { state } from '../core/state.js';
import { $, el, hhmm, pad2 } from '../core/env.js';
import { toast } from './activity.js';
import { t as tr } from '../../i18n/index.js';

export const limitWarned = new Set();
// 5 hours first, then the week over all models (personal plans), then each model's week, then anything else
// (a model's week: the server labels it "Opus (week)")
const WIN_ORDER = (w) => (w.key === 'session' ? 0 : w.key === 'weekly' ? 1 : /week/i.test(w.label) ? 2 : 3);
export const liveWindows = () => (state.limits?.windows || [state.limits?.five && { ...state.limits.five, key: 'session', label: tr('mac.plan.fiveHour') }, state.limits?.seven && { ...state.limits.seven, key: 'weekly', label: tr('mac.plan.week') }].filter(Boolean))
  .filter((w) => !w.resetsAt || w.resetsAt > Date.now()).map((w) => (w.key === 'weekly' && w.label === '7 ngày' ? { ...w, label: tr('mac.plan.week') } : w))
  .sort((a, b) => WIN_ORDER(a) - WIN_ORDER(b));
export function resetText(ts) {
  const d = new Date(ts), now = new Date(), t = hhmm(ts);
  if (d.toDateString() === now.toDateString()) return tr('mac.plan.at', { time: t });
  const days = tr('mac.plan.weekdays', null, 'list');
  return tr('mac.plan.date', { day: days[d.getDay()], d: pad2(d.getDate()), m: pad2(d.getMonth() + 1), time: t });
}
const liveOf = (o) => (o.windows || []).filter((w) => !w.resetsAt || w.resetsAt > Date.now()).sort((a, b) => WIN_ORDER(a) - WIN_ORDER(b));
const tightest = (ws) => ws.reduce((a, w) => (!a || w.pct > a.pct ? w : a), null);
export const acctName = (slug, label) => label || (slug ? tr('mac.plan.otherAccount', { name: slug }) : tr('mac.plan.mainAccount'));
function copyButton(text, label = tr('mac.add.copy')) {
  const b = el('button', 'pa-copy', label); b.type = 'button';
  b.addEventListener('click', () => navigator.clipboard?.writeText(text).then(() => { b.textContent = tr('mac.add.copied'); setTimeout(() => { b.textContent = label; }, 1600); }).catch(() => {}));
  return b;
}
export function codeBox(text) { const box = el('div', 'pa-code'); box.append(el('code', null, text), copyButton(text)); return box; }
// the server moved the conversations open on an account that ran out
export function acctMoved(d) {
  if (!d.names?.length) return;
  toast(tr('mac.plan.moved', { from: d.from, to: d.to, n: d.names.length, names: d.names.join(', ') }), 10000);
}
// the server moved new sessions to another account (one ran out, or came back)
export function acctSwitched(d) {
  if (d.why !== 'auto' || !d.from) return;
  toast(d.until > Date.now() ? tr('mac.plan.switched', { from: d.from, to: d.to, when: resetText(d.until) }) : tr('mac.plan.switchedBack', { to: d.to }), 9000);
}
// the top bar: the 5 hours and the week as two rings that fill up slowly, green to amber to red with the percentage
const ringColor = (pct) => `hsl(${Math.round(pct < 50 ? 145 : 145 - ((Math.min(pct, 100) - 50) * 140) / 50)} 70% 52%)`;
let rings = null;
function planRings(sess, week, fallback) {
  const box = $('plan-lite');
  if (!rings) {
    rings = {};
    for (const k of ['session', 'weekly']) {
      const it = el('span', 'pl-item'), ring = el('i', 'pl-ring'), lab = el('span', 'pl-lab'), val = el('b', 'pl-val');
      it.append(ring, lab, val); box.append(it); rings[k] = { it, ring, lab, val };
    }
    rings.none = el('span', 'pl-lab'); box.append(rings.none);
    void box.offsetWidth;   // (drawn once empty, so the first fill is seen)
  }
  for (const [k, w, label] of [['session', sess, tr('mac.plan.fiveHour')], ['weekly', week, tr('mac.plan.week')]]) {
    const r = rings[k]; r.it.hidden = !w; if (!w) continue;
    const pct = Math.round(w.pct);
    r.ring.style.setProperty('--p', Math.min(100, pct)); r.ring.style.setProperty('--c', ringColor(pct));
    r.lab.textContent = label; r.val.textContent = `${pct}%`;
  }
  rings.none.textContent = sess || week ? '' : fallback;
}
export function renderLimits() {
  const ws = liveWindows(), others = state.limits?.others || [], top = tightest(ws);
  $('btn-plan').hidden = false;
  // other accounts: their tightest limit after the main one ("5 h 29% · org2 12%")
  const more = others.map((o) => { const t = tightest(liveOf(o)); return t ? ` · ${o.label || o.name} ${Math.round(t.pct)}%` : ''; }).join('');
  const mini = (top ? `${top.key === 'session' ? tr('mac.plan.fiveHour') : top.label} ${Math.round(top.pct)}%` : state.limitsNote ? tr('mac.plan.unread') : tr('mac.plan.reading')) + more;
  planRings(ws.find((w) => w.key === 'session'), ws.find((w) => w.key === 'weekly'), mini);
  for (const w of [...ws, ...others.flatMap((o) => liveOf(o).map((x) => ({ ...x, key: `${o.name}:${x.key}`, label: `${o.name} · ${x.label}` })))]) {
    if (w.pct < 80) continue;
    const key = `${w.key}:${w.resetsAt}:${w.pct >= 95 ? 95 : 80}`;
    if (limitWarned.has(key)) continue;
    limitWarned.add(key);
    toast(tr('mac.plan.warn', { pct: Math.round(w.pct), label: w.label, reset: w.resetsAt ? tr('mac.plan.warnReset', { when: resetText(w.resetsAt) }) : '' }), 6000);
  }
}

export function setup() {
  state.limits = null; state.limitsNote = '';
  setInterval(renderLimits, 30000);
}
