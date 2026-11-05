// Round avatars for the group chat (group-chat-view.js) and the task sheet: a coloured circle with the person's initials.
import { PALETTE, hash } from '../core/sessions.js';

const initials = (name) => String(name || '?').trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase().slice(0, 2);

/** A round avatar for { key, name, color }: initials on the person's colour. size in px. */
export function avatar(p, size = 40) {
  const el = document.createElement('span'); el.className = 'zc-av'; el.style.width = el.style.height = `${size}px`;
  el.setAttribute('aria-hidden', 'true');
  if (p?.key === '__claude') { el.textContent = '✳'; el.style.background = 'linear-gradient(135deg, #D97757, #E8A07A)'; el.style.fontSize = `${Math.round(size * 0.5)}px`; return el; }   // (Claude itself: a new conversation's answers)
  el.textContent = initials(p?.name); el.style.fontSize = `${Math.round(size * 0.38)}px`;
  el.style.background = p?.key === 'me' ? 'linear-gradient(135deg, #2B3A55, #4A6491)' : p?.color || PALETTE[hash(p?.name || '') % PALETTE.length];
  return el;
}
