// The live connection: the sessions the server reports.
import { state } from '../core/state.js';
import { sessions } from '../core/sessions.js';
import { queueUi } from '../ui/activity.js';
import { closeSession } from '../ui/session-drawer.js';

export let TOKEN;
export function upsertSession(s) {
  sessions.set(s.id, s);
  queueUi();
}
export function removeSession(id) {
  sessions.delete(id);
  if (state.selectedId === id) closeSession();
  queueUi();
}

export function setup() {
  TOKEN = new URLSearchParams(location.search).get('k') || '';
}
