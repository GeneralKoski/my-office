// Toasts, the rows of the activity feed (a session's Activity tab) and the redraw queue.
import { state } from '../core/state.js';
import { $, el, hhmm } from '../core/env.js';
import { verb } from './event-text.js';
import { TYPE_ICON, TYPE_TONE, icon } from './icons.js';
import { sessions } from '../core/sessions.js';
import { renderLite } from './lite.js';
import { openSession, renderActivity, renderSessionHead, renderSubs, tab } from './session-drawer.js';
import { unseenDone } from '../life/your-turn.js';
import { imageUrl } from './image-view.js';
import { t as tr, num } from '../../i18n/index.js';

let toastEl;
let toastTimer;
export function toast(msg, ms = 3400) { toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms); }
export const cap = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
function lineOf(e) {
  const ln = el('span', 'fg-line'), ic = el('span', 'fi-ico');
  ic.append(icon(TYPE_ICON[e.type] || 'sparkle')); if (TYPE_TONE[e.type]) ic.dataset.tone = TYPE_TONE[e.type];
  ln.append(ic, el('span', 'fg-text', cap(verb(e))));
  if (e.img) {   // an image it read, wrote or edited: a thumbnail, a click opens it (image-view.js)
    const th = el('span', 'fg-thumb'), im = el('img'); im.loading = 'lazy'; im.alt = ''; im.src = imageUrl(e.img);
    im.addEventListener('error', () => { th.remove(); ln.classList.remove('has-thumb'); });   // (gone from the disk)
    th.dataset.img = e.img; th.dataset.name = e.label || ''; th.title = tr('activity.image.view'); th.append(im); ln.append(th); ln.classList.add('has-thumb');
  }
  return ln;
}
export function feedRow(e) {
  const li = el('li', 'fr'); if (e.agent) li.dataset.agent = e.agent;
  li.append(lineOf(e), el('time', null, hhmm(e.ts)));
  return li;
}
let feedQueued = false;
export function queueFeed() { if (feedQueued) return; feedQueued = true; requestAnimationFrame(() => { feedQueued = false; if (state.selectedId && tab === 'act') renderActivity(); }); }
export function addFeed(e) { state.feed.push(e); if (state.feed.length > 150) state.feed = state.feed.slice(-150); queueFeed(); }
export function openFromRow(b) { if (b.dataset.agent) openSession(b.dataset.sess, { tab: 'subs', agent: b.dataset.agent }); else openSession(b.dataset.sess); }
let uiQueued = false;
export function queueUi() {
  if (uiQueued) return; uiQueued = true;
  requestAnimationFrame(() => {
    uiQueued = false; renderHud(); queueFeed(); renderLite();
    if (state.selectedId) { renderSessionHead(); if (tab === 'subs' && !state.subView) renderSubs(); }
  });
}
export const fmtTok = (n) => (n >= 1e6 ? `${num(n / 1e6, 1)}M` : `${Math.round(n / 1000)}k`);
export const fmtUsd = (v) => `$${v >= 100 ? Math.round(v) : v.toFixed(2)}`;
export function renderHud() {
  const list = [...sessions.values()];
  const waiting = list.filter((s) => s.status === 'wait').length;
  $('bell-dot').hidden = !waiting;
  const yours = waiting + unseenDone.size;
  document.title = yours ? tr('activity.docTitle', { n: yours }) : 'My Office';
}
export function setup() {
  state.feed = [];
  state.selectedId = null;
  state.isLocal = false;
  toastEl = $('toast');
}
