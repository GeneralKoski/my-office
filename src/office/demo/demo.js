// Demo mode: fictional projects. And the live stream: one handler for the messages of the server.
import { state } from '../core/state.js';
import { $, STATIC, rand } from '../core/env.js';
import { sessions } from '../core/sessions.js';
import { addFeed, queueFeed, queueUi, toast } from '../ui/activity.js';
import { closeSession } from '../ui/session-drawer.js';
import { acctMoved, acctSwitched, limitWarned, liveWindows, renderLimits } from '../ui/plan.js';
import { TOKEN, removeSession, upsertSession } from '../net/live.js';
import { onEvent } from '../ui/events.js';
import { onPerm, perms, renderPerms, reportPresence } from '../ui/permissions.js';
import { renderPhone } from '../ui/topbar.js';
import { logLine } from './demo-log.js';
import { t as tr } from '../../i18n/index.js';

export let DEMO;
// The fictional projects. Paths, search terms and commands are the same in every language; what people write (prompts,
// a command's description, what needs approval) comes from the demo dictionary, read when the demo starts.
function demoProjects() {
  const d = (k) => tr(`demo.tasks.${k}`);
  return [
    { name: 'shop-api', dir: '~/projects/shop-api', tasks: [
      { prompt: d('cart.prompt'), steps: [['read', 'src/routes/cart.ts'], ['grep', 'paginate'], ['edit', 'src/routes/cart.ts'], ['test', d('cart.test'), 'fail', 'npm test'], ['edit', 'src/routes/cart.test.ts'], ['test', d('cart.retest'), 'ok', 'npm test']], wait: d('cart.wait') },
      { prompt: d('shipping.prompt'), steps: [['grep', 'shippingFee'], ['read', 'src/lib/shipping.ts'], ['edit', 'src/lib/shipping.ts'], ['test', d('shipping.test'), null, 'vitest']], deploy: 'v2.4.1' } ] },
    { name: 'landing-page', dir: '~/projects/landing-page', tasks: [
      { prompt: d('hero.prompt'), steps: [['read', 'app/page.tsx'], ['read', 'components/Hero.tsx'], ['edit', 'components/Hero.tsx'], ['write', 'components/HeroArt.tsx'], ['bash', d('hero.build')], ['fetch', 'dribbble.com']], sub: ['general-purpose', d('hero.sub')] },
      { prompt: d('images.prompt'), steps: [['glob', 'public/**/*.png'], ['bash', d('images.webp')], ['edit', 'next.config.ts'], ['bash', d('images.lighthouse')]] } ] },
    { name: 'data-pipeline', dir: '~/projects/data-pipeline', tasks: [
      { prompt: d('orders.prompt'), steps: [['read', 'etl/orders.py'], ['edit', 'etl/orders.py'], ['test', d('orders.pytest'), null, 'pytest'], ['web', 'pandas drop_duplicates subset']], sub: ['Explore', d('orders.sub')] },
      { prompt: d('schedule.prompt'), steps: [['read', 'airflow/dags/daily.py'], ['edit', 'airflow/dags/daily.py'], ['bash', d('schedule.check')]], wait: d('schedule.wait') } ] },
    { name: 'mobile-app', dir: '~/projects/mobile-app', tasks: [
      { prompt: d('login.prompt'), steps: [['read', 'src/screens/Login.tsx'], ['web', 'expo auth session google'], ['edit', 'src/screens/Login.tsx'], ['bash', d('login.typecheck')]] },
      { prompt: d('keyboard.prompt'), steps: [['grep', 'KeyboardAvoidingView'], ['edit', 'src/components/Form.tsx'], ['test', d('keyboard.uiTest'), null, 'playwright']] } ] },
    { name: 'docs-site', dir: '~/projects/docs-site', tasks: [
      { prompt: d('install.prompt'), steps: [['read', 'docs/intro.md'], ['write', 'docs/install.md'], ['bash', d('install.build')]], deploy: 'docs' } ] },
    { name: 'infra', dir: '~/projects/infra', tasks: [
      { prompt: d('staging.prompt'), steps: [['read', 'terraform/staging.tf'], ['edit', 'terraform/staging.tf'], ['bash', 'terraform plan']], wait: d('staging.wait') } ] },
  ];
}
let demoSeq = 0, demoReleases = 3;
export const demoLog = new Map(), demoTimers = new Set();   // (a timer leaves the set when it fires: the demo runs for days)
const demoLater = (fn, ms) => { const id = setTimeout(() => { demoTimers.delete(id); fn(); }, ms); demoTimers.add(id); };
function demoEmit(s, type, label = '', extra = {}) {
  const now = Date.now(), e = { id: ++demoSeq, ts: now, sess: s.id, name: s.name, type, label, ...extra };
  if (!extra.agent && !['wait', 'stop', 'substart', 'substop', 'deploy'].includes(type)) s.last = { type, label };
  s.lastAt = now;
  const k = { read: 'read', grep: 'read', glob: 'read', edit: 'edit', write: 'edit', bash: 'cmd', web: 'web', fetch: 'web' }[type];
  if (k && !extra.agent) s.counts[k] = (s.counts[k] || 0) + 1;
  if (s.usage && !extra.agent) { s.usage.ctx = Math.min(190000, s.usage.ctx + 1800 + Math.random() * 2600); s.usage.cost += 0.02 + Math.random() * 0.05; }
  logLine(demoLog, extra.agent || s.id, type === 'prompt' ? { role: 'user', text: label, ts: now }
    : type === 'stop' ? { role: 'claude', text: demoReply(demoSeq % REPLY_KEYS.length), ts: now }
    : !['wait', 'substart', 'substop', 'testok', 'testfail', 'commit', 'push'].includes(type) ? { role: 'tool', type: type === 'test' ? 'bash' : type, label, ts: now } : null);
  upsertSession({ ...s, subs: s.subs.map((x) => ({ ...x })) });
  onEvent(e);
}
function demoRun(s, task, at = 0) {
  const later = (ms, fn) => demoLater(fn, ms);
  const step = () => rand(1500, 3200);
  let t = at;
  later(t, () => { s.status = 'work'; s.taskStart = Date.now(); s.lastPrompt = task.prompt; demoEmit(s, 'prompt', task.prompt); });
  task.steps.forEach(([type, label, outcome, runner], i) => {
    t += step();
    if (task.wait && i === Math.floor(task.steps.length / 2)) {
      later(t, () => { s.status = 'wait'; demoEmit(s, 'wait', task.wait); });
      t += rand(7000, 11000);
      later(t, () => { s.status = 'work'; demoEmit(s, 'bash', task.wait); });
      t += step();
    }
    if (task.sub && i === 1) {
      const id = `demo-sub-${++demoSeq}`, [kind, desc] = task.sub;
      later(t, () => { s.subs.push({ id, type: kind, desc, last: null, startedAt: Date.now(), steps: 0, model: 'claude-sonnet-5-5' }); demoEmit(s, 'agent', kind, { desc }); demoEmit(s, 'substart', kind, { agent: id, quiet: false }); });
      for (const [k, l] of [['grep', 'useCart'], ['read', 'src/index.ts'], ['web', desc]]) {
        t += rand(1200, 2200);
        later(t, () => { const x = s.subs.find((y) => y.id === id); if (x) { x.last = { type: k, label: l }; x.steps++; } demoEmit(s, k, l, { agent: id, agentType: kind, quiet: true }); });
      }
      t += rand(1500, 2500);
      later(t, () => { s.subs = s.subs.filter((y) => y.id !== id); demoEmit(s, 'substop', kind, { agent: id }); });
    }
    if (type === 'test') {   // the run at the test board, then its result (mostly green; the first run of a new test red)
      later(t, () => demoEmit(s, 'test', label, { runner }));
      t += rand(3500, 6500);
      const ok = outcome ? outcome === 'ok' : Math.random() < 0.85, n = 12 + Math.floor(Math.random() * 30);   // (how many passed and failed, as a runner's summary says)
      later(t, () => demoEmit(s, ok ? 'testok' : 'testfail', runner, ok ? { pass: n, fail: 0 } : { pass: n - 1, fail: 1 }));
    } else later(t, () => demoEmit(s, type, label));
  });
  // most tasks end in a commit (a letter in the lobby's post box); every third one is pushed (the postman comes)
  if (Math.random() < 0.6) {
    t += step();
    later(t, () => {
      demoEmit(s, 'commit', task.prompt); s.commits = (s.commits || 0) + 1;
      if (s.commits % 3 === 0) later(rand(4000, 9000), () => demoEmit(s, 'push', 'main', { branch: 'main', repo: s.name }));
      if (s.commits % 6 === 0) later(rand(12000, 16000), () => demoEmit(s, 'release', `v1.${(demoReleases += 1)}.0`, { repo: s.name }));   // (a version tag now and then: the photo booth, people/photobooth.js)
    });
  }
  if (task.deploy) { t += step(); later(t, () => demoEmit(s, 'deploy', task.deploy)); }
  if (s.usage && s.usage.ctx > 150000) { t += step(); later(t, () => { demoEmit(s, 'compact', 'auto'); }); t += 4800; later(t, () => { s.usage.ctx = 42000; upsertSession({ ...s }); }); }
  t += step();
  later(t, () => { s.status = 'rest'; s.taskStart = 0; demoEmit(s, 'stop'); });
  return t;
}
function demoLoop(s, p, first) {
  let k = first ? 0 : Math.floor(Math.random() * p.tasks.length);
  // between tasks a short pause, now and then a long break: long enough to nap, fetch the lunch or pop out to the shop
  // (people/outings.js)
  const go = (delay) => { const task = p.tasks[k++ % p.tasks.length]; const end = demoRun(s, task, delay); demoLater(() => go(Math.random() < 0.22 ? rand(70000, 150000) : rand(6000, 16000)), end + 50); };
  go(first ? rand(300, 2500) : rand(4000, 14000));
}
// Replies in the demo conversation: what Claude usually writes (lists, code, tables), so the reader can be judged.
const REPLY_KEYS = ['cart', 'speed', 'schedule'];
const demoReply = (i) => tr(`demo.replies.${REPLY_KEYS[i]}`);
function startDemo() {
  $('demo-chip').hidden = false;
  demoProjects().forEach((p, i) => {
    const s = { usage: { cost: 0.4 + i * 0.9, ctx: i === 0 ? 168000 : 38000 + i * 21000, ctxMax: 200000, model: 'claude-opus-5-5', out: 0 }, id: `demo-${i}`, pid: 52000 + i, name: p.name, dir: p.dir, link: null, desk: i, status: 'rest', lastPrompt: '', taskStart: 0, counts: { read: 0, edit: 0, cmd: 0, web: 0 }, subs: [], doneSubs: [], last: null, lastAt: Date.now() - (i + 1) * 9 * 60e3 };
    upsertSession(s, false);
    demoLoop(s, p, i < 4);
  });
  // the first project was continued from a long session: it opens with Claude's own summary
  const t0 = Date.now() - 50 * 60e3;
  demoLog.set('demo-0', [
    { role: 'summary', ts: t0, text: tr('demo.summary') },
    { role: 'user', ts: t0 + 60e3, text: tr('demo.chat.keepGoing') },
    { role: 'tool', type: 'read', label: 'cart.ts', ts: t0 + 70e3 }, { role: 'tool', type: 'grep', label: 'paginate', ts: t0 + 80e3 },
    { role: 'tool', type: 'edit', label: 'cart.ts', ts: t0 + 90e3 }, { role: 'tool', type: 'bash', label: tr('demo.tasks.cart.test'), ts: t0 + 100e3 },
    { role: 'claude', ts: t0 + 110e3, text: demoReply(0) },
    { role: 'note', ts: t0 + 130e3, text: tr('demo.chat.stopped') },
    { role: 'claude', ts: t0 + 150e3, text: demoReply(1) },
    { role: 'user', ts: t0 + 160e3, text: tr('demo.chat.schedule') },
    { role: 'claude', ts: t0 + 170e3, text: demoReply(2) },
  ]);
  queueUi();
  // one scripted incident so the red alarm can be seen: three failing commands in a row
  demoLater(() => { const list = [...sessions.values()]; [0, 1, 2].forEach((k) => setTimeout(() => demoEmit(list[k % list.length], 'fail', tr('demo.incident')), k * 900)); }, 45000);
}
// One handler for the live stream. `quiet` (catching up after a reconnect) updates the state without the toasts and sounds
// and fills the feed without bubbles or animations.
// a newer office than this page (it was updated and restarted): load it, once nothing typed would be lost
function reloadSoon() {
  const typing = () => document.activeElement?.matches?.('input, textarea') || [...document.querySelectorAll('textarea')].some((t) => t.value.trim());
  if (typing()) { setTimeout(reloadSoon, 5000); return; }
  location.reload();
}
export function applyMsg(d, quiet = false) {
  if (d.k === 'snap' || d.k === 'lang') {   // the office's language changed while this page was open: load it again in the new one
    if (d.lang && d.lang !== document.documentElement.lang && !new URLSearchParams(location.search).has('lang')) { location.reload(); return; }
    if (d.k === 'lang') return;
  }
  if (d.k === 'snap') {
    const ids = new Set(d.sessions.map((s) => s.id));
    for (const id of [...sessions.keys()]) if (!ids.has(id)) (quiet ? dropSessionNow : removeSession)(id);
    for (const s of d.sessions) upsertSession(s, false);
    state.feed = d.feed || [];
    if ('local' in d) {   // only the live snapshot carries these
      perms.clear(); for (const p of d.perms || []) perms.set(p.id, p); renderPerms(); reportPresence();
      state.isLocal = !!d.local; state.lanUrl = d.lan || null; state.lanBase = d.lanBase || null; state.phonePin = d.pin || null; state.tsUrl = d.ts || null; state.phoneApprove = !!d.phoneApprove; state.phoneTasks = !!d.phoneTasks; state.lanFixed = !!d.lanFixed;
      if (d.build) { if (state.build && d.build !== state.build) reloadSoon(); else state.build = d.build; }   // (the office was updated: this page is an older one)
      state.limits = d.limits || null; state.limitsNote = d.limitsNote || ''; for (const w of liveWindows()) if (w.pct >= 80) limitWarned.add(`${w.key}:${w.resetsAt}:${w.pct >= 95 ? 95 : 80}`); renderLimits();
      $('btn-phone').hidden = false;   // (on a phone: its PIN, and what the Mac allows it)
      $('btn-bell').hidden = !('Notification' in window) || !window.isSecureContext;
    }
    queueUi();
  } else if (d.k === 'sess') upsertSession(d.s, !quiet);
  else if (d.k === 'gone') (quiet ? dropSessionNow : removeSession)(d.id);
  else if (d.k === 'ev') {
    upsertSession(d.s, !quiet);
    if (!quiet) onEvent(d.e); else if (!d.e.quiet && d.e.type !== 'start') addFeed(d.e);
  }
  else if (d.k === 'stats') { if (d.s) upsertSession(d.s, !quiet); }
  else if (d.k === 'perm') onPerm(d.p);
  else if (d.k === 'permDone') { perms.delete(d.id); renderPerms(); }
  else if (d.k === 'phone') { state.phoneApprove = !!d.approve; state.phoneTasks = !!d.tasks; for (const c of [...$('perm-stack').children]) c.remove(); renderPerms(); reportPresence(); if (!$('phone-modal').hidden) renderPhone(); }   // (approving and giving work from a phone, switched on the Mac)
  else if (d.k === 'acctswitch') acctSwitched(d);   // (new sessions moved to another account)
  else if (d.k === 'acctmove') { if (!quiet) acctMoved(d); }
  else if (d.k === 'limits') { state.limits = d.limits || null; state.limitsNote = d.note || ''; renderLimits(); }
  else if (d.k === 'sysauto') { if (!quiet) toast(d.message, 8000); }   // (idle sessions closed on their timer)
  else if (d.k === 'vi') relabel(d.from, d.to);
}
// a translation that arrived after its event: swap the words in bubbles, the feed and the session list
function relabel(from, to) {
  if (!from || !to) return;
  for (const e of state.feed) { if (e.label === from) e.label = to; if (e.desc === from) e.desc = to; }
  for (const s of sessions.values()) for (const o of [s, ...(s.subs || [])]) { if (o.last?.label === from) o.last.label = to; if (o.desc === from) o.desc = to; }
  queueFeed(); queueUi();
}
// Through the Cloudflare quick tunnel a stream's data is held back until it ends (quick tunnels don't do server-sent
// events): there the page asks instead, GET /api/live, which answers as soon as there is something new (the same messages)
const VIA_TUNNEL = /\.trycloudflare\.com$/.test(location.hostname);
function ask() {
  const stop = new AbortController();
  (async () => {
    let since = -1, fails = 0;
    while (!stop.signal.aborted) {
      if (document.hidden) await new Promise((ok) => document.addEventListener('visibilitychange', ok, { once: true }));   // (a phone in a pocket asks nothing)
      try {
        const r = await fetch(`/api/live?since=${since}`, { cache: 'no-store', signal: stop.signal });
        if (r.status === 401) { location.reload(); return; }   // (signed out: back to the PIN)
        const j = await r.json();
        fails = 0; since = j.seq;
        for (const d of j.msgs) applyMsg(d);
      } catch {
        if (stop.signal.aborted) return;
        await new Promise((ok) => setTimeout(ok, Math.min(15_000, 1000 * 2 ** fails++)));
      }
    }
  })();
}
function connect() {
  if (VIA_TUNNEL) { ask(); return; }
  const es = new EventSource(`/stream${TOKEN ? `?k=${encodeURIComponent(TOKEN)}` : ''}`);
  es.onmessage = (m) => {
    let d; try { d = JSON.parse(m.data); } catch { return; }
    applyMsg(d);
  };
}
function dropSessionNow(id) {
  sessions.delete(id);
  if (state.selectedId === id) closeSession();
}

// the page's start: the demo's fictional sessions, or the live stream
export function start() { if (DEMO) startDemo(); else connect(); }
export function setup() {
  /* ---------- demo mode (?demo): fictional projects and a fictional Mac, so the office can be shown or screenshotted
     without any real sessions, paths or commands. Nothing is sent to the server and no action touches the machine. ---------- */
  DEMO = STATIC || new URLSearchParams(location.search).has('demo');
}
