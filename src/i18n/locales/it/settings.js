export default {
  language: 'Lingua',
  switchingLang: 'Cambio lingua…',
  tabs: { display: 'Schermo', more: 'Altro' },
  notify: 'Telefono e avvisi',
  phoneNote: 'Approva e guarda dal telefono',
  bellNote: 'Un avviso sul desktop quando Claude ha bisogno di te',
  behaviour: 'Comportamento',
  // Impostazioni → Altro: i modelli di una sessione e dei suoi subagent (ui/models.js, server/models.mjs)
  models: {
    title: 'Modelli: coordinatore e subagent',
    note: 'Un compito grande può essere diviso tra subagent: la sessione coordina con un modello, i suoi subagent lavorano con un altro (Sonnet costa meno di Opus). Per le sessioni Claude avviate da ora in poi, su ogni account.',
    main: 'La sessione (coordinatore)', sub: 'Subagent',
    opt: { opus: 'Opus', sonnet: 'Sonnet', haiku: 'Haiku', default: 'Predefinito', same: 'Lo stesso' },
    force: 'Sempre questo modello per i subagent (anche quando Claude ne sceglie un altro)',
    split: 'Chiedi a Claude di dividere i compiti grandi tra subagent',
    splitNote: 'Una breve nota in ~/.claude/CLAUDE.md, rimossa di nuovo quando è disattivato.',
    other: 'Ora: {model} (impostato a mano)',
    saved: 'Salvato. Le sessioni Claude avviate da ora in poi lo usano; quelle aperte adesso mantengono il loro modello.',
    readOnly: "Impossibile leggere ~/.claude/settings.json da qui (potrebbe avere dei commenti): imposta il modello a mano lì.",
  },
  // Impostazioni → Altro: l'interruttore dei loop bloccati (server/loops.mjs)
  // Impostazioni → Altro: approva direttamente dalle notifiche del Mac (ui/mac-approve.js, server/mac-hold.mjs)
  macApprove: {
    title: "Approva dalle notifiche del Mac",
    on: "Approva dalle notifiche del Mac",
    note: "Mentre sei al Mac (un tasto o il mouse toccati da poco) e l'icona nella barra dei menu è attiva, una richiesta di Claude viene trattenuta fino a 20 secondi così puoi premere Consenti / Nega sulla sua notifica. Un comando rischioso ha solo Nega. Disattivalo e Claude chiede subito nell'IDE, come prima; lo fa anche quando sei lontano.",
  },
  loop: {
    title: 'Loop bloccati',
    on: 'Interrompi i loop bloccati',
    note: 'Quando una sessione esegue la stessa cosa e ottiene sempre lo stesso errore, il tentativo successivo viene bloccato e a Claude viene detto di cambiare strada; una scheda nella chat ti permette di fermarla o di mandare un suggerimento. Segnala anche compattazione dopo compattazione, e la spesa senza nessun file modificato.',
    after: 'Blocca dopo', tries: { one: '{n} errore', other: '{n} errori' },
    costAfter: 'Spesa senza file modificati per', mins: '{n} min',
    install: 'Esegui ancora una volta `node bin/cli.mjs install` così Claude Code controlla con l\'ufficio prima di ogni passo.',
  },
};
