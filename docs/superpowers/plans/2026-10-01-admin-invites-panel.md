# Pannello admin "Inviti" — Piano di implementazione

Data: 2026-10-01 (rev. 2: tabella a persone collegate)
Sostituisce, per la parte admin, il flusso "approva richieste" di `docs/superpowers/specs/2026-10-01-invite-requests-design.md`.
Sostituisce il modello dati della specifica `docs/superpowers/specs/2026-09-11-invite-greeting-design.md` (colonne `partner_first_name`/`family_name`/`sent`), tenendone la logica del saluto e le regole di import.

## Obiettivo

Gli inviti li manda sempre l'admin, a mano, quando decide lui. Nessun invio o creazione automatica.

**Flusso normale**
1. L'admin inserisce gli invitati in tabella: una persona alla volta dal sito, oppure caricando un CSV.
2. Preme "Invia su WhatsApp" sul **capofamiglia**: si apre WhatsApp con il messaggio e il link personale già pronti.
3. L'ospite apre il link, vede la busta con il saluto giusto e conferma la presenza (indicando lui quante persone vengono).

**Flusso richiesta dalla home** (chi non ha mai ricevuto il link o l'ha perso)
1. L'ospite compila il modale in home.
2. Arriva un messaggio sul bot Telegram nella chat degli admin, con nome, cognome, telefono e se la persona è già in tabella (anche come persona collegata a un capofamiglia).
3. L'admin tocca il link nel messaggio (anche da telefono): si apre la pagina "Inviti".
   - Già in tabella: preme "Rimanda su WhatsApp" (può mandarlo al numero di chi ha fatto la richiesta).
   - Non c'è: il form "Aggiungi persona" si apre precompilato; l'admin lo completa, salva, poi invia.

La richiesta dalla home non crea mai niente da sola.

## Modello dati: persone collegate

Ogni persona è una riga di `invite_links` (la tabella esiste già e non si rinomina). Le relazioni stanno nella tabella.

| Campo | Note |
|---|---|
| `id`, `first_name`, `last_name`, `phone` (E.164, facoltativo), `gender` (`m`/`f`, facoltativo) | la persona. `first_name`/`last_name` obbligatori |
| `head_id` | FK a `invite_links.id`. Vuoto = capofamiglia, cioè la persona che riceve l'invito |
| `relation` | relazione con il capofamiglia: `spouse` (coniuge), `partner` (fidanzato/a), `child` (figlio/a), `other`. Vuota per i capofamiglia |
| `family_name` | solo sul capofamiglia, facoltativo. Se vuoto si usa il cognome del capofamiglia ("famiglia Rossi") |
| `token`, `sent_at`, `user_id`, `party_size`, `created_at` | restano; `token` diventa **nullable**: solo i capofamiglia hanno il token e il link |

Vincoli: `head_id` deve puntare a un capofamiglia (niente catene: un figlio non può essere capo di un altro gruppo); un capofamiglia ha token sempre; una persona collegata non ha token, né `sent_at`.

Esempi:
- Christian Rossi (capo) · Arianna (`spouse`) · Matteo (`child`) · altri due figli (`child`) → un solo invito, a Christian: "Cara famiglia Rossi".
- Chiara Bianchi (capo) · Luca Verdi (`partner`) → un solo invito, a Chiara: "Cari Chiara e Luca".
- Anna Neri sola → "Cara Anna" (o "Caro" con `gender` `m`).

### Saluto (calcolato al volo, mai salvato)

1. Il gruppo ha almeno un `spouse` o un `child` (o `family_name` valorizzato) → **"Cara famiglia {family_name o cognome del capo}"**.
2. Altrimenti il gruppo ha un `partner` → **"Cari {nome capo} e {nome partner}"** (se i partner sono più d'uno, "Cari A, B e C").
3. Altrimenti, persona sola → **"Caro {nome}"** (`gender` `m`) / **"Cara {nome}"** (`gender` `f`); se `gender` è vuoto, "Cara/o {nome}" come oggi.

Il messaggio WhatsApp usa lo stesso testo: "Cara famiglia Rossi! Davide e Ilaria vi aspettano il 31 maggio 2027 🕊️ …", "Cari Chiara e Luca! …", "Ciao Anna! …".

### Persone, gruppo e RSVP

- `max_party_guests` nel modulo RSVP = `party_size` se valorizzato, altrimenti il numero di persone del gruppo (capo + collegati), altrimenti il default di sito. Chi risponde indica quanti vengono davvero.
- La conferma RSVP resta legata al capofamiglia (`user_id` sul suo `invite_links`).

### Mai cancellare, mai modificare dopo l'invio

- Non esiste nessun endpoint né pulsante di eliminazione.
- Il capofamiglia e il suo gruppo si possono modificare solo finché il capo non è stato inviato (`sent_at` vuoto). Dopo l'invio il gruppo è bloccato (anche aggiungere persone, perché cambierebbe il saluto di un invito già ricevuto); resta solo **"Rimanda"**.
- Persone con `sent_at` vuoto e senza collegati: modificabili liberamente.

## Cosa esiste già e si riusa

- `invite_links` (token, nome, cognome, telefono, `party_size`, `sent_at`, `user_id`).
- `services/invite_link_service.py` (`generate_unique_token`, `build_invite_url`), `services/invite_message_service.py` (`build_whatsapp_url`), `services/phone_service.py` (`normalize_phone`).
- `GET /admin/invites` (filtri, ricerca) e `POST /admin/invites/{id}/mark-sent`.
- `POST /invite-requests` + notifica Telegram + modale in home.
- Script `scripts/generate_invite_links.py`.
- Componenti admin: `AdminModal`, `FilterPills`, `SearchBar`, `AdminMobileNav`; pagina di riferimento `AdminContactsPage`.

## Formato CSV

```
first_name,last_name,gender,relation,head,family_name,phone,party_size
Christian,Rossi,m,,,Rossi,+39 333 1111111,5
Arianna,Rossi,f,spouse,Christian Rossi,,+39 333 2222222,
Matteo,Rossi,m,child,Christian Rossi,,,
Chiara,Bianchi,f,,,,+39 333 3333333,2
Luca,Verdi,m,partner,Chiara Bianchi,,+39 333 4444444,
Anna,Neri,f,,,,+39 333 5555555,
```

- Colonne come nella specifica del saluto (`first_name,last_name,gender,phone,party_size`, più `family_name`), con in più `relation` e `head` per i collegamenti; `partner_first_name` sparisce (il partner è una riga).
- `head`: "Nome Cognome" di un capofamiglia presente nel CSV o già in tabella. L'ordine delle righe non conta (due passate: prima i capi, poi i collegati). Se il nome non esiste o corrisponde a due persone, la riga va negli errori.
- `relation` vuota = capofamiglia; valori ammessi `spouse`, `partner`, `child`, `other` (accettati anche gli equivalenti italiani `coniuge`, `fidanzato`, `figlio`, `altro`).
- `gender` solo `m`/`f`. Separatore `,` o `;`, BOM tollerato.
- Duplicati (stesso nome+cognome, o stesso telefono) saltati e riportati nel riepilogo; ricaricare lo stesso CSV non crea doppioni.

## Fase 1 — Backend: modello e migrazione

- Migrazione `20261001_0015_invite_groups.py` su `invite_links`: aggiunge `head_id` (FK self, nullable, index), `relation`, `gender`, `family_name`; rende `token` nullable (resta unique). Nessun backfill: le righe esistenti sono capofamiglia singoli.
- `models/invite_link_model.py`: colonne e relazione `head`/`members`.
- Tutto ciò che oggi assume un token (`GET /invites/{token}`, `generate_unique_token`, mark-sent) lavora solo sui capofamiglia.

## Fase 2 — Backend: servizio, saluto, endpoint admin

- `services/invite_greeting_service.py`: `build_greeting(head, members) -> (kind, name)` con le tre regole; usato da API pubblica e messaggio WhatsApp.
- `services/invite_message_service.py`: `build_whatsapp_url(phone, greeting_name, invite_url)` con testo adattato; il telefono può essere quello del capo o di un collegato (per "rimanda a chi ha chiesto").
- `GET /invites/{token}` aggiunge `greeting_kind` (`family`|`couple`|`single_m`|`single_f`|`single`) e `greeting_name`; `max_party_guests` dal gruppo. Mai telefoni.
- `services/admin_invite_service.py`:
  - `find_matches(db, first_name, last_name, phone)`: cerca tra capi **e** collegati (stesso telefono o stesso nome+cognome); restituisce anche il capofamiglia del gruppo.
  - `create_person(db, data, confirm_duplicate)`: capo (nessun `head_id`) o collegato (`head_id` + `relation`); 409 con i duplicati trovati se non confermato; 409 se il capo è già inviato.
  - `update_person(db, id, data)`: 409 se il capo del gruppo è già inviato.
  - Nessuna funzione di eliminazione.
- `routes/admin_invite_route.py`:
  - `GET /admin/invites` → solo capofamiglia, ciascuno con `members[]`, `greeting_name`, `answer`, `sent_at`, `invite_url`, `whatsapp_url`, `editable`; filtri `to_send|sent|answered` e ricerca (cerca anche tra i collegati).
  - `POST /admin/invites` (crea persona), `PATCH /admin/invites/{id}`, `GET /admin/invites/lookup?first_name&last_name&phone`.
  - `GET /admin/invites/{head_id}/whatsapp?to={person_id}`: link `wa.me` con il messaggio del capofamiglia verso il telefono di un collegato.
  - `POST /admin/invites/{id}/mark-sent` come oggi. Nessun `DELETE`.

## Fase 3 — Backend: import CSV

- `services/invite_import_service.py`: `import_invites(db, rows) -> ImportReport` (`created`, `skipped_duplicates[]`, `errors[{row, reason}]`) con le regole del formato CSV.
- `scripts/generate_invite_links.py` diventa un wrapper (e stampa i link dei capofamiglia, come oggi).
- `POST /admin/invites/import` (multipart, solo admin, limite di dimensione e di righe). Verificare `python-multipart` in `requirements.txt`.

## Fase 4 — Backend: Telegram

- `services/telegram_notify_service.py`: prima di inviare chiama `find_matches` e scrive "✅ Già in tabella: {nome} — gruppo di {capo}, invito inviato il … / non ancora inviato" oppure "🆕 Non è in tabella"; aggiunge il link `{SITE_URL}/admin/invites?add=1&first_name=…&last_name=…&phone=…`.
- Resta in background e non fa mai fallire la richiesta.

## Fase 5 — Frontend: pagina admin "Inviti"

- Rotta `invites` sotto `/admin` in `App.tsx`; voce "Inviti" in `ADMIN_ROUTES` (`AppTopBar.tsx`), in `AdminMobileNav`, chiave `admin.nav.invites` nelle 4 lingue.
- `services/adminInvitesApi.ts` (lista, crea, aggiorna, lookup, mark-sent, link WhatsApp per collegato, import CSV).
- `pages/AdminInvitesPage/` (mobile-first, come `AdminContactsPage`):
  - `SearchBar` + `FilterPills` (Tutti / Da inviare / Inviati / Hanno risposto) con contatori.
  - Una card per **capofamiglia**: nome, saluto che riceverà ("Cara famiglia Rossi"), telefono, stato (da inviare / inviato il … / risposta), l'elenco dei collegati con relazione e telefono. Pulsanti **"Invia su WhatsApp"** (diventa **"Rimanda"** dopo il primo invio), "Copia link", "Modifica" e "Aggiungi persona al gruppo" (questi ultimi due solo se non ancora inviato). Nessun pulsante "Elimina".
  - "Invia su WhatsApp": apre `whatsapp_url` in nuova scheda, poi chiama `mark-sent`. Per i collegati con telefono c'è "Manda il link a {nome}".
  - Form **"Aggiungi persona"** in `AdminModal`: nome, cognome, genere, telefono; scelta "Capofamiglia" oppure "Collegata a…" (ricerca del capo) con relazione (coniuge, fidanzato/a, figlio/a, altro); nome famiglia e numero persone sul capo. Il controllo duplicati usa `lookup`: se la persona è già in tabella mostra a quale gruppo appartiene e propone "Rimanda l'invito".
  - **"Importa CSV"**: scelta file, report finale (creati, saltati, errori per riga).
  - Deep link da Telegram: `?add=1&first_name&last_name&phone` apre il form precompilato (o evidenzia il gruppo trovato); poi i parametri vengono tolti dall'URL.
- Il redirect del login admin deve conservare la query (verificare).

## Fase 6 — Frontend: saluto nella busta

- `services/inviteApi.ts`: `InviteLink` con `greeting_kind`, `greeting_name`.
- `EnvelopeInvite.tsx`: usa `greeting_kind`/`greeting_name` al posto di `firstName`.
- Nuove chiavi (sostituiscono `invite.greeting`) in `it/en/fr/de.ts`: `invite.greetingFamily` ("Cara famiglia {{name}},"), `greetingCouple` ("Cari {{name}},"), `greetingSingleM`, `greetingSingleF`, `greetingSingleNeutral`.

## Fase 7 — Pulizia (rimandabile)

- Rimuovere dal backend `list_invite_requests`, `approve`, `reject`, `pending-count`, `ApproveInviteRequestResponse` e i relativi test; tenere `POST /invite-requests` e la tabella come archivio.
- Aggiornare le specifiche e `docs/DEPLOYMENT.md` (`SITE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).

## Test

- **Backend** (pytest): saluto per famiglia, coppia (fidanzati), singolo m/f/vuoto, e gruppo misto (coniuge + fidanzato → famiglia); `max_party_guests` dal gruppo; creazione capo e collegato, rifiuto di catene (`head_id` che punta a un collegato); 409 sui duplicati (anche trovando una persona collegata) e `confirm_duplicate`; blocco di modifica e di aggiunta persone dopo l'invio; nessuna rotta DELETE; `lookup`; import CSV (capi e collegati in qualsiasi ordine, `head` mancante o ambiguo, duplicati, `;`, BOM, ripetizione dello stesso file); messaggio WhatsApp per i 3 saluti; link WhatsApp verso un collegato; Telegram con e senza match (client finto); accesso negato ai non admin.
- **Frontend** (vitest): validazione del form (capo/collegato, relazione obbligatoria se collegato); lettura dei parametri deep link; scelta chiave i18n per `greeting_kind`; apertura WhatsApp seguita da `mark-sent`.
- **Manuale**: da telefono, link Telegram → login → form precompilato → salva → "Invia su WhatsApp".

## Ordine consigliato e commit

1. Fasi 1–2 (modello, saluto, endpoint), commit separati.
2. Fase 3 (import CSV).
3. Fasi 5–6 (pagina admin e busta): da qui il flusso è usabile.
4. Fase 4 (Telegram con link e controllo duplicati).
5. Fase 7 (pulizia).

## Fuori perimetro

Precompilazione RSVP al rientro (`GET /invites/{token}/rsvp` già pronto, frontend a parte), rimozione della fazione, invio WhatsApp automatico via API, SMS ed email, promozione di una persona collegata a capofamiglia, eliminazione di inviti.

## Decisioni confermate

1. Colonne CSV come nella specifica del saluto, più `relation` e `head` ("Nome Cognome") per i collegamenti.
2. Gli accompagnatori possono avere un telefono proprio (solo in tabella; l'invito parte dal capofamiglia).
3. Famiglia → "Cara famiglia Rossi"; fidanzati → "Cari Chiara e Luca"; singolo → "Caro/Cara" secondo `gender`.
4. Nessuna cancellazione; dopo l'invio il gruppo non si modifica, si può solo rimandare.

## Da verificare con te

- Se un gruppo ha sia moglie sia un fidanzato (caso raro), vince "famiglia". Va bene?
- Il branch `feature/admin-invites-page` dell'altra sessione non è stato trovato su GitHub: se lo recuperi, confronto il suo contenuto con questo piano prima di scrivere codice.
