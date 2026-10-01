# Pannello admin "Inviti" — Piano di implementazione

Data: 2026-10-01
Sostituisce, per la parte admin, il flusso "approva richieste" di `docs/superpowers/specs/2026-10-01-invite-requests-design.md`.
Assorbe la parte "saluto personalizzato" di `docs/superpowers/specs/2026-09-11-invite-greeting-design.md`.

## Obiettivo

Gli inviti li manda sempre l'admin, a mano, quando decide lui. Nessun invio o creazione automatica.

**Flusso normale**
1. L'admin ha la tabella invitati (nome, cognome, singolo/coppia/famiglia, telefono): la inserisce dal sito, una riga alla volta, oppure carica un CSV.
2. Preme "Invia su WhatsApp": si apre WhatsApp con il messaggio e il link personale già pronti.
3. L'ospite apre il link, vede la busta con il saluto giusto, conferma la presenza.

**Flusso richiesta dalla home** (chi non ha mai ricevuto il link o l'ha perso)
1. L'ospite compila il modale in home.
2. Arriva un messaggio sul bot Telegram nella chat degli admin, con nome, cognome, telefono e un avviso se la persona è già in tabella.
3. L'admin tocca il link nel messaggio (anche da telefono): si apre la pagina "Inviti" già autenticata.
   - Se è già in tabella: preme "Rimanda su WhatsApp".
   - Se non c'è: il form "Aggiungi invitato" si apre precompilato, l'admin completa (singolo/famiglia) e salva, poi preme "Invia su WhatsApp".

La richiesta dalla home non crea mai un invito da sola.

## Cosa esiste già e si riusa

- `invite_links` (token, nome, cognome, telefono, `party_size`, `sent_at`, `user_id`).
- `services/invite_link_service.py` (`generate_unique_token`, `build_invite_url`), `services/invite_message_service.py` (`build_whatsapp_url`), `services/phone_service.py` (`normalize_phone`).
- `GET /admin/invites` (filtri `to_send`/`sent`/`answered`, ricerca) e `POST /admin/invites/{id}/mark-sent`.
- `POST /invite-requests` + notifica Telegram + modale in home.
- Script `scripts/generate_invite_links.py` (import CSV).
- Componenti admin: `AdminModal`, `FilterPills`, `SearchBar`, `AdminMobileNav`; pagina di riferimento `AdminContactsPage`.

## Decisioni di progetto

- **Tipo di invito:** `invite_kind` = `single` | `couple` | `family`. Campi extra: `gender` (`m`/`f`, solo per `single`), `partner_first_name` (solo per `couple`), `family_name` (solo per `family`). `first_name`/`last_name` restano obbligatori (referente della riga).
- **Saluto calcolato al volo** (non salvato): famiglia → "Cara famiglia {family_name}", coppia → "Cari {first_name} e {partner_first_name}", singolo → "Caro/Cara {first_name}" (neutro "Cara/o" se `gender` vuoto).
- **Messaggio WhatsApp** adattato allo stesso modo: "Ciao {greeting_name}! …" dove `greeting_name` è il nome, i due nomi o "famiglia {family_name}".
- **Duplicati:** stesso telefono, oppure stesso nome+cognome (case-insensitive), contano come "già in tabella". La creazione manuale li segnala e chiede conferma; l'import CSV li salta e li riporta nel riepilogo.
- **Richieste dalla home:** restano solo `POST /invite-requests` + tabella `invite_requests` come archivio + Telegram. Gli endpoint admin di richieste (lista, approva, rifiuta, pending-count) non servono più: vanno rimossi nell'ultima fase (non blocca nulla, si può rimandare).
- **Telegram:** il messaggio contiene un link `{SITE_URL}/admin/invites?add=1&first_name=…&last_name=…&phone=…`. La pagina, se trova questi parametri, apre il form precompilato (o mostra "già in tabella" se trova il duplicato).
- **CSV da browser:** upload dalla pagina admin; stessa logica dello script (che diventa un wrapper sottile sullo stesso servizio).

## Fase 1 — Backend: modello e migrazione

- Migrazione `20261001_0015_invite_greeting_fields.py`: aggiunge a `invite_links` `invite_kind` (String, NOT NULL, default `single`), `gender`, `partner_first_name`, `family_name` (nullable).
- `models/invite_link_model.py`: nuove colonne.
- `tests/conftest.py`: nulla da cambiare (lo schema si ricostruisce dalle migrazioni).

## Fase 2 — Backend: servizio inviti e saluto

- Nuovo `services/invite_greeting_service.py`: `build_greeting(invite) -> (kind, name)` con la priorità sopra; usato da API pubblica e dal messaggio WhatsApp.
- `services/invite_message_service.py`: `build_whatsapp_url` prende il `greeting_name` invece del solo `first_name`.
- `schemas/invite_link_schema.py` + `routes/invite_link_route.py`: `GET /invites/{token}` aggiunge `greeting_kind` e `greeting_name` (resta senza telefono).
- Nuovo `services/admin_invite_service.py` (sposta/estende `invite_request_service.py`):
  - `find_duplicates(db, first_name, last_name, phone)`.
  - `create_invite(db, data, allow_duplicate)` → solleva `DuplicateInviteError` con le righe trovate.
  - `update_invite(db, invite_id, data)`, `delete_invite(db, invite_id)` (rifiuta se l'invito ha già un `user_id`).
  - Validazione per tipo (famiglia richiede `family_name`, coppia `partner_first_name`), telefono normalizzato E.164, `party_size` opzionale (≥1).
- `schemas/admin_invite_schema.py`: `AdminInviteCreate`, `AdminInviteUpdate`, `AdminInviteResponse` esteso con `invite_kind`, `greeting_name`, `party_size`, `family_name`, `partner_first_name`, `gender`.
- `routes/admin_invite_route.py`:
  - `POST /admin/invites` (409 con elenco duplicati se non `?confirm_duplicate=true`).
  - `PATCH /admin/invites/{id}`, `DELETE /admin/invites/{id}`.
  - `GET /admin/invites/lookup?first_name&last_name&phone` → duplicati (serve al deep link da Telegram).
  - restano `GET /admin/invites` e `POST …/mark-sent`.

## Fase 3 — Backend: import CSV

- Nuovo `services/invite_import_service.py`: `import_invites(db, rows) -> ImportReport` (`created`, `skipped_duplicates[]`, `errors[{row, reason}]`). Colonne CSV: `first_name,last_name,invite_kind,gender,partner_first_name,family_name,phone,party_size`. Colonne mancanti = valori vuoti (`invite_kind` vuoto = `single`). Accetta anche `;` come separatore e BOM (export da Excel).
- `scripts/generate_invite_links.py`: legge il CSV e chiama il servizio; mantiene l'output con i link.
- `POST /admin/invites/import` (multipart, solo admin, limite dimensione e righe): restituisce il report. Verificare/aggiungere `python-multipart` in `requirements.txt`.

## Fase 4 — Backend: Telegram

- `services/telegram_notify_service.py`: prima di inviare cerca duplicati (stessa funzione `find_duplicates`) e scrive nel messaggio "✅ Già in tabella: {nome} (inviato il …)" oppure "🆕 Non è in tabella"; aggiunge il link con i parametri della richiesta.
- La notifica resta in background e non fa mai fallire la richiesta.

## Fase 5 — Frontend: pagina admin "Inviti"

- Rotta `invites` sotto `/admin` in `App.tsx`; voce "Inviti" in `ADMIN_ROUTES` (`AppTopBar.tsx`, icona `Send`/`Mail`), in `AdminMobileNav` e chiave `admin.nav.invites` nelle 4 lingue.
- `services/adminInvitesApi.ts`: lista, crea, aggiorna, elimina, lookup, mark-sent, import CSV.
- `pages/AdminInvitesPage/` (mobile-first, come `AdminContactsPage`):
  - `SearchBar` + `FilterPills` (Tutti / Da inviare / Inviati / Hanno risposto) + contatori.
  - Una card per invitato: nome, tipo, telefono, stato (da inviare / inviato il … / ha risposto sì-no), pulsanti **"Invia su WhatsApp"** (o "Rimanda"), "Copia link", "Modifica".
  - "Invia su WhatsApp": apre `whatsapp_url` in nuova scheda, poi chiama `mark-sent`.
  - Pulsante **"Aggiungi invitato"** → `AdminModal` con form (nome, cognome, tipo, nome famiglia/partner/genere in base al tipo, telefono, numero persone). Il controllo duplicati chiama `lookup`; se trova qualcuno mostra "Già in tabella" con i pulsanti per rimandare, o "Aggiungi comunque".
  - Pulsante **"Importa CSV"** → scelta file, report finale (creati, saltati, errori per riga).
  - Deep link da Telegram: parametri `add=1&first_name&last_name&phone` aprono il form precompilato (o evidenziano il duplicato). Dopo l'apertura i parametri vengono tolti dall'URL.
- La pagina passa dal normale `AuthGuard` admin: se non loggato, login e poi ritorno al link (verificare che il redirect post-login conservi la query).

## Fase 6 — Frontend: saluto nella busta

- `services/inviteApi.ts`: tipo `InviteLink` con `greeting_kind`, `greeting_name`.
- `EnvelopeInvite.tsx`: usa `greeting_kind`/`greeting_name` al posto di `firstName`; scelta chiave i18n.
- Nuove chiavi (sostituiscono `invite.greeting`) in `it/en/fr/de.ts`: `invite.greetingSingleM`, `greetingSingleF`, `greetingSingleNeutral`, `greetingCouple`, `greetingFamily`.

## Fase 7 — Pulizia (rimandabile)

- Rimuovere da backend `list_invite_requests`, `approve`, `reject`, `pending-count`, `ApproveInviteRequestResponse` e relativi test; tenere `POST /invite-requests` e la tabella.
- Aggiornare le due specifiche e `docs/DEPLOYMENT.md` (variabili `SITE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).

## Test

- **Backend** (pytest, `tests/test_admin_invites_api.py` + nuovi): saluto per le 4 combinazioni e fallback; creazione per tipo con validazioni; 409 sui duplicati e `confirm_duplicate`; update/delete (delete rifiutato se l'ospite ha già risposto); `lookup`; import CSV (righe valide, duplicati saltati, errori per riga, separatore `;`, BOM); messaggio WhatsApp per singolo/coppia/famiglia; Telegram con e senza duplicato (client finto); accesso negato ai non admin.
- **Frontend** (vitest): validazione del form per tipo; lettura dei parametri deep link; scelta chiave i18n del saluto per `greeting_kind`; funzione che apre WhatsApp e poi chiama `mark-sent`.
- **Manuale:** da telefono, con link Telegram → login → form precompilato → salva → "Invia su WhatsApp".

## Ordine consigliato e commit

1. Fasi 1–2 (backend base e saluto), commit separati.
2. Fase 3 (import CSV).
3. Fase 5 (pagina admin) con la 6 (saluto busta): da qui il flusso è usabile.
4. Fase 4 (Telegram con link e controllo duplicati).
5. Fase 7 (pulizia).

## Fuori perimetro

Precompilazione RSVP al rientro (`GET /invites/{token}/rsvp` già pronto, frontend da fare in un piano a parte), rimozione della fazione, invio WhatsApp automatico via API, SMS ed email.

## Punti da confermare

1. Colonne del tuo CSV: corrispondono a quelle sopra? Se hai già un file, mandalo e adatto i nomi.
2. Per la coppia, il messaggio WhatsApp deve dire "Ciao Mario e Giacomina"? E per la famiglia "Ciao famiglia Rossi"?
3. Eliminare un invito già inviato ma senza risposta: lo permettiamo (con conferma)?
