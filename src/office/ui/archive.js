// The archive: every conversation Claude Code has kept (server/vault.mjs), whatever its folder, in one list with its path.
// Searched by title, folder and what was said (accents or not); a click reads it, and a pencil renames it (a `custom-title`
// line in its transcript, as /rename writes, so the editor and the terminal show the new title too).
import { state } from '../core/state.js';
import { $, el, hhmm } from '../core/env.js';
import { icon } from './icons.js';
import { TOKEN } from '../net/live.js';
import { DEMO } from '../demo/demo.js';
import { buildChat, closeSession } from './session-drawer.js';
import { renameChat } from './rename.js';
import { t as tr, locale } from '../../i18n/index.js';

let q = '', seq = 0, typeT = 0, items = [], current = null;   // (current: the conversation being read)
const tq = () => (TOKEN ? `&k=${encodeURIComponent(TOKEN)}` : '');
const isOpen = () => !$('archive').hidden;
const day = (ms) => new Date(ms).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: new Date(ms).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
const when = (ms) => (ms ? `${day(ms)} ${hhmm(ms)}` : '');
const titleOf = (x) => x.title || x.first?.replace(/\s+/g, ' ').trim().slice(0, 100) || tr('archive.untitled');

async function ask(params) {
  if (DEMO) return { ok: false };
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  try { return await (await fetch(`/api/vault?${s}${tq()}`)).json(); } catch { return { ok: false }; }
}
const pencil = (label) => { const b = el('button', 'ar-edit'); b.type = 'button'; b.title = label; b.setAttribute('aria-label', label); b.append(icon('pencil')); return b; };

/* ---------- the list ---------- */
function rowOf(x) {
  const li = el('li', 'ar-item'), open = el('button', `ar-row${x.gone ? ' is-gone' : ''}`); open.type = 'button'; open.dataset.sid = x.sid;
  const main = el('span', 'ar-main'), head = el('span', 'ar-h');
  const t = el('b', 'ar-t', titleOf(x));
  head.append(t);
  if (x.gone) { const g = el('span', 'ar-badge', tr('archive.gone')); g.title = tr('archive.goneTitle'); head.append(g); }
  main.append(head, el('span', 'ar-path', x.cwd || '–'));
  if (x.snip) main.append(el('span', 'ar-snip', x.snip));
  open.append(main, el('span', 'ar-meta', [when(x.end), tr('archive.msgs', { n: x.n })].join(' · ')));
  open.addEventListener('click', () => openChat(x));
  const ed = pencil(tr('archive.rename'));
  ed.addEventListener('click', async (e) => { e.stopPropagation(); const n = await renameChat(x); if (n) { x.title = n; t.textContent = titleOf(x); } });
  li.append(open, ed);
  return li;
}
function drawList() {
  const box = $('ar-scroll');
  if (!items.length) { box.replaceChildren(el('p', 'ar-empty', q ? tr('archive.none', { q }) : tr('archive.empty'))); return; }
  const ul = el('ul', 'ar-rows');
  for (const x of items) ul.append(rowOf(x));
  const top = box.scrollTop;
  box.replaceChildren(ul); box.scrollTop = top;
}
async function load(fresh = false) {
  const n = ++seq, d = await ask({ q, limit: 3000, ...(fresh && { fresh: '1' }) });
  if (n !== seq) return;
  if (!d?.ok) { $('ar-count').textContent = ''; $('ar-scroll').replaceChildren(el('p', 'ar-empty', d?.off ? tr('archive.off') : tr('archive.unreadable'))); return; }
  items = d.items;
  const gone = d.stats?.gone || 0;
  $('ar-count').textContent = [tr('archive.count', { n: d.stats?.n ?? items.length }), gone ? tr('archive.goneCount', { n: gone }) : ''].filter(Boolean).join(' · ');
  drawList();
}

/* ---------- reading one ---------- */
async function openChat(x) {
  current = x;
  $('ar-list-view').hidden = true;
  const box = $('ar-reader'); box.hidden = false;
  box.replaceChildren(el('p', 'ar-empty', tr('archive.loading')));
  const d = await ask({ sid: x.sid });
  if (current !== x) return;
  if (!d?.ok) { box.replaceChildren(readerHead(x), el('p', 'ar-empty', tr('archive.unreadable'))); return; }
  const rec = d.rec;
  const chat = buildChat(rec.msgs.map((m) => ({ role: m.r === 'u' ? 'user' : 'assistant', text: m.t, ts: m.at })));
  const body = el('div', 'ar-body'); body.append(chat);
  box.replaceChildren(readerHead({ ...x, cwd: rec.cwd || x.cwd, start: rec.start, end: rec.end, gone: rec.gone }), body);
}
function readerHead(x) {
  const head = el('header', 'ar-head ar-rhead');
  const back = el('button', 'icon-btn ar-back'); back.type = 'button'; back.title = tr('archive.back'); back.setAttribute('aria-label', tr('archive.back')); back.append(icon('back'));
  back.addEventListener('click', closeChat);
  const info = el('div', 'ar-rinfo');
  const t = el('h2', null, titleOf(x));
  const row = el('div', 'ar-rtitle'); row.append(t);
  const ed = pencil(tr('archive.rename'));
  ed.addEventListener('click', async () => { const n = await renameChat(x); if (n) { x.title = n; t.textContent = titleOf(x); } });
  row.append(ed);
  if (x.gone) { const g = el('span', 'ar-badge', tr('archive.gone')); g.title = tr('archive.goneTitle'); row.append(g); }
  info.append(row, el('p', 'ar-path', x.cwd || '–'), el('p', 'ar-rmeta', [[when(x.start), when(x.end) !== when(x.start) ? `→ ${when(x.end)}` : ''].filter(Boolean).join(' '), tr('archive.msgs', { n: x.n })].filter(Boolean).join(' · ')));
  head.append(back, info);
  if (!x.gone) {
    const cmd = `claude --resume ${x.sid}`, b = el('button', 'btn btn--sm ar-copy'); b.type = 'button'; b.title = tr('archive.resumeTitle'); b.textContent = tr('archive.resume');
    b.addEventListener('click', async () => { try { await navigator.clipboard.writeText(cmd); b.textContent = tr('archive.copied'); setTimeout(() => { b.textContent = tr('archive.resume'); }, 1600); } catch { /* blocked */ } });
    head.append(b);
  }
  return head;
}
function closeChat() { current = null; $('ar-reader').hidden = true; $('ar-list-view').hidden = false; $('ar-q').focus({ preventScroll: true }); }

/* ---------- open and close ---------- */
export function closeArchive() {
  if (!isOpen()) return;
  $('archive').hidden = true; document.body.classList.remove('is-archive'); $('btn-archive').setAttribute('aria-pressed', 'false');
  current = null; $('ar-reader').hidden = true; $('ar-list-view').hidden = false;
}
function openArchive() {
  if (state.selectedId) closeSession();
  $('archive').hidden = false; document.body.classList.add('is-archive'); $('btn-archive').setAttribute('aria-pressed', 'true');
  $('ar-q').focus({ preventScroll: true });
  load(true);
}
export function setup() {
  $('btn-archive').addEventListener('click', () => (isOpen() ? closeArchive() : openArchive()));
  $('ar-close').addEventListener('click', closeArchive);
  $('ar-q').addEventListener('input', () => { clearTimeout(typeT); typeT = setTimeout(() => { q = $('ar-q').value.trim(); load(); }, 250); });
  $('ar-q').addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); if ($('ar-q').value) { $('ar-q').value = ''; q = ''; load(); } else closeArchive(); } });
  document.addEventListener('keydown', (e) => {
    if (!isOpen() || e.target.closest?.('input, textarea, [contenteditable="true"]')) return;
    if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !current) { e.preventDefault(); $('ar-q').focus(); }
    else if (e.key === 'Escape') { if (current) closeChat(); else closeArchive(); }
  });
}
