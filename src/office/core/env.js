// Page-wide basics: DOM helpers, formatting.
import { t, num } from '../../i18n/index.js';

export const $ = (id) => document.getElementById(id);
// The online demo: a static export with no server behind it (next.config.mjs, OFFICE_STATIC=1). It always runs demo mode.
export const STATIC = process.env.NEXT_PUBLIC_OFFICE_STATIC === '1';
export let reduceMotion;
export const rand = (a, b) => a + Math.random() * (b - a);
export const short = (s, n = 30) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
export const pad2 = (n) => String(n).padStart(2, '0');
export const nowMs = () => Date.now();
export const hhmm = (ts = nowMs()) => { const d = new Date(ts); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
export const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const GB = 1024 ** 3;
export const fmtBytes = (b) => (b >= GB ? t('time.gb', { n: num(b / GB, b >= 10 * GB ? 0 : 1) }) : t('time.mb', { n: num(Math.max(1, Math.round(b / 1024 ** 2))) }));
export function fmtAgo(sec) {
  if (sec >= 86400) { const n = Math.floor(sec / 86400); return t('time.day', { n }); }
  if (sec >= 3600) return t('time.hourMin', { h: Math.floor(sec / 3600), m: Math.floor((sec % 3600) / 60) });
  if (sec >= 60) return t('time.min', { n: Math.floor(sec / 60) });
  return t('time.sec', { n: Math.max(0, Math.floor(sec)) });
}
export const fmtClock = (s) => { s = Math.max(0, Math.floor(s)); return s >= 3600 ? `${Math.floor(s / 3600)}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}` : `${Math.floor(s / 60)}:${pad2(s % 60)}`; };

export function setup() {
  reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
}
