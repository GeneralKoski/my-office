// Ciò che il server dice su una sessione bloccata, sul lavoro dato a Claude e su una nota mandata a una sessione al lavoro (server/index.mjs).
export default {
  loop: {
    repeat: '{name} ha eseguito {label} e ha ottenuto lo stesso errore {n} volte: il tentativo {next} è bloccato',
    compact: '{name} ha compattato la sua memoria {n} volte in {mins} min: potrebbe girare a vuoto',
    cost: '{name} ha speso circa {usd} in {mins} min senza modificare un file',
  },
  steer: {
    notBusy: '{name} ora non sta facendo niente: mandagliela come messaggio normale.',
  },
  task: {
    notAllowed: 'Assegnare lavoro da un telefono non è ancora consentito. Sul Mac: 📱 Telefono → attiva “Dai lavoro a Claude da un telefono”.',
    noDir: 'Quella cartella o conversazione non è sul Mac.',
    failed: 'Il lavoro in {folder} non è finito: {error}',
    doneEmpty: 'Fatto, capo ✅',
    stopped: '⏹ Fermato, come hai chiesto.',
    threadBusy: '{name} è ancora sul tuo ultimo messaggio: aspetta la risposta, poi scrivi di nuovo',
    macBusy: '{name} sta lavorando sul Mac. Aspetta che finisca, poi scrivi dal telefono.',
    macTerminal: '{name} è aperto in un terminale: esci da lì (/exit) e scrivi di nuovo, e il telefono prosegue proprio questa conversazione.',
    why: { busy: 'ce ne sono già 3 in corso, aspetta che una finisca', tooMany: 'troppo lavoro assegnato in quest’ora, riprova più tardi', noClaude: 'Claude Code non è sul Mac', noDir: 'la cartella non c’è più', empty: 'non è stato scritto niente' },
  },
};
