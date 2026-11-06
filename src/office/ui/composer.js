// The box under a conversation (the session page's Chat tab): a message to that session. While it works the text goes in
// as a note it reads between two steps (POST /api/tasks/steer); once it rests, the conversation is carried on with it
// (POST /api/tasks). The server says no when it can't (a terminal session at rest, a run already going): its words show.
// The microphone dictates into the box as you speak (the browser's speech recognition), like recording a voice note.
import { state } from '../core/state.js';
import { $, el } from '../core/env.js';
import { icon } from './icons.js';
import { sessions } from '../core/sessions.js';
import { toast } from './activity.js';
import { scheduleLog } from './session-drawer.js';
import { DEMO } from '../demo/demo.js';
import { TOKEN } from '../net/live.js';
import { t as tr } from '../../i18n/index.js';

const MAX_ROWS = 8;
let form, input, btn, mic, sending = false;
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, listening = false;

function fit() {
  input.style.height = 'auto';
  const max = parseFloat(getComputedStyle(input).lineHeight) * MAX_ROWS;
  input.style.height = `${Math.min(input.scrollHeight + input.offsetHeight - input.clientHeight, max)}px`;
}
function stopDictation() {
  listening = false;
  if (mic) { mic.classList.remove('is-rec'); mic.setAttribute('aria-pressed', 'false'); mic.title = tr('drawer.composer.mic'); }
  try { rec?.stop(); } catch { /* not running */ }
}
function startDictation() {
  let base = input.value && !/\s$/.test(input.value) ? `${input.value} ` : input.value;
  rec = new SR(); rec.lang = navigator.language || 'it-IT'; rec.continuous = true; rec.interimResults = true;
  rec.onresult = (e) => {
    let done = '', live = '';
    for (let i = 0; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) done += r[0].transcript; else live += r[0].transcript; }
    input.value = base + done + live; fit(); input.scrollTop = input.scrollHeight;
  };
  rec.onerror = (e) => {
    if (e.error === 'no-speech' || e.error === 'aborted') return;
    toast(tr(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'drawer.composer.micDenied' : 'drawer.composer.micFail'), 6000);
    stopDictation();
  };
  rec.onend = () => { if (listening) { base = input.value && !/\s$/.test(input.value) ? `${input.value} ` : input.value; try { rec.start(); } catch { stopDictation(); } } };   // (it stops itself after a silence: on again while the button is on)
  listening = true; mic.classList.add('is-rec'); mic.setAttribute('aria-pressed', 'true'); mic.title = tr('drawer.composer.micStop');
  try { rec.start(); } catch { stopDictation(); }
}
function lock(on) { sending = on; btn.disabled = on; input.readOnly = on; }
async function send() {
  const text = input.value.trim(), s = sessions.get(state.selectedId);
  if (!text || !s || sending) return;
  stopDictation();
  if (DEMO) { toast(tr('drawer.composer.demo')); return; }
  lock(true);
  try {
    const r = await fetch(`/api/tasks${s.status === 'rest' ? '' : '/steer'}${TOKEN ? `?k=${encodeURIComponent(TOKEN)}` : ''}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sid: s.sid, text }) });
    const d = await r.json().catch(() => null);
    if (d?.ok) {
      input.value = ''; fit();
      toast(tr(d.how === 'later' ? 'drawer.composer.kept' : d.how === 'now' ? 'drawer.composer.note' : 'drawer.composer.started'), 4200);
      scheduleLog();
    } else toast(d?.message || tr('drawer.unreachable'), 6000);
  } catch { toast(tr('drawer.unreachable'), 6000); }
  lock(false);
  input.focus();
}

export function setup() {
  const main = $('dr-main'); if (!main) return;
  form = el('form', 'dr-composer');
  input = el('textarea', 'dr-composer-in'); input.rows = 1; input.placeholder = tr('drawer.composer.placeholder'); input.setAttribute('aria-label', tr('drawer.composer.placeholder'));
  btn = el('button', 'btn btn--primary dr-composer-go'); btn.type = 'submit'; btn.setAttribute('aria-label', tr('drawer.composer.send')); btn.title = tr('drawer.composer.send'); btn.append(icon('send'));
  if (SR) {
    mic = el('button', 'btn dr-composer-mic'); mic.type = 'button'; mic.setAttribute('aria-pressed', 'false'); mic.title = tr('drawer.composer.mic'); mic.setAttribute('aria-label', tr('drawer.composer.mic')); mic.append(icon('mic'));
    mic.addEventListener('click', () => (listening ? stopDictation() : startDictation()));
    form.append(input, mic, btn);
  } else form.append(input, btn);
  main.append(form);
  input.addEventListener('input', fit);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });
  form.addEventListener('submit', (e) => { e.preventDefault(); send(); });
  // leaving the conversation: the microphone off and the draft gone, so it never goes to another one
  new MutationObserver(() => { if ($('dr-session').hidden) { stopDictation(); input.value = ''; fit(); } }).observe($('dr-session'), { attributes: true, attributeFilter: ['hidden'] });
}
