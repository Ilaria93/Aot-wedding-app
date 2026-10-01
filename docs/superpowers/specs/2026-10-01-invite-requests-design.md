# Design: richiesta invito dal sito, pagina admin "Inviti" e rimozione delle fazioni

Data: 2026-10-01
Stato: approvato in brainstorming, in attesa di revisione della specifica prima di `writing-plans`

## Perché

Gli ospiti confermano la presenza solo dal **link personale** `/invito/{token}` che gli sposi mandano su WhatsApp. Chi arriva sul sito senza quel link (l'ha perso, non l'ha mai ricevuto) oggi non ha una strada: il pulsante "Apri modulo RSVP" della home porta a `/rsvp`, che richiede un account con password che gli ospiti non hanno.

Inoltre gli inviti si creano solo con lo script CLI `generate_invite_links.py` e si copiano a mano: gli sposi non hanno in admin né l'elenco degli inviti né un modo rapido di mandarli.

Infine la **fazione** (reggimento AoT assegnato al gruppo) non ha più senso per il prodotto: il backend la assegna ancora, ma la pagina del link invito non la mostra mai. Va tolta.

## Decisioni prese

- Il modale in home chiede **nome, cognome e telefono**. Niente email.
- Ogni richiesta passa dall'**approvazione degli sposi** in admin; solo dopo parte l'invito.
- L'invito si manda con **WhatsApp "con un tocco"**: un link `wa.me` con il messaggio già scritto, aperto sul dispositivo di chi approva. Vale per **tutti** gli inviti, sia quelli richiesti dal sito sia quelli dello script.
- Notifica di nuova richiesta: **bot Telegram** verso gli sposi, più un **contatore** in admin.
- Nessun profilo né password per gli ospiti: **il link personale è la chiave**. Riaprendolo si ritrova la propria risposta, modificabile fino alla deadline (6 maggio 2027).
- Chi perde il link rifà la richiesta dal sito con lo stesso telefono; in admin compare "ha già un invito" e gli sposi rimandano lo stesso link.

## Fuori perimetro

- Invio WhatsApp completamente automatico (WhatsApp Business API) e SMS (Twilio).
- Email (né transazionali né notifiche).
- Profilo ospite, registrazione, magic link via email.
- Caricamento del CSV inviti dal browser: lo script CLI resta il modo di importare inviti in blocco.

## Rapporto con la specifica del 2026-09-11 (saluto personalizzato)

`docs/superpowers/specs/2026-09-11-invite-greeting-design.md` aveva escluso un'interfaccia admin e previsto una colonna `sent` booleana gestita a mano su Neon. Questa specifica **supera quella decisione** per la parte invio: lo stato di invio diventa `sent_at` (timestamp), scritto dall'admin. Le colonne del saluto (`gender`, `partner_first_name`, `family_name`) restano di competenza di quella specifica e non sono toccate qui. Se quella specifica viene implementata prima di questa, la sua colonna `sent` va sostituita da `sent_at` nella migrazione di questa.

## Modello dati

### Nuova tabella `invite_requests`

| Campo | Tipo | Note |
|---|---|---|
| `id` | intero, PK | |
| `first_name` | stringa(80), obbligatoria | |
| `last_name` | stringa(80), obbligatoria | |
| `phone` | stringa(30), obbligatoria | Normalizzato in formato E.164 (`+393331234567`), prefisso `+39` di default se assente |
| `status` | stringa breve: `pending` / `approved` / `rejected` | Default `pending` |
| `invite_link_id` | intero, FK `invite_links.id`, nullable | Valorizzato all'approvazione |
| `created_at` | datetime | |
| `decided_at` | datetime, nullable | Quando è stata approvata o rifiutata |

### `invite_links`: nuova colonna

| Campo | Tipo | Note |
|---|---|---|
| `sent_at` | datetime, nullable | Quando l'admin ha aperto l'invio WhatsApp per quell'invito |

`invite_links.phone` esiste già ed è nullable. All'approvazione di una richiesta viene popolato con il telefono normalizzato. Per riconoscere un "ha già un invito" si confronta il telefono normalizzato.

### Rimozione fazione (fase separata, vedi §Fasi)

`rsvps.faction` viene eliminata con una migrazione Alembic (`DROP COLUMN`), insieme a `FactionEnum`, `rsvp_faction_service.py` e alle costanti collegate.

## Backend

### Pubblico

- **`POST /invite-requests`**: riceve `{first_name, last_name, phone, website}` (dove `website` è un campo honeypot che deve restare vuoto).
  - Valida e normalizza il telefono; con un formato non valido risponde 422 con un messaggio chiaro.
  - Limita le richieste: massimo 3 all'ora per lo stesso telefono e 10 all'ora per lo stesso IP (contatore in memoria del processo, sufficiente per il volume di un matrimonio). Oltre il limite risponde 429.
  - Salva la richiesta come `pending` e invia la notifica Telegram (§Telegram).
  - Risponde sempre `202 Accepted` con lo stesso corpo, sia che il telefono abbia già un invito sia che no, così dal sito non si scopre chi è invitato.
  - Con l'honeypot compilato risponde `202` senza salvare nulla.
- **`GET /invites/{token}/rsvp`**: restituisce la risposta RSVP già data per quell'invito (presenza, gruppo, menu, note), oppure `null` se l'invito non ha ancora risposto. Il token resta l'unica credenziale, come per `GET /invites/{token}`. Serve a precompilare il modulo al rientro.

### Admin (solo ruoli sposi/admin, come le altre rotte `/admin`)

- `GET /admin/invite-requests?status=pending|approved|rejected`: elenco, e per ogni richiesta il campo `existing_invite` se il telefono ha già un invito.
- `GET /admin/invite-requests/pending-count`: il numero per il badge.
- `POST /admin/invite-requests/{id}/approve`: se esiste già un invito con quel telefono lo riusa, altrimenti ne crea uno nuovo (stesso generatore di token dello script). Collega la richiesta, la segna `approved` e restituisce `{invite_link_id, invite_url, whatsapp_url}`.
- `POST /admin/invite-requests/{id}/reject`: segna la richiesta `rejected`.
- `GET /admin/invites?filter=to_send|sent|answered&search=`: tutti gli inviti, con `sent_at` e lo stato della risposta (nessuna risposta / presente / assente).
- `POST /admin/invites/{id}/mark-sent`: imposta `sent_at`. Il frontend lo chiama quando l'admin apre il link WhatsApp.

Il testo del messaggio WhatsApp viene composto nel backend da un modello unico:

> Ciao {first_name}! Davide e Ilaria ti aspettano il 31 maggio 2027 🕊️ Ecco il tuo invito personale: {invite_url}

Il link è `https://wa.me/{telefono senza +}?text={messaggio codificato}`. Se l'invito non ha un telefono, si usa `https://wa.me/?text=…` e l'admin sceglie il contatto in WhatsApp.

### Telegram

- Configurazione tramite le variabili d'ambiente `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID`. Se una delle due manca, la notifica viene saltata con un log informativo: non è un errore.
- Invio con una POST `https://api.telegram.org/bot{token}/sendMessage`, timeout breve (3 s), in background (`BackgroundTasks` di FastAPI), così la risposta all'ospite non aspetta Telegram.
- Testo: `📬 Nuova richiesta invito: {nome} {cognome} · {telefono}` più il link alla pagina admin "Inviti".
- Un errore di Telegram viene loggato e non fa fallire la richiesta, che resta comunque salvata.

## Frontend

### Home: sezione RSVP

- I passaggi della card restano due: *01 Presenza* e *02 Il tuo gruppo*. Il 03 "Fazione" viene rimosso, in tutte e 4 le lingue.
- Sotto i passaggi, nuova nota: *"Hai ricevuto il tuo invito personale su WhatsApp? Apri il link per confermare."*
- Il pulsante "Apri modulo RSVP" (che porta a `/rsvp`) diventa **"Non trovi il tuo invito? Richiedilo"** e apre il modale.

### Modale "Richiedi il tuo invito"

- È una card scura in stile landing (angoli da 14px, angolini dorati), con i campi nome, cognome e telefono (prefisso `+39` precompilato e modificabile) e il campo honeypot nascosto.
- Riga di privacy: *"Useremo il numero solo per mandarti l'invito su WhatsApp."*
- Stati: inserimento, invio in corso, successo (*"Richiesta ricevuta! Davide e Ilaria ti manderanno l'invito su WhatsApp a breve."*), errore di validazione per singolo campo, troppe richieste (429) e errore generico.
- Si chiude con Esc o con un click fuori; il focus resta dentro il modale e torna al pulsante alla chiusura.
- Testi in tutte e 4 le lingue.

### Pagina link invito (`/invito/{token}`)

- All'apertura chiama `GET /invites/{token}/rsvp`. Se c'è già una risposta, il modulo si apre precompilato e il pulsante diventa "Aggiorna la risposta"; altrimenti il comportamento resta quello di oggi.
- Dopo la deadline la risposta si vede in sola lettura, come da regola esistente.

### Admin: pagina "Inviti"

- Nuova rotta `/admin/invites` e nuova voce "Inviti" in `ADMIN_ROUTES` e `AdminMobileNav`, con un badge numerico che mostra il `pending-count`.
- **Richieste**: una card per richiesta in attesa (nome, telefono, data, eventuale avviso "Ha già un invito: {nome invito}"), con i pulsanti:
  - **"Approva e invia su WhatsApp"**: chiama `approve`, apre `whatsapp_url` in una nuova scheda e chiama `mark-sent`;
  - **"Rifiuta"**: con una conferma nel modale admin già esistente (`AdminModal`).
- **Tutti gli inviti**: elenco con `FilterPills` (Da inviare / Inviati / Hanno risposto) e `SearchBar` per nome o telefono. Per ogni invito: nome, telefono, stato e il pulsante **"Invia su WhatsApp"** (o "Rimanda" se già inviato).
- Stile: classi portale esistenti (`obw-portal-card`, `obw-portal-panel`) e componenti admin già condivisi.

## Fasi (ordine di implementazione)

1. **Backend richieste e inviti**: modello, migrazione, rotte pubbliche e admin, servizio Telegram, test.
2. **Frontend home**: card RSVP aggiornata e modale.
3. **Frontend admin**: pagina Inviti e badge.
4. **Link invito**: precompilazione al rientro.
5. **Rimozione fazione**: backend (enum, servizio, colonna e migrazione, statistiche admin), frontend (`constants/factions.ts`, riepilogo fazione, tipi, stats admin) e i18n. È indipendente dalle fasi 1-4 e va per ultima, in commit separati.

## Sicurezza e privacy

- L'endpoint pubblico non rivela mai se un telefono ha già un invito: la risposta è uniforme.
- Limiti per telefono e per IP, più l'honeypot contro i bot; niente captcha, per non penalizzare gli ospiti anziani.
- I numeri di telefono si vedono solo nelle rotte admin. `GET /invites/{token}` e `GET /invites/{token}/rsvp` non espongono mai il telefono.
- Il token Telegram resta solo nelle variabili d'ambiente del backend, mai nel frontend né nel repository.

## Test

- Backend:
  - `POST /invite-requests`: salvataggio e normalizzazione, risposta uniforme con o senza invito esistente, honeypot, limiti 429, Telegram assente o in errore che non fa fallire la richiesta (client finto).
  - Approvazione: crea l'invito nuovo, riusa quello esistente, genera `whatsapp_url` corretto.
  - Rifiuto, `pending-count`, filtri di `GET /admin/invites`, `mark-sent`.
  - Accesso negato ai non admin.
  - `GET /invites/{token}/rsvp` con e senza risposta.
  - Rimozione fazione: aggiornare i test esistenti che la verificano (`test_rsvp_api.py`, `test_admin_rsvp_stats_api.py`, `test_admin_user_list_api.py`).
- Frontend: test del modale (validazione, stati di successo ed errore) e del precompilamento dell'hook del link invito; aggiornare i test esistenti toccati dalla rimozione della fazione.
