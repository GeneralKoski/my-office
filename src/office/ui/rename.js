// Renaming a conversation, in a small window with room to read what is being written (the archive's pencils and the
// session page's). Saved with POST /api/rename: a `custom-title` line in its transcript, as Claude Code's /rename does.
// renameChat({ sid, title, cwd?, first? }) -> the new title, or null when it was cancelled or failed.
import { el } from '../core/env.js';
import { TOKEN } from '../net/live.js';
import { toast } from './activity.js';
import { t as tr } from '../../i18n/index.js';

const MAX = 120;

async function save(sid, title) {
  try {
    const r = await fetch(`/api/rename${TOKEN ? `?k=${encodeURIComponent(TOKEN)}` : ''}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sid, title }) });
    return await r.json();
  } catch { return { ok: false }; }
}

export function renameChat(x) {
  return new Promise((resolve) => {
    const back = document.activeElement;
    const ov = el('div', 'rn-ov'), card = el('form', 'rn-card');
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true'); card.setAttribute('aria-label', tr('archive.renameTitle'));
    const input = el('textarea', 'rn-in'); input.rows = 3; input.maxLength = MAX; input.value = x.title || '';
    input.placeholder = (x.first || '').replace(/\s+/g, ' ').trim().slice(0, 100); input.setAttribute('aria-label', tr('archive.renameLabel'));
    const count = el('small', 'rn-count'); const upd = () => { count.textContent = `${input.value.length}/${MAX}`; };
    const cancel = el('button', 'btn'); cancel.type = 'button'; cancel.textContent = tr('archive.cancel');
    const go = el('button', 'btn btn--primary'); go.type = 'submit'; go.textContent = tr('archive.save');
    const acts = el('div', 'rn-acts'); acts.append(count, cancel, go);
    card.append(el('h3', null, tr('archive.renameTitle')));
    if (x.cwd) card.append(el('p', 'rn-path', x.cwd));
    card.append(input, el('p', 'rn-hint', tr('archive.renameHint')), acts);
    ov.append(card); document.body.append(ov);
    let done = false;
    const close = (v) => { if (done) return; done = true; ov.remove(); back?.focus?.({ preventScroll: true }); resolve(v); };
    input.addEventListener('input', upd); upd();
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') close(null); else if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); card.requestSubmit(); } });
    cancel.addEventListener('click', () => close(null));
    ov.addEventListener('pointerdown', (e) => { if (e.target === ov) close(null); });
    card.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = input.value.replace(/\s+/g, ' ').trim();
      if (!title || title === (x.title || '').trim()) { close(null); return; }
      input.disabled = go.disabled = cancel.disabled = true;
      const r = await save(x.sid, title);
      if (r?.ok) { toast(tr(r.how === 'vault' ? 'archive.savedHere' : 'archive.saved'), r.how === 'vault' ? 6000 : 3000); close(r.title); return; }
      toast(tr('archive.renameFailed'), 5000); input.disabled = go.disabled = cancel.disabled = false; input.focus();
    });
    input.focus(); input.setSelectionRange(input.value.length, input.value.length);
  });
}
