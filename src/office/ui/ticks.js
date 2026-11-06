// The page's clock: the open session's header, once a second. And the ?debug hook's first entries (the sessions, a
// message as if from the server).
import { state } from '../core/state.js';
import { renderSessionHead } from './session-drawer.js';
import { sessions } from '../core/sessions.js';
import { upsertSession } from '../net/live.js';
import { applyMsg, demoTimers } from '../demo/demo.js';

export function setup() {
  setInterval(() => { if (state.selectedId) renderSessionHead(); }, 1000);
  if (new URLSearchParams(location.search).has('debug')) addHook({ get sessions() { return sessions; }, upsert: (x) => upsertSession(x, true), emit: (m) => applyMsg(m),
    get feed() { return state.feed; }, pauseDemo: () => { demoTimers.forEach(clearTimeout); demoTimers.clear(); } });
}
/** ?debug: entries added to window.__office (getters stay getters). */
function addHook(o) { window.__office = Object.defineProperties(window.__office || {}, Object.getOwnPropertyDescriptors(o)); }
