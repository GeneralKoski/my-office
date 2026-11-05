// Incidents, pushes, CI and reports and "your turn" (life/your-turn.js).
export default {
  pushed: '🚀 {name} just pushed to {branch}',
  ciRed: '🚨 CI is red: {label} · {repo}',
  ciRedDefault: 'tests failing',
  ciGreen: '✅ CI is green again: {label} · {repo}',
  deployed: '🚀 {name} just deployed {label}',
  turn: {
    done: '{name} is done',
    body: 'Your turn: come see the result',
    none: 'No sessions are waiting for you.',
  },
};
