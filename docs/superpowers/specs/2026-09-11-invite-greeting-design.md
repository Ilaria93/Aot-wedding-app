# Design: saluto personalizzato negli inviti (singolo / coppia / famiglia)

Data: 2026-09-11
Stato: in revisione (brainstorming completato, in attesa di conferma prima di `writing-plans`)

## Perché

Oggi ogni invito ha solo `first_name`/`last_name` e il saluto mostrato all'ospite è sempre genere-neutro ("Cara/o {{firstName}},"). L'utente vuole spedire inviti reali via WhatsApp dove il saluto sia corretto per situazioni diverse: una persona sola (con genere corretto, Caro/Cara), una coppia ("Cari Mario e Giacomina"), o un intero nucleo famigliare ("Cara famiglia Rossi"). Questo si prepara caricando un CSV con più colonne, con lo script CLI esistente (`generate_invite_links.py`) esteso di conseguenza.

## Fuori perimetro (deciso esplicitamente in questo giro)

- **Nessuna interfaccia admin.** Niente pagina per caricare il CSV dal browser, niente tabella/flag "inviato" nel pannello admin. La gestione di quali inviti esistono e se sono stati mandati avviene **direttamente su Neon** (dashboard → Tables), che espone già una vista/editor delle righe di `invite_links` senza bisogno di costruire nulla nel sito.
- **Nessun invio automatico** (WhatsApp Business API, email transazionale). L'invio resta manuale, fuori dal sito, copiando il link generato dallo script.
- Tutto quello già segnato fuori perimetro in `docs/superpowers/specs/2026-08-26-passwordless-guest-rsvp-design.md` (§Fuori perimetro) resta tale.

## Modifiche al modello dati

Nuove colonne su `invite_links` (nessuna tabella nuova — un invito resta una riga sola):

| Campo | Tipo | Note |
|---|---|---|
| `gender` | stringa breve, nullable (`"m"` / `"f"`) | Usato solo per il saluto singolo; ignorato se c'è `partner_first_name` o `family_name` |
| `partner_first_name` | stringa, nullable | Nome del "compagno/a" — se presente, saluto di coppia |
| `family_name` | stringa, nullable | Cognome/nome del nucleo famigliare — se presente, vince su tutto il resto |
| `sent` | booleano, default `false` | Spuntato a mano su Neon dopo aver effettivamente mandato il messaggio; non letto/scritto da nessun endpoint applicativo |

`first_name`/`last_name` restano **sempre obbligatori**: identificano la riga/il referente nella tabella (utile per orientarsi su Neon), anche quando il saluto mostrato all'ospite userà `family_name` al posto del nome proprio.

Migrazione Alembic: `ALTER TABLE invite_links ADD COLUMN gender ..., ADD COLUMN partner_first_name ..., ADD COLUMN family_name ..., ADD COLUMN sent boolean NOT NULL DEFAULT false`. Tutte le colonne nullable eccetto `sent` (con default), quindi nessun backfill necessario per le righe esistenti.

## Logica del saluto

Calcolata **al momento in cui l'ospite apre il link** (non salvata come stringa fissa — se un domani si corregge un nome a mano su Neon, il saluto si aggiorna da solo), con questa priorità:

1. `family_name` valorizzato → saluto famiglia: *"Cara famiglia {family_name},"*
2. altrimenti `partner_first_name` valorizzato → saluto di coppia: *"Cari {first_name} e {partner_first_name},"*
3. altrimenti → saluto singolo in base a `gender`: *"Caro {first_name},"* (m) / *"Cara {first_name},"* (f). Se `gender` è vuoto su una riga senza compagno/famiglia, fallback su *"Cara/o {first_name},"* (comportamento attuale, invariato) — non deve mai rompersi per una riga incompleta.

## Formato CSV (per lo script `generate_invite_links.py`)

```
first_name,last_name,gender,partner_first_name,family_name,phone,party_size
Mario,Rossi,m,,,+39 333 1234567,2
Anna,Bianchi,f,Marco,,+39 333 7654321,2
Giuseppe,Verdi,,,Verdi,+39 333 1112233,4
```

- `gender`: `m` o `f`, facoltativo (vedi fallback sopra).
- `partner_first_name`, `family_name`: facoltativi, mutuamente esclusivi nell'effetto (se entrambi valorizzati per errore, vince `family_name` — vedi priorità sopra).
- `phone`, `party_size`: facoltativi, comportamento invariato rispetto a oggi.

**Duplicati al re-import**: lo script, prima di creare una riga, controlla se esiste già un `invite_links` con lo stesso `first_name`+`last_name` (case-insensitive). Se sì, **la salta** (stampa un avviso, non crea né aggiorna nulla) — così si può ricaricare lo stesso CSV con righe aggiunte in fondo senza generare inviti doppi per chi c'è già.

## Backend

- `backend/models/invite_link_model.py`: aggiunte le 4 colonne.
- `backend/schemas/invite_link_schema.py`: la risposta pubblica di `GET /invites/{token}` guadagna `greeting_kind` (`"single_m" | "single_f" | "family" | "couple"`) e `greeting_name` (il nome/i nomi/il cognome da interpolare) calcolati da `services/invite_link_service.py`, al posto del solo `first_name` grezzo usato oggi dal frontend per il saluto (il resto dei campi pubblici — `min/max_party_guests` — non cambia).
- `backend/scripts/generate_invite_links.py`: legge le nuove colonne CSV, applica lo skip-duplicati per nome+cognome, passa i nuovi campi a `InviteLink(...)`.

## Frontend

- `frontend/src/components/EnvelopeInvite/EnvelopeInvite.tsx`: riceve `greetingKind`/`greetingName` invece di `firstName`, e sceglie la chiave i18n corrispondente invece del singolo `invite.greeting` di oggi.
- Nuove chiavi i18n (sostituiscono `invite.greeting`) in `it/en/fr/de.ts`:
  - `invite.greetingSingleM`: "Caro {{name}}," (IT) — equivalenti neutri per le lingue senza genere grammaticale marcato in questo contesto (EN/FR/DE useranno "Dear {{name}}," o form equivalenti, senza distinzione di genere se la lingua non lo richiede per un saluto simile)
  - `invite.greetingSingleF`: "Cara {{name}},"
  - `invite.greetingCouple`: "Cari {{name}}," (name = "Mario e Giacomina")
  - `invite.greetingFamily`: "Cara famiglia {{name}}," (name = solo il cognome/nome famiglia)

## Test

- Backend: nuovo test sulla funzione di calcolo saluto (le 4 combinazioni + il fallback su gender vuoto); test su `generate_invite_links.py` per lo skip-duplicati (stesso CSV lanciato due volte → seconda volta 0 righe create); test che `GET /invites/{token}` esponga `greeting_kind`/`greeting_name` coerenti con le colonne del DB.
- Nessun test frontend nuovo oltre ad aggiornare quelli esistenti su `EnvelopeInvite` che assumono la prop `firstName`.
