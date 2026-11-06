// The page on a phone: an app-like layout for small screens, upright or held sideways. <html> gets .is-phone and
// phone.css lays the page out: a compact top bar, the list of sessions filling the screen, and a tab bar at the bottom
// (Sessions · Approvals). "Approvals" opens the waiting approvals as a full-screen sheet; they also float above the tab
// bar as soon as one comes in, with buttons big enough for a thumb. The counts on the tabs follow the page: the sessions
// waiting for you and the approvals in the stack (watched, so nothing else has to call in here).
import { $, el } from '../core/env.js';
import { icon } from './icons.js';
import { sessions } from '../core/sessions.js';
import { closeSession, drS } from './session-drawer.js';
import { closeArchive } from './archive.js';
import { togglePop } from './settings.js';
import { t as tr } from '../../i18n/index.js';

// a phone upright, or sideways (wide but short, with a finger for a pointer)
const PHONE = '(max-width: 720px), (max-height: 520px) and (hover: none) and (pointer: coarse)';
const TABS = [['sessions', 'list'], ['approve', 'alert']];
let mq, bar, tab = 'sessions', emptyEl;

// everything that opens over the list, shut
function closeSheets(but = '') {
  if (!drS.hidden) closeSession();
  closeArchive();
  togglePop(false);
  if (but !== 'approve') document.documentElement.classList.remove('ph-approve');
}
function showTab(next) {
  if (next === tab && next !== 'sessions') next = 'sessions';   // (a second tap on the open tab goes back to the list)
  tab = next;
  closeSheets(next);
  if (next === 'approve') document.documentElement.classList.add('ph-approve');
  sync();
}
function badge(name, n, tone = '') {
  const b = bar?.querySelector(`[data-tab="${name}"] .ph-badge`); if (!b) return;
  b.hidden = !n; b.textContent = n > 9 ? '9+' : String(n); b.dataset.tone = tone;
}
function sync() {
  if (!bar) return;
  for (const b of bar.querySelectorAll('[data-tab]')) b.setAttribute('aria-selected', String(b.dataset.tab === tab));
  const waiting = $('perm-stack')?.children.length || 0;
  badge('approve', waiting, 'red');
  badge('sessions', [...sessions.values()].filter((s) => s.status === 'wait').length, 'amber');
  emptyEl.hidden = !(tab === 'approve' && !waiting);
  document.documentElement.classList.toggle('ph-has-perms', waiting > 0);
}
function apply() {
  const on = mq.matches, was = document.documentElement.classList.contains('is-phone');
  document.documentElement.classList.toggle('is-phone', on);
  if (was && !on) { closeSheets(); tab = 'sessions'; }   // (a window grown past a phone's size: the desktop's own layout)
  sync();
}

export function setup() {
  mq = matchMedia(PHONE);
  bar = el('nav', 'ph-tabs'); bar.setAttribute('role', 'tablist'); bar.setAttribute('aria-label', tr('ui.phone.tabs'));
  for (const [name, ic] of TABS) {
    const b = el('button', 'ph-tab'); b.type = 'button'; b.dataset.tab = name; b.setAttribute('role', 'tab');
    const badgeEl = el('i', 'ph-badge'); badgeEl.hidden = true;
    b.append(icon(ic), el('span', null, tr(`ui.phone.${name}`)), badgeEl);
    b.addEventListener('click', () => showTab(name));
    bar.append(b);
  }
  emptyEl = el('div', 'ph-empty'); emptyEl.hidden = true;
  emptyEl.append(icon('check'), el('b', null, tr('ui.phone.approveEmpty')), el('span', null, tr('ui.phone.approveEmptySub')));
  $('app').append(bar, emptyEl);
  // the counts on the tabs
  const watch = new MutationObserver(() => sync());
  for (const id of ['perm-stack', 'lite']) { const n = $(id); if (n) watch.observe(n, { childList: true, characterData: true, subtree: true }); }
  mq.addEventListener('change', apply);
  apply();
}
