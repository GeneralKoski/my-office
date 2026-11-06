// New session: pick a folder on this computer (server/browse.mjs: one level at a time, starred folders, recent ones), then
// start a conversation there or carry on one that ran in it (POST /api/tasks). This computer only.
import { state } from '../core/state.js';
import { $, el, hhmm } from '../core/env.js';
import { sessions } from '../core/sessions.js';
import { icon } from './icons.js';
import { toast } from './activity.js';
import { closeSession, openSession } from './session-drawer.js';
import { closeArchive } from './archive.js';
import { messageBox } from './message-box.js';
import { TOKEN } from '../net/live.js';
import { DEMO } from '../demo/demo.js';
import { t as tr, locale } from '../../i18n/index.js';

const LAST = 'office-folder';
let cur = null, q = '', seq = 0, mode = null, box = null;   // (cur: what the server said of the folder shown; mode: null | { sid?, title })
const tq = (first) => (TOKEN ? `${first ? '?' : '&'}k=${encodeURIComponent(TOKEN)}` : '');
const isOpen = () => !$('folders').hidden;
const store = { get: () => { try { return localStorage.getItem(LAST) || ''; } catch { return ''; } }, set: (v) => { try { localStorage.setItem(LAST, v); } catch { /* private mode */ } } };
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const day = (ms) => new Date(ms).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: new Date(ms).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
const when = (ms) => (ms ? `${day(ms)} ${hhmm(ms)}` : '');
const titleOf = (c) => c.title || c.first?.replace(/\s+/g, ' ').trim().slice(0, 90) || tr('folders.untitled');
const isFav = (p) => !!cur?.favs.some((f) => f.path === p);
const button = (cls, label, ic) => { const b = el('button', cls); b.type = 'button'; if (label) { b.title = label; b.setAttribute('aria-label', label); } if (ic) b.append(icon(ic)); return b; };

async function api(path, init) {
  if (DEMO) return { ok: false, code: 'demo' };
  try { return await (await fetch(path, init)).json(); } catch { return { ok: false }; }
}

/* ---------- the left rail: starred and recent folders, and home ---------- */
const tilde = (p) => (cur && (p === cur.home || p.startsWith(`${cur.home}/`)) ? `~${p.slice(cur.home.length)}` : p);
function railItem(f, withUnstar, same) {
  const row = el('div', `fo-ritem${cur?.path === f.path ? ' is-on' : ''}`), go = button('fo-rgo');
  go.title = f.path;
  const name = el('span', 'fo-rname'); name.append(el('b', null, f.name));
  if (same.has(f.name)) name.append(el('small', null, tilde(f.path.slice(0, f.path.lastIndexOf('/')) || '/')));   // (two with one name: where each is)
  go.append(icon(f.git ? 'branch' : 'folder'), name);
  go.addEventListener('click', () => load(f.path));
  row.append(go);
  if (withUnstar) { const u = button('fo-rx', tr('folders.unstar'), 'x'); u.addEventListener('click', () => star(f.path, false)); row.append(u); }
  return row;
}
function drawRail() {
  const rail = $('fo-rail'); rail.replaceChildren();
  const home = button(`fo-ritem fo-home${cur?.path === cur?.home ? ' is-on' : ''}`); home.append(icon('home'), el('span', 'fo-rname', tr('folders.home')));
  home.addEventListener('click', () => load(cur.home));
  rail.append(home);
  const sect = (title, list, empty, withUnstar) => {
    const s = el('section', 'fo-rsec'); s.append(el('h3', null, title));
    const names = list.map((f) => f.name), same = new Set(names.filter((n, i) => names.indexOf(n) !== i));
    if (!list.length) s.append(el('p', 'fo-rempty', empty)); else for (const f of list) s.append(railItem(f, withUnstar, same));
    rail.append(s);
  };
  sect(tr('folders.favorites'), cur.favs, tr('folders.noFavs'), true);
  sect(tr('folders.recent'), cur.recent, tr('folders.noRecent'), false);
}

/* ---------- the path and the folders under it ---------- */
function drawCrumbs() {
  const box2 = $('fo-crumbs'); box2.replaceChildren();
  const inHome = cur.path === cur.home || cur.path.startsWith(`${cur.home}/`);
  const base = inHome ? cur.home : '/', rest = cur.path.slice(base.length).split('/').filter(Boolean);
  let acc = base === '/' ? '' : base;
  const seg = (label, p, last) => {
    const b = el(last ? 'span' : 'button', `fo-seg${last ? ' is-last' : ''}`, label);
    if (!last) { b.type = 'button'; b.addEventListener('click', () => load(p)); }
    box2.append(b);
    if (!last) box2.append(el('span', 'fo-sep', '›'));
  };
  seg(inHome ? tr('folders.home') : '/', base, !rest.length);
  rest.forEach((name, i) => { acc += `/${name}`; seg(name, acc, i === rest.length - 1); });
}
function cardOf(f) {
  const card = el('div', 'fo-card'), go = button('fo-cgo');
  go.append(icon(f.git ? 'branch' : 'folder', 'ic fo-cic'));
  const main = el('span', 'fo-cmain'); main.append(el('b', 'fo-cname', f.name));
  const meta = el('span', 'fo-cmeta');
  if (f.git) meta.append(el('span', 'fo-tag', tr('folders.git')));
  if (f.deep) meta.append(el('span', null, tr('folders.chatsInside', { n: f.deep })));
  if (meta.childNodes.length) main.append(meta);
  go.append(main);
  go.title = f.path;
  go.addEventListener('click', () => load(f.path));
  const s = button(`fo-star${isFav(f.path) ? ' is-on' : ''}`, tr(isFav(f.path) ? 'folders.unstar' : 'folders.star'), 'star');
  s.addEventListener('click', () => star(f.path, !isFav(f.path)));
  card.append(go, s);
  return card;
}
function drawGrid() {
  const grid = $('fo-grid'), words = fold(q).split(/\s+/).filter(Boolean);
  const list = cur.entries.filter((f) => words.every((w) => fold(f.name).includes(w)));
  if (!list.length) { grid.replaceChildren(el('p', 'fo-empty', q ? tr('folders.noMatch', { q }) : tr('folders.empty'))); return; }
  grid.replaceChildren(...list.map(cardOf));
}

/* ---------- this folder: its actions, its chats, the box to start or carry on ---------- */
function drawHere() {
  const here = $('fo-here'); box?.reset(); box = null;
  here.replaceChildren();
  const head = el('header', 'fo-hhead'), info = el('div', 'fo-hinfo');
  info.append(el('h3', null, cur.name), el('p', 'fo-hpath', cur.path));
  const tags = el('p', 'fo-htags');
  if (cur.git) tags.append(el('span', 'fo-tag', tr('folders.git')));
  if (cur.deep) tags.append(el('span', null, tr('folders.chatsInside', { n: cur.deep })));
  if (tags.childNodes.length) info.append(tags);
  const sb = button(`fo-star fo-hstar${isFav(cur.path) ? ' is-on' : ''}`, tr(isFav(cur.path) ? 'folders.unstar' : 'folders.star'), 'star');
  sb.addEventListener('click', () => star(cur.path, !isFav(cur.path)));
  head.append(info, sb);
  here.append(head);

  const go = button('btn btn--primary fo-new'); go.append(icon('plus'), el('span', null, tr('folders.newHere')));
  go.addEventListener('click', () => compose({ title: '' }));
  here.append(go);

  if (mode) {
    const m = el('section', 'fo-compose');
    m.append(el('h4', null, mode.sid ? tr('folders.resumeTitle', { title: mode.title }) : tr('folders.newTitle', { name: cur.name })));
    box = messageBox({ placeholder: mode.sid ? tr('folders.resumePlaceholder', { title: mode.title }) : tr('folders.newPlaceholder', { name: cur.name }), onSend: send, sendLabel: tr(mode.sid ? 'folders.send' : 'folders.start') });
    const cancel = button('btn btn--sm fo-cancel'); cancel.textContent = tr('folders.cancel');
    cancel.addEventListener('click', () => { mode = null; drawHere(); });
    box.input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); mode = null; drawHere(); } });
    m.append(box.form, cancel); here.append(m);
    queueMicrotask(() => box?.focus());
  }

  const sec = el('section', 'fo-chats'); sec.append(el('h4', null, tr('folders.chatsHere')));
  if (!cur.chats.length) sec.append(el('p', 'fo-empty', tr('folders.noChats')));
  else {
    const ul = el('ul', 'fo-clist');
    for (const c of cur.chats) ul.append(chatRow(c));
    sec.append(ul);
  }
  here.append(sec);
}
function chatRow(c) {
  const li = el('li', `fo-chat${mode?.sid === c.sid ? ' is-on' : ''}`), main = el('span', 'fo-chmain');
  const live = [...sessions.values()].find((s) => s.sid === c.sid);
  const head = el('span', 'fo-chh'); head.append(el('b', 'fo-chtitle', live ? (live.title || live.name || titleOf(c)) : titleOf(c)));
  if (live) head.append(el('span', 'fo-tag is-live', tr('folders.live')));
  main.append(head, el('span', 'fo-chmeta', [when(c.end), tr('folders.msgs', { n: c.n })].join(' · ')));
  li.append(main);
  if (live) { const b = button('btn btn--sm'); b.textContent = tr('folders.openLive'); b.addEventListener('click', () => { closeFolders(); openSession(live.id); }); li.append(b); }
  else if (!c.gone) { const b = button('btn btn--sm'); b.textContent = tr('folders.resume'); b.addEventListener('click', () => compose({ sid: c.sid, title: titleOf(c) })); li.append(b); }
  return li;
}
function compose(m) { mode = m; drawHere(); }
async function send(text) {
  if (DEMO) { toast(tr('folders.demo')); return false; }
  const d = await api(`/api/tasks${tq(true)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dir: cur.path, text, ...(mode?.sid ? { sid: mode.sid } : { fresh: true }) }) });
  if (d?.ok) { toast(tr('folders.started'), 4200); closeFolders(); return true; }
  toast(d?.message || tr('drawer.unreachable'), 6000);
  return false;
}

/* ---------- loading ---------- */
function draw() { drawRail(); drawCrumbs(); drawGrid(); drawHere(); }
async function load(path = '', fresh = false) {
  const n = ++seq, d = await api(`/api/browse?path=${encodeURIComponent(path)}${$('fo-hidden').checked ? '&hidden=1' : ''}${fresh ? '&fresh=1' : ''}${tq()}`);
  if (n !== seq) return;
  if (!d?.ok) {
    if (path && d?.code === 'noDir') { toast(tr('folders.noDir'), 4000); store.set(''); return load('', fresh); }
    const msg = d?.code === 'denied' ? tr('folders.denied') : d?.code === 'demo' ? tr('folders.demo') : d?.code === 'local' ? tr('folders.macOnly') : tr('folders.unreadable');
    if (!cur) { $('fo-grid').replaceChildren(el('p', 'fo-empty', msg)); $('fo-here').replaceChildren(); $('fo-rail').replaceChildren(); $('fo-crumbs').replaceChildren(); }
    else toast(msg, 4000);
    return;
  }
  if (cur?.path !== d.path) mode = null;
  cur = d; q = ''; $('fo-q').value = '';
  store.set(d.path);
  draw();
  $('fo-scroll').scrollTop = 0;
}
async function star(path, on) {
  const d = await api(`/api/browse/star${tq(true)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path, on }) });
  if (!d?.ok) { toast(tr('folders.unreadable'), 4000); return; }
  cur.favs = d.favs; drawRail(); drawGrid(); drawHere();
}

/* ---------- open and close ---------- */
export function closeFolders() {
  if (!isOpen()) return;
  box?.reset(); mode = null;
  $('folders').hidden = true; document.body.classList.remove('is-folders'); $('btn-new').setAttribute('aria-pressed', 'false');
}
function openFolders() {
  if (state.selectedId) closeSession();
  closeArchive();
  $('folders').hidden = false; document.body.classList.add('is-folders'); $('btn-new').setAttribute('aria-pressed', 'true');
  load(store.get(), true);
}
export function setup() {
  $('btn-new').addEventListener('click', () => (isOpen() ? closeFolders() : openFolders()));
  $('fo-close').addEventListener('click', closeFolders);
  $('fo-q').addEventListener('input', () => { q = $('fo-q').value.trim(); if (cur) drawGrid(); });
  $('fo-hidden').addEventListener('change', () => load(cur?.path || ''));
  $('fo-q').addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); if ($('fo-q').value) { $('fo-q').value = ''; q = ''; drawGrid(); } else closeFolders(); } });
  document.addEventListener('keydown', (e) => {
    if (!isOpen() || e.key !== 'Escape' || e.target.closest?.('input, textarea')) return;
    if (mode) { mode = null; drawHere(); } else closeFolders();
  });
  new MutationObserver(() => { if (!$('dr-session').hidden) closeFolders(); }).observe($('dr-session'), { attributes: true, attributeFilter: ['hidden'] });
}
