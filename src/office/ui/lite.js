// The page's one view, the list: every session as a row. Approvals on top, then
// needs you → working → resting; a search, and per row the conversation, its project and branch, what it
// is doing now, its context and its time. A click opens the session's page. First idea from agent-office's lite page (MIT).
import { $, el, fmtAgo, fmtClock, nowMs, short } from '../core/env.js';
import { dn, sessions } from '../core/sessions.js';
import { icon, TYPE_ICON } from './icons.js';
import { verb } from './event-text.js';
import { canClose, closeSessionProcess, openSession } from './session-drawer.js';
import { t as tr } from '../../i18n/index.js';

// a row held down asks to close its (resting) session; the next tap on it does, anything else cancels
let armedId = null, armedAt = 0, armTimer = 0, pressTimer = 0, press = null;
let query = '', head = null, permHost = null, listEl = null, emptyEl = null;
const GROUPS = ['wait', 'work', 'rest'];
const fold = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
const statusOf = (s) => (s.status === 'wait' ? 'wait' : s.status === 'rest' ? 'rest' : 'work');

// what it is doing now, in words of the work (not of the office: no lift, no shop)
function nowOf(s) {
  if (s.status === 'wait') return { ic: 'alert', text: s.last ? tr('lite.now.waitOn', { what: verb(s.last) }) : tr('lite.now.wait') };
  if (s.stuck) return { ic: 'alert', text: tr(`activity.doing.stuck.${s.stuck.kind}`, { label: short(s.stuck.label, 40), n: s.stuck.n, mins: s.stuck.mins }), warn: true };
  if (s.status === 'rest' && s.bg?.length) return { ic: 'terminal', text: tr('activity.doing.bg', { desc: s.bg[0].desc }) };
  if (s.status === 'rest') return { ic: 'check', text: s.lastReply ? short(s.lastReply.replace(/\s+/g, ' '), 140) : tr('lite.now.done'), muted: true };
  if (s.last) return { ic: TYPE_ICON[s.last.type] || 'sparkle', text: verb(s.last) };
  return { ic: 'sparkle', text: tr('activity.doing.working') };
}
function matches(s) {
  if (!query) return true;
  const hay = fold([dn(s), s.name, s.dir, s.git?.branch, s.lastPrompt].join(' '));
  return fold(query).split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}

/* ---------- hold a row to close its session ---------- */
function arm(id) { armedId = id; armedAt = Date.now(); clearTimeout(armTimer); armTimer = setTimeout(disarm, 5000); renderLite(); }
function disarm() { if (armedId === null) return; armedId = null; clearTimeout(armTimer); renderLite(); }
function cancelPress() { clearTimeout(pressTimer); press = null; }
function watchHold() {
  const box = $('lite');
  box.addEventListener('pointerdown', (e) => {
    const r = e.target.closest?.('.v2-row'); if (!r || e.button) return;
    if (armedId && r.dataset.sid !== armedId) disarm();
    const s = sessions.get(r.dataset.sid); if (!s || armedId === s.id || !canClose(s)) return;
    press = { x: e.clientX, y: e.clientY };
    clearTimeout(pressTimer); pressTimer = setTimeout(() => { press = null; navigator.vibrate?.(15); arm(s.id); }, 600);
  });
  box.addEventListener('pointermove', (e) => { if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) cancelPress(); });
  for (const t of ['pointerup', 'pointercancel']) box.addEventListener(t, cancelPress);
  box.addEventListener('contextmenu', (e) => { if (armedId && e.target.closest?.('.v2-row')) e.preventDefault(); });
  document.addEventListener('pointerdown', (e) => { if (armedId && !e.target.closest?.(`.v2-row[data-sid="${armedId}"]`)) disarm(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') disarm(); });
}

/* ---------- one row ---------- */
function row(s) {
  const st = statusOf(s), now = nowOf(s), b = el('button', `v2-row is-${st}${s.stuck && st !== 'rest' ? ' is-stuck' : ''}`);
  b.type = 'button'; b.dataset.sid = s.id;
  const dot = el('span', 'v2-dot'); dot.setAttribute('aria-hidden', 'true');
  const main = el('span', 'v2-main');
  main.append(el('b', 'v2-title', dn(s)));
  // under the name: only the branch, and only when it has uncommitted changes
  if (s.git?.branch && s.git.dirty) main.append(el('span', 'v2-sub', `${s.git.branch} •`));
  const doing = el('span', `v2-now${now.muted ? ' is-muted' : ''}${now.warn ? ' is-warn' : ''}`);
  doing.append(icon(now.ic), el('span', null, now.text));
  if (s.subs?.length && st !== 'rest') doing.append(el('small', 'v2-agents', tr('lite.subs', { n: s.subs.length })));
  if (s.status !== 'rest' && s.lastPrompt) doing.title = s.lastPrompt;
  // the context window (only when it is filling up) and the time (this task's, or since it rested)
  const ctx = el('span', 'v2-ctx');
  const pct = s.usage?.ctxMax ? Math.min(100, Math.round((s.usage.ctx / s.usage.ctxMax) * 100)) : 0;
  if (pct >= 60) {
    const track = el('span', 'v2-track'), bar = el('i');
    bar.style.width = `${pct}%`; track.append(bar); ctx.dataset.level = pct >= 85 ? 'high' : 'mid';
    ctx.append(track, el('small', null, `${pct}%`)); ctx.title = tr('lite.ctx', { pct });
  }
  const time = el('span', 'v2-time', st === 'rest' ? fmtAgo((nowMs() - (s.lastAt || nowMs())) / 1000) : s.taskStart ? fmtClock((nowMs() - s.taskStart) / 1000) : '');
  if (armedId === s.id) {
    b.classList.add('is-arming');
    doing.replaceChildren(icon('x'), el('span', null, tr('lite.closeAsk')));
    ctx.replaceChildren(); time.textContent = '';
  }
  b.append(dot, main, doing, ctx, time);
  b.addEventListener('click', () => {
    if (armedId === s.id) { if (Date.now() - armedAt > 700) { disarm(); closeSessionProcess(s); } return; }   // (the first 0.7 s: the release of the hold itself)
    openSession(s.id);
  });
  return b;
}
/* ---------- the view ---------- */
function build() {
  const box = $('lite'); if (!box || head) return;
  head = el('div', 'v2-head');
  const title = el('div', 'v2-h1'); title.append(el('h2', null, tr('lite.title')));
  const search = el('input', 'v2-search'); search.type = 'search'; search.id = 'lite-q'; search.placeholder = tr('lite.search'); search.setAttribute('aria-label', tr('lite.search')); search.autocomplete = 'off';
  search.addEventListener('input', () => { query = search.value.trim(); renderLite(); });
  search.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { search.value = ''; query = ''; renderLite(); search.blur(); } });
  head.append(title, search);
  permHost = el('div', 'v2-perms'); listEl = el('div', 'v2-list'); emptyEl = el('p', 'v2-empty'); emptyEl.hidden = true;
  box.replaceChildren(head, permHost, listEl, emptyEl);
}
export function showLite() {
  $('lite').hidden = false;
  // the approvals: at the top of the list
  build();
  const stack = $('perm-stack');
  if (stack && permHost && stack.parentNode !== permHost) permHost.append(stack);
  renderLite();
}
export function renderLite() {
  if (!listEl) return;
  const all = [...sessions.values()], list = all.filter(matches);
  // (the focused row keeps its focus through the redraw every 2 s)
  const focused = document.activeElement?.closest?.('.v2-row')?.dataset.sid, top = $('lite').scrollTop;
  const frag = document.createDocumentFragment();
  for (const g of GROUPS) {
    const rows = list.filter((s) => statusOf(s) === g).sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0)); if (!rows.length) continue;
    const sec = el('section', `v2-group is-${g}`), box = el('div', 'v2-rows');
    for (const s of rows) box.append(row(s));
    sec.append(el('h3', 'v2-gh', `${tr(`lite.${g}`)} · ${rows.length}`), box);
    frag.append(sec);
  }
  listEl.replaceChildren(frag);
  emptyEl.hidden = !!list.length;
  emptyEl.textContent = all.length ? tr('lite.none', { q: query }) : tr('lite.empty');
  if (focused) listEl.querySelector(`.v2-row[data-sid="${CSS.escape(focused)}"]`)?.focus({ preventScroll: true });
  $('lite').scrollTop = top;
}

export function setup() {
  watchHold();
  // "/" finds a session (not while typing somewhere)
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || document.body.classList.contains('is-archive') || e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    e.preventDefault(); $('lite-q')?.focus();
  });
  setInterval(() => { if (document.visibilityState === 'visible') renderLite(); }, 2000);
}
