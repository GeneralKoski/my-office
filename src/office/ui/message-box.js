// A message box: a growing text area, a microphone that dictates into it as you speak (the browser's speech recognition,
// like recording a voice note) and a send button. Used under a conversation (composer.js) and in the new-session page
// (folders.js). onSend(text) answers true when it went (the box is then emptied).
import { el } from '../core/env.js';
import { icon } from './icons.js';
import { toast } from './activity.js';
import { t as tr } from '../../i18n/index.js';

const MAX_ROWS = 8;
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

export function messageBox({ placeholder, onSend, sendLabel = tr('drawer.composer.send') }) {
  const form = el('form', 'dr-composer'), input = el('textarea', 'dr-composer-in');
  input.rows = 1; input.placeholder = placeholder; input.setAttribute('aria-label', placeholder);
  const btn = el('button', 'btn btn--primary dr-composer-go'); btn.type = 'submit'; btn.setAttribute('aria-label', sendLabel); btn.title = sendLabel; btn.append(icon('send'));
  let mic = null, rec = null, listening = false, sending = false;

  const fit = () => {
    input.style.height = 'auto';
    const max = parseFloat(getComputedStyle(input).lineHeight) * MAX_ROWS;
    input.style.height = `${Math.min(input.scrollHeight + input.offsetHeight - input.clientHeight, max)}px`;
  };
  function stop() {
    listening = false;
    if (mic) { mic.classList.remove('is-rec'); mic.setAttribute('aria-pressed', 'false'); mic.title = tr('drawer.composer.mic'); }
    try { rec?.stop(); } catch { /* not running */ }
  }
  const baseOf = () => (input.value && !/\s$/.test(input.value) ? `${input.value} ` : input.value);
  function start() {
    let base = baseOf();
    rec = new SR(); rec.lang = navigator.language || 'it-IT'; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e) => {
      let done = '', live = '';
      for (let i = 0; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) done += r[0].transcript; else live += r[0].transcript; }
      input.value = base + done + live; fit(); input.scrollTop = input.scrollHeight;
    };
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      toast(tr(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'drawer.composer.micDenied' : 'drawer.composer.micFail'), 6000);
      stop();
    };
    rec.onend = () => { if (listening) { base = baseOf(); try { rec.start(); } catch { stop(); } } };   // (it stops itself after a silence: on again)
    listening = true; mic.classList.add('is-rec'); mic.setAttribute('aria-pressed', 'true'); mic.title = tr('drawer.composer.micStop');
    try { rec.start(); } catch { stop(); }
  }
  async function submit() {
    const text = input.value.trim();
    if (!text || sending) return;
    stop();
    sending = true; btn.disabled = true; input.readOnly = true;
    let ok = false;
    try { ok = await onSend(text); } catch { ok = false; }
    if (ok) { input.value = ''; fit(); }
    sending = false; btn.disabled = false; input.readOnly = false;
    input.focus();
  }
  if (SR) {
    mic = el('button', 'btn dr-composer-mic'); mic.type = 'button'; mic.setAttribute('aria-pressed', 'false'); mic.title = tr('drawer.composer.mic'); mic.setAttribute('aria-label', tr('drawer.composer.mic')); mic.append(icon('mic'));
    mic.addEventListener('click', () => (listening ? stop() : start()));
    form.append(input, mic, btn);
  } else form.append(input, btn);
  input.addEventListener('input', fit);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });
  form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
  return {
    form, input,
    focus: () => input.focus({ preventScroll: true }),
    /** the microphone off and the draft gone, so it never goes to another conversation */
    reset() { stop(); input.value = ''; fit(); },
    setPlaceholder(p) { input.placeholder = p; input.setAttribute('aria-label', p); },
  };
}
