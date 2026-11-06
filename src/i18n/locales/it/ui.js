// Il markup della pagina (src/i18n/locales/it/ui.js), un gruppo per componente.
export default {
  meta: {
    title: 'My Office: un ufficio 3D per le tue sessioni Claude Code',
    description: 'Ogni sessione di Claude Code è un personaggio alla sua scrivania in un ufficio 3D. Approva i permessi, tieni d\'occhio RAM e limiti del piano e guarda cosa sta facendo ogni agente. Gratis e open source.',
  },
  topBar: {
    sampleData: 'dati di esempio',
    approvals: 'In attesa del tuo OK',
    settings: 'Impostazioni',
    settingsTitle: 'Impostazioni: ufficio, scenario, personaggi, notifiche, apri sul telefono',
    phone: 'Apri sul telefono',
    bell: 'Avvisami quando serve un\'approvazione',
    toggles: {
      sound: 'Suono',
      perm: 'Approva i permessi direttamente nell\'ufficio',
    },
  },
  macDrawer: {
    refresh: 'Aggiorna',
  },
  // la barra delle schede e i pannelli sul telefono (ui/phone.js)
  phone: {
    tabs: 'Sezioni',
    sessions: 'Sessioni',
    approve: 'Approva',
    approveEmpty: 'Niente in attesa di te',
    approveEmptySub: 'Quando una sessione ha bisogno del tuo OK, la sua scheda compare qui e resta appena sopra la barra in basso.',
  },
  phoneModal: {
    title: 'Apri sul telefono',
  },
  sessionDrawer: {
    label: 'Dettagli della sessione',
    read: 'file letti',
    edit: 'modifiche',
    cmd: 'comandi',
    time: 'attività in corso',
    ctx: 'contesto',
    cost: 'costo API ≈',
    chat: 'Conversazione',
    subs: 'Subagent',
    activity: 'Attività',
  },
  stage: {
    lite: 'Sessioni in elenco',
  },
};
