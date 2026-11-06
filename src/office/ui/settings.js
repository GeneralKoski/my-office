// Settings popover: language, toggles, alerts and the phone.
import { state } from '../core/state.js';
import { $, STATIC } from '../core/env.js';
import { toast } from './activity.js';
import { sfx } from '../audio/sfx.js';
import { reportPresence } from './permissions.js';
import { TOKEN } from '../net/live.js';
import { DEFAULT_LANG, t as tr, lang } from '../../i18n/index.js';

export let popLook;
let btnLook;
// the language belongs to the whole office (the server writes some of the words too): save it there, then every open page
// reloads in it. Without a server to save it (the static demo) it goes in the address instead.
function setLang(l) {
  if (l === lang() && !new URLSearchParams(location.search).has('lang')) return;
  toast(tr('settings.switchingLang'));
  // the online demo is one static folder per language: English at the site's root, the others under /<lang>/
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- each language is its own static export, not a route of this app
  if (STATIC) { location.assign(`${process.env.NEXT_PUBLIC_SITE_ROOT || ''}/${l === DEFAULT_LANG ? '' : `${l}/`}${location.search}`); return; }
  const u = new URL(location.href); u.searchParams.delete('lang');
  const viaUrl = () => { u.searchParams.set('lang', l); location.replace(u); };
  fetch(`/api/prefs${TOKEN ? `?k=${encodeURIComponent(TOKEN)}` : ''}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang: l }) })
    .then((r) => (r.ok ? location.replace(u) : viaUrl())).catch(viaUrl);
}
// the two tabs of Settings; the last one opened comes back next time
const TABS = ['display', 'more'];
let tabNow = 'display';
function showTab(k, focus = false) {
  if (!TABS.includes(k)) k = TABS[0];
  tabNow = k;
  for (const b of popLook.querySelectorAll('[data-st-tab]')) { const on = b.dataset.stTab === k; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); }
  for (const p of popLook.querySelectorAll('[data-st-panel]')) p.hidden = p.dataset.stPanel !== k;
  try { localStorage.setItem('office-settings-tab', k); } catch { /* storage blocked */ }
}
export function togglePop(open = popLook.hidden) { popLook.hidden = !open; btnLook.setAttribute('aria-expanded', String(open)); if (open) showTab(tabNow); }
function setToggle(k, v) {
  if (k === 'sound') sfx.set(v);
  if (k === 'perm') { state.permOn = v; try { localStorage.setItem('office-perm', v ? 'on' : 'off'); } catch { /* storage blocked */ } reportPresence(); }
  syncToggles();
}
export function syncToggles() {
  const val = { sound: sfx.on, perm: state.permOn };
  for (const b of document.querySelectorAll('[data-tgl]')) b.setAttribute('aria-checked', String(!!val[b.dataset.tgl]));
}
export function setup() {
  /* ---------- settings popover ---------- */
  popLook = $('pop-look'); btnLook = $('btn-look');
  btnLook.addEventListener('click', (e) => { e.stopPropagation(); togglePop(); });
  try { tabNow = localStorage.getItem('office-settings-tab') || 'display'; } catch { /* storage blocked */ }
  // tabs by keyboard: left / right / Home / End; Esc closes the panel
  popLook.querySelector('.st-tabs').addEventListener('keydown', (e) => {
    const T = TABS, i = T.indexOf(tabNow), next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: T.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault(); showTab(T[(next + T.length) % T.length], true);
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !popLook.hidden) { togglePop(false); btnLook.focus(); } });
  document.addEventListener('click', (e) => { if (!popLook.hidden && !e.target.closest('#pop-look, #btn-look')) togglePop(false); });
  popLook.addEventListener('click', (e) => {
    const tb = e.target.closest('[data-st-tab]'); if (tb) { showTab(tb.dataset.stTab); return; }
    if (e.target.closest('#st-close')) { togglePop(false); btnLook.focus(); return; }
    const lg = e.target.closest('[data-lang]'); if (lg) { setLang(lg.dataset.lang); return; }
    const tg = e.target.closest('[data-tgl]'); if (tg) setToggle(tg.dataset.tgl, tg.getAttribute('aria-checked') !== 'true');
  });
}
