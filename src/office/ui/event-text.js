// How events read on screen: a session's state and the verb of each event.
import { t as tr } from '../../i18n/index.js';

// A session's state, translated when read: STATUS_LABEL[s.status] keeps working for every caller.
const translated = (keys, prefix) => Object.defineProperties({}, Object.fromEntries(keys.map((k) => [k, { enumerable: true, get: () => tr(`${prefix}.${k}`) }])));
export const STATUS_LABEL = translated(['work', 'wait', 'rest'], 'events.status');
const V = (key, vars) => tr(`events.verb.${key}`, vars);
export function verb(e) {
  const label = e.label || '';
  switch (e.type) {
    case 'prompt': return V('prompt', { label });
    case 'read': return V('read', { label });
    case 'grep': return V('grep', { label });
    case 'glob': return V('glob', { label });
    case 'skill': return V('skill', { label });
    case 'edit': return V('edit', { label });
    case 'write': return V('write', { label });
    case 'plan': return V('plan', { label });
    case 'bash': return label;
    case 'web': return V('web', { label });
    case 'fetch': return V('fetch', { label });
    case 'mcp': return V('mcp', { label });
    case 'agent': return e.desc ? V('agentDesc', { label, desc: e.desc }) : V('agent', { label });
    case 'compact': return V('compact');
    case 'ask': return V('ask');
    case 'wait': return V('wait', { label });
    case 'fail': return V('fail', { label });
    case 'stop': return label ? V('stopNamed', { label }) : V('stop');
    case 'interrupt': return V('interrupt');
    case 'idle': return V('idle');
    case 'deploy': return V('deploy', { label });
    case 'commit': return V('commit', { label });
    case 'push': return V('push', { target: label });
    case 'release': return V('release', { tag: label });
    case 'cired': return V('ciRed', { label: label || V('ciRedDefault') });
    case 'cigreen': return V('ciGreen', { label: label || V('ciGreenDefault') });
    case 'test': return V('test', { label });
    case 'testok': return V('testok', { label });
    case 'testfail': return V('testfail', { label });
    case 'start': return V('start');
    case 'end': return V('end');
    case 'substart': return V('substart', { label });
    case 'substop': return V('substop', { label });
    default: return V('use', { label });
  }
}
