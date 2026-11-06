// The box under a conversation (the session page's Chat tab): a message to that session. While it works the text goes in
// as a note it reads between two steps (POST /api/tasks/steer); once it rests, the conversation is carried on with it
// (POST /api/tasks). The server says no when it can't (a terminal session at rest, a run already going): its words show.
// The box itself, microphone included, is ui/message-box.js.
import { state } from '../core/state.js';
import { $ } from '../core/env.js';
import { sessions } from '../core/sessions.js';
import { toast } from './activity.js';
import { scheduleLog } from './session-drawer.js';
import { messageBox } from './message-box.js';
import { DEMO } from '../demo/demo.js';
import { TOKEN } from '../net/live.js';
import { t as tr } from '../../i18n/index.js';

async function send(text) {
  const s = sessions.get(state.selectedId);
  if (!s) return false;
  if (DEMO) { toast(tr('drawer.composer.demo')); return false; }
  try {
    const r = await fetch(`/api/tasks${s.status === 'rest' ? '' : '/steer'}${TOKEN ? `?k=${encodeURIComponent(TOKEN)}` : ''}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sid: s.sid, text }) });
    const d = await r.json().catch(() => null);
    if (d?.ok) {
      toast(tr(d.how === 'later' ? 'drawer.composer.kept' : d.how === 'now' ? 'drawer.composer.note' : 'drawer.composer.started'), 4200);
      scheduleLog();
      return true;
    }
    toast(d?.message || tr('drawer.unreachable'), 6000);
  } catch { toast(tr('drawer.unreachable'), 6000); }
  return false;
}

export function setup() {
  const main = $('dr-main'); if (!main) return;
  const box = messageBox({ placeholder: tr('drawer.composer.placeholder'), onSend: send });
  main.append(box.form);
  // leaving the conversation: the microphone off and the draft gone, so it never goes to another one
  new MutationObserver(() => { if ($('dr-session').hidden) box.reset(); }).observe($('dr-session'), { attributes: true, attributeFilter: ['hidden'] });
}
