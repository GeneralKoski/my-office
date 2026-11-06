// Incidenti, push, CI e report e "tocca a te" (life/your-turn.js).
export default {
  pushed: '🚀 {name} ha appena fatto push su {branch}',
  ciRed: '🚨 La CI è rossa: {label} · {repo}',
  ciRedDefault: 'test falliti',
  ciGreen: '✅ La CI è di nuovo verde: {label} · {repo}',
  deployed: '🚀 {name} ha appena fatto il deploy di {label}',
  turn: {
    done: '{name} ha finito',
    body: 'Tocca a te: vieni a vedere il risultato',
    none: 'Nessuna sessione ti sta aspettando.',
  },
};
