// La demo fittizia (?demo, e la demo pubblica online): sei progetti con i loro prompt e passi, la chat con
// Claude e un errore scriptato. In italiano deve sembrare una giornata qualunque di uno sviluppatore italiano.
// Percorsi dei file, termini di ricerca e comandi di shell sono uguali in ogni lingua e stanno in demo/demo.js.
export default {
  // cosa chiedi e cosa dicono i passi di Claude (la riga di un comando mostra la sua descrizione, come fa Claude Code)
  tasks: {
    cart: { prompt: 'Aggiungi la paginazione all\'API del carrello', test: 'Esegui i test del carrello', retest: 'Esegui di nuovo tutta la suite di test', wait: 'Installa zod' },
    shipping: { prompt: 'Correggi il calcolo sbagliato delle spese di spedizione', test: 'Esegui i test delle spese di spedizione' },
    hero: { prompt: 'Rifai la sezione hero dal nuovo mockup', build: 'Prova una build di Next.js', sub: 'Confronta 3 design di hero su Dribbble' },
    images: { prompt: 'Ottimizza le immagini per portare l\'LCP sotto i 2 secondi', webp: 'Converti le immagini in WebP', lighthouse: 'Esegui Lighthouse' },
    orders: { prompt: 'Aggiungi un passo di pulizia per i dati degli ordini', pytest: 'Esegui pytest', sub: 'Trova tutti i punti che leggono la tabella orders' },
    schedule: { prompt: 'Pianifica il job per le 2 di notte', check: 'Controlla la sintassi del DAG', wait: 'Scrivi nel crontab' },
    login: { prompt: 'Aggiungi una schermata Accedi con Google', typecheck: 'Esegui il typecheck' },
    keyboard: { prompt: 'Correggi la tastiera che copre i campi di input', uiTest: 'Esegui i test della UI' },
    install: { prompt: 'Scrivi la guida all\'installazione', build: 'Costruisci il sito della documentazione' },
    staging: { prompt: 'Dai più RAM al server di staging', wait: 'Esegui terraform apply' },
  },
  // le risposte di Claude: ciò che scrive di solito (elenchi, codice, tabelle), così si può valutare il lettore della chat
  replies: {
    cart: 'Fatto. Riepilogo:\n\n- Aggiornato `src/routes/cart.ts`: aggiunti `?page=` e `?limit=` (predefinito **20**, massimo 100).\n- Aggiunti 4 test per una pagina vuota, l\'ultima pagina e un `limit` eccessivo.\n- `npm test`: **38/38 superati**.\n\nVuoi che cambi il valore predefinito a 50?',
    speed: '## Misurato di nuovo\n\n| Pagina | Prima | Dopo |\n| --- | --- | --- |\n| Home | 3,4 s | **1,7 s** |\n| Prezzi | 2,9 s | **1,5 s** |\n\nL\'immagine hero ora è in WebP e viene precaricata con:\n\n```tsx\n<Image src={hero} priority sizes="100vw" alt="" />\n```\n\n> Lighthouse è stato eseguito su questa macchina; su dispositivi più lenti i numeri saranno un po\' più alti.',
    schedule: 'Ho fatto in 3 passi:\n\n1. Letto `airflow/dags/daily.py` per controllare la pianificazione attuale.\n2. Cambiato `schedule` in `0 2 * * *` (le 2 di notte).\n3. Eseguito il controllo di sintassi del DAG: nessun errore.\n\nResta ancora una cosa per te:\n\n- [x] Aggiornare la pianificazione nel codice\n- [ ] Cliccare **Consenti** per scriverla nel crontab',
  },
  // la prima sessione è la continuazione di una molto lunga: si apre con il riepilogo di Claude stesso
  summary: 'Questa sessione prosegue una conversazione precedente che ha esaurito il contesto.\n\nRiepilogo:\n1. **Richiesta principale**: aggiungere la paginazione all\'API del carrello, mantenendo il formato di risposta esistente.\n2. **Fatto finora**:\n   - Letti `src/routes/cart.ts` e `src/lib/db.ts`.\n   - Concordato `page` + `limit` invece di un cursore.\n3. **Resta da fare**: scrivere i test, aggiornare la documentazione dell\'API.',
  chat: {
    keepGoing: 'ok vai avanti, e ricordati un test per l\'ultima pagina',
    stopped: 'Hai fermato Claude',
    schedule: 'ok, ora pianifica il job',
  },
  // l'incidente scriptato: tre comandi falliti di fila
  incident: 'test dei pagamenti falliti',
};
