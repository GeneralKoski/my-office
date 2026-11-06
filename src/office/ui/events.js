// What the list does with each event of the stream: the sounds, the toasts, the feed and the open log.
import { state } from '../core/state.js';
import { dn, sessions } from '../core/sessions.js';
import { addFeed, toast } from './activity.js';
import { scheduleLog } from './session-drawer.js';
import { notifyWait } from './topbar.js';
import { onTurnDone, unseenDone } from '../life/your-turn.js';
import { sfx } from '../audio/sfx.js';
import { t as tr } from '../../i18n/index.js';

export function onEvent(e) {
  if (e.type === 'push') { sfx.play('deploy'); toast(tr('incident.pushed', { name: dn(sessions.get(e.sess)) || e.repo, branch: e.branch || 'git' })); }
  if (e.type === 'cired') { sfx.play('siren'); toast(tr('incident.ciRed', { label: e.label || tr('incident.ciRedDefault'), repo: e.repo }), 6500); }
  if (e.type === 'cigreen') toast(tr('incident.ciGreen', { label: e.label || '', repo: e.repo }));
  const s = sessions.get(e.sess);
  if (e.type === 'stop' && s) onTurnDone(s);
  if ((e.type === 'wait' || e.type === 'ask') && !e.agent) sfx.play('perm');
  if ((e.type === 'edit' || e.type === 'write') && !e.agent) sfx.play('key');
  if (e.type === 'deploy') sfx.play('deploy');
  if (state.selectedId === e.sess) unseenDone.delete(e.sess);
  if (!e.quiet && e.type !== 'start') addFeed(e);
  if (state.selectedId === e.sess) scheduleLog();
  if (s && !e.agent && e.type === 'deploy') toast(tr('incident.deployed', { name: dn(s), label: e.label }));
  if (s && !e.agent && (e.type === 'wait' || e.type === 'ask')) notifyWait(s, e);
}
