# Design: accesso senza password per l'RSVP ospiti

Data: 2026-08-26
Stato: in revisione (brainstorming completato, in attesa di conferma prima di `writing-plans`)
Riferimento visivo: mockup condivisi dall'utente (sezioni 2A, 2B, 2C, 3A, 3B) — screenshot allegati alla conversazione, non un file nel repo.

## Perché

L'accesso attuale (§1.2/§1.3 di `docs/PRODUCT_DECISIONS.md`) richiede email+password anche solo per confermare la presenza. L'utente vuole che i propri parenti (~70 anni, poca dimestichezza con la tecnologia) possano confermare senza dover creare/ricordare una password, mantenendo comunque il controllo su chi può rispondere (non registrazione pubblica aperta a chiunque) e senza esporre dati di altri invitati.

Questo design **sostituisce solo la porta d'ingresso** per gli ospiti. La logica RSVP già esistente (party fino a 10, doppia select+testo per persona, fazione auto-bilanciata, modifica fino al 6 maggio 2027) resta invariata — vedi audit di codebase del turno precedente in questa conversazione, che ha confermato che quella parte è già implementata correttamente nonostante la doc dicesse il contrario.

## Fuori perimetro (rimandato, non in questo giro)

- Interfaccia admin per gestire/inviare la lista inviti (mockup 2B) — resta lo script CLI `generate_invite_links.py`. Branch a parte.
- Codice di verifica via email al primo accesso da dispositivo nuovo per l'account sposi (mockup 3B, proposta) — branch a parte.
- Precompilare nel form RSVP il numero di posti riservati per il gruppo (es. "Famiglia Rossi · 4 posti" nel mockup 3A) — richiederebbe estendere `invite_links` con la dimensione del gruppo atteso; segnalato come possibile prossimo passo ma non richiesto esplicitamente, non incluso qui.
- Invio dell'invito via WhatsApp/Email/Link dal sito (mockup 2B) — oggi il link si copia manualmente dall'output dello script CLI; resta così.

## Architettura

**Prima (oggi):** ospite → `/auth/register` (email+password pubblica) → sessione JWT → `/rsvp/*`.

**Dopo:** ospite → `/invito/{token}` (già costruito, invariato) → "Conferma la presenza" → form RSVP con richiesta email inline (non bloccante: non aspetta un click su un link per la primissima conferma, per il mockup 3A) → conferma scritta subito → email di riepilogo con link di rientro. Per tornare più tardi: stesso link WhatsApp, oppure "hai perso il link?" con recupero via email (questo sì genera e richiede un magic link).

Sotto al cofano, la sessione RSVP continua a essere un utente JWT come oggi — non riscriviamo la logica RSVP. La differenza è che questo "utente" viene creato automaticamente al momento della conferma, senza password, associato al token dell'invito.

## Modifiche al modello dati

- `users.password_hash` diventa **nullable** — gli utenti ospite (`role='guest'`) non ne hanno uno; gli account sposi/admin continuano a richiederlo (invariato per loro).
- `invite_links` guadagna `user_id` (nullable, FK a `users.id`, unique quando valorizzato) — collega il token al primo utente-ospite creato per quell'invito, così un rientro successivo riusa lo stesso utente/RSVP invece di crearne un altro.
- `RSVP`/`RsvpGuest`: **nessuna modifica**. L'RSVP resta legato a `user_id` come oggi; l'utente-ospite è solo un modo diverso di *ottenere* quell'user_id, non un nuovo modello parallelo.
- Nuova tabella `guest_magic_links`: `id`, `invite_link_id` (FK), `email`, `token_hash` (l'email non contiene mai il token in chiaro nei log), `expires_at`, `used_at` (nullable — un link è mono-uso), `created_at`.

## Flusso lato backend

1. **Prima conferma** (nuova rotta `POST /invites/{token}/rsvp`, pubblica — non richiede una sessione già esistente, a differenza di `/rsvp/confirm`): riceve token + email + payload RSVP (party, menu). Trova l'`invite_link` dal token (404 se non esiste, stesso comportamento di oggi). Se `invite_link.user_id` è vuoto, crea uno `User` (`role="user"` (stesso ruolo di un utente normale — non serve un nuovo valore di enum, `password_hash IS NULL` è già il segnale sufficiente che si tratta di un account senza password), `password_hash=NULL`, nome/cognome dall'invite_link, email quella appena data) e lo collega. Delega a `confirm_rsvp_for_user` **esistente**, invariato. In più genera un `guest_magic_link` e lo manda via email come riepilogo/link di rientro — ma la richiesta risponde subito con l'esito della conferma, senza aspettare che il link venga aperto.
2. **Recupero accesso** (`POST /auth/guest-magic-link/request`): riceve un'email, cerca lo `User` con quell'email e `role="user"` (stesso ruolo di un utente normale — non serve un nuovo valore di enum, `password_hash IS NULL` è già il segnale sufficiente che si tratta di un account senza password); se trovato, crea un nuovo `guest_magic_links` (invalidando eventuali precedenti non usati) e manda l'email via Resend. Risposta identica sia che l'email esista sia che non esista (per non rivelare chi è invitato — stesso principio del 404 uniforme già usato altrove).
3. **Verifica** (`GET /auth/guest-magic-link/verify?token=...`): valida hash+scadenza+non-uso, marca `used_at`, emette la sessione JWT esistente per quello `User`, redirect al form RSVP (già autenticato).
4. Scadenza magic link: **24 ore**, come nel mockup. Un nuovo invio invalida il precedente. Cooldown di reinvio 60s (il mockup mostra un countdown, valore esatto non vincolante).

## Frontend

- `EnvelopeInvite.tsx`: il CTA "Conferma la presenza" non porta più a `/auth/register` con prefill — apre lo step "dove ti scriviamo" (nuovo, piccolo componente) e poi il form RSVP vero (quello esistente, riusato).
- Nuova pagina leggera per "hai perso il link?" (richiesta magic link) e per l'atterraggio dopo il click (verifica + redirect).
- `RegisterPage`/rotta `/auth/register`: il link "Non hai un account? Registrati" viene **rimosso** dalla pagina di login (resta solo per chi arriva già su quell'URL direttamente, ma senza promozione — coerente col mockup 3B che lo mostra barrato).
- Nessuna modifica al form RSVP stesso (party/menu/fazione) né alle pagine Album/Travel/Profile.

## Sicurezza

- Il token dell'invito resta l'unico modo di raggiungere l'RSVP di un gruppo specifico (96 bit di entropia, già così).
- L'email raccolta al momento dell'RSVP **non apre nulla da sola** — serve solo a mandare il magic link di rientro; non c'è un endpoint che accetta "email" e basta per autenticare.
- Il magic link è mono-uso, scade in 24h, e invalida i precedenti alla riemissione.
- Gli account sposi/admin restano email+password, invariati, non toccati da questo design.

## Test

- Backend: nuovo test per `POST /invites/{token}/rsvp` (crea utente guest, chiama servizio RSVP esistente, idempotenza su seconda chiamata con stesso token → riusa lo stesso user); test su `guest-magic-link/request` (risposta uniforme trovato/non-trovato) e `/verify` (scadenza, mono-uso, invalidazione al reinvio).
- Frontend: aggiornare eventuali test esistenti su `EnvelopeInvite`/`RegisterPage` che assumono il vecchio flusso; nuovo test per il nuovo step email.
