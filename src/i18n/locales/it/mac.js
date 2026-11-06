// I limiti del piano e gli account (src/office/ui/plan.js, session-account.js) e il pannello del Mac (src/panel/mac.js).
// I consigli di pulizia sono scritti dal server (server.sys.*).
export default {
  add: {
    copy: 'Copia',
    copied: 'Copiato',
  },

  plan: {
    fiveHour: '5 h',
    week: 'Settimana',
    at: 'alle {time}',
    date: '{day} {d}/{m} {time}',
    weekdays: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
    unread: 'non riesco ancora a leggerlo',
    reading: 'lettura…',
    // un altro login di Claude Code su questa macchina (la sua cartella di configurazione, es. ~/.claude-org2): il nome è quello della cartella
    otherAccount: 'Account {name}',
    loading: 'Leggo i limiti di utilizzo dal tuo account Claude Code…',
    resets: 'si azzera {when}',
    warn: 'Piano Claude: {pct}% del limite {label} usato{reset}.',
    warnReset: ', si azzera {when}',
    mainAccount: 'Account principale',
    out: 'Esaurito fino a {when}',
    moved: '{from} ha esaurito l\'utilizzo. Sessioni aperte spostate su {to}: {n} ({names}). Scrivi in una chat per proseguire.',
    switched: '{from} ha esaurito l\'utilizzo (torna {when}). Le nuove sessioni di Claude Code ora usano {to}.',
    switchedBack: 'Le nuove sessioni di Claude Code sono di nuovo su {to}.',
  },
  action: {
    working: 'In corso…',
    sure: 'Sicuro? {verb}',
    sureForce: 'Sicuro? Forza ora',
    forceQuit: 'Forza chiusura',
    forceStop: 'Forza arresto',
    done: 'Fatto.',
    failed: 'Non è stato possibile farlo.',
    unreachable: 'Non riesco a raggiungere My Office.',
  },
  verb: {
    stop: 'Ferma',
    quit: 'Esci',
    clean: 'Pulisci',
  },
  measuring: 'Misuro RAM, CPU e disco…',
  meter: {
    disk: 'Disco',
  },
  tips: {
    gainRam: '+{size} di RAM',
  },
  verdict: {
    critical: 'RAM gravemente insufficiente: {swap} sono finiti sul disco (swap), per questo il tuo {mac} è lento',
    swap: 'RAM insufficiente: {swap} sono finiti sul disco (swap), per questo il tuo {mac} è lento',
    squeeze: 'RAM insufficiente: macOS sta comprimendo la memoria per fare spazio, potrebbe sembrare tutto lento',
    swapLeft: 'La RAM ora va bene, ma {swap} di swap sono ancora sul disco: macOS li libera lentamente, un riavvio li libera subito',
    disk: 'Il disco è quasi pieno: restano solo {free} liberi',
    cpu: 'La CPU è occupata al {pct}%: il tuo {mac} potrebbe essere lento e caldo',
    ok: 'Tutto a posto: RAM al {pct}%, niente da fare',
    who: 'Chi occupa più RAM: {list}',
    closeIdle: { one: 'Chiudi {n} sessione Claude inattiva · +{size}', other: 'Chiudi {n} sessioni Claude inattive · +{size}' },
    closeIdleSure: { one: 'Sicuro? Chiudi {n} sessione inattiva', other: 'Sicuro? Chiudi {n} sessioni inattive' },
  },
  held: {
    sessions: 'Sessioni Claude',
    dev: 'Server di sviluppo',
  },
  stranded: {
    removed: 'Eliminata {dir}. Il branch {branch} è ancora nel repository.',
    removedDetached: 'Eliminata {dir}.',
    gone: 'Quella cartella non è più nell\'elenco.',
    refused: {
      gone: 'Non eliminata: quella cartella non è più una worktree del repository.',
      notClean: 'Non eliminata: dentro c\'è qualcosa di nuovo (non committato o non pushato).',
      inUse: 'Non eliminata: una sessione Claude sta lavorando in quella cartella.',
      failed: 'Git non l\'ha eliminata: {why}',
    },
  },
};
