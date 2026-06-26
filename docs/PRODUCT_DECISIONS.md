# AOT Wedding App — Decisioni di prodotto

Documento di riferimento per sviluppo, agenti AI e scelte UX.  
Ultimo aggiornamento: 2026-06-26

## Visione

Sito matrimonio **semplice e accessibile** su mobile, con **effetto wow** all’apertura (tema AoT),
e flusso chiaro: informarsi → registrarsi → confermare presenza (anche per familiari) → servizi/regalo → foto.

| | |
|---|---|
| **Coppia** | Ilaria & Davide |
| **Operazione** | Operation Ravenna |
| **Data** | 31 maggio 2027, 16:30 (Europe/Rome) |
| **Luogo** | Lido Adriano · Amarissimo Cala Celeste · Ravenna |

Costanti codice: `frontend/src/constants/weddingEvent.ts`

---

## 1. Inviti e registrazione

### 1.1 Modello inviti (scelto: A)

- Bigliettino cartaceo con **QR → sito** (URL canonico).
- **Nessuna lista chiusa** a livello tecnico: chi ha il link può registrarsi.
- Su alcuni biglietti sono invitati **più persone (familiari)** — gestiti nel RSVP di gruppo.

### 1.2 Registrazione obbligatoria

- Per **confermare presenza** e **caricare foto** serve account (email + password alla prima volta).
- Non si usa il flusso legacy “token ospite” (tabella `guests` rimossa).

### 1.3 Autenticazione — compromesso

| Momento | Meccanismo |
|---------|------------|
| Prima conferma | Registrazione/login con **email + password** (+ “Ricordami” consigliato) |
| Modifica RSVP | **Magic link** nell’email di conferma: “Modifica la tua risposta” |
| Login successivi | Password o sessione ancora valida (refresh token) |
| Password dimenticata | Fase 2: reset password o “Inviami link di accesso” |

Il magic link RSVP è **indipendente** dalla sessione JWT: apre il form senza password, solo per modificare la risposta (entro deadline).

### 1.4 Durata sessione (JWT — stato attuale)

| Variabile `.env` | Default | Effetto |
|------------------|---------|---------|
| `ACCESS_TOKEN_EXPIRES_MINUTES` | 30 | Scade spesso; il frontend lo **rinnova in automatico** su 401 |
| `REFRESH_TOKEN_EXPIRES_DAYS` | 30 | Con “Ricordami” + `localStorage` |
| `SHORT_SESSION_REFRESH_TOKEN_EXPIRES_HOURS` | 24 | Senza “Ricordami”; chiude scheda = logout |

**Produzione (da valutare):** estendere refresh a 45–60 giorni per chi conferma molto in anticipo.

Riferimenti: `backend/settings.py`, `frontend/src/services/authSession.ts`, `apiClient.ts`

---

## 2. RSVP

### 2.1 Regole business

- Un **account** = una **prenotazione di gruppo** (party) legata all’invito cartaceo.
- **Modifica consentita** fino a **15 giorni prima** del matrimonio → deadline **16 maggio 2027**.
- Dopo la deadline: sola lettura o messaggio “contattaci”.

### 2.2 Gruppo invitati (`party`)

| Regola | Valore |
|--------|--------|
| **Massimo persone per prenotazione** | **10** (`party_size` max) |
| **Minimo** | 1 (chi compila l’account) |

Per **ogni persona** del gruppo (incluso chi compila) sono obbligatori:

| Campo | Obbligatorio | Note |
|-------|--------------|------|
| **Nome** | Sì | |
| **Cognome** | Sì | |
| **Menu / intolleranze / allergie** | Sì* | Scelta menu o note; vedi sotto |
| **Menu baby** | Se applicabile | Per bambini piccoli |

\* Se non ci sono allergie, si seleziona il **menu standard** (non lasciare vuoto).

**Presenza gruppo:** indicare se l’intero gruppo partecipa o meno; in caso di assenze parziali, ogni persona va comunque elencata con la propria scelta menu (o il gruppo viene ridotto aggiornando la lista entro deadline).

### 2.3 Modello dati (target implementazione)

```
RSVP (1 per user_id)
  ├── attending: bool          # gruppo conferma / declina
  ├── faction: enum | null     # solo se attending (tema AoT)
  └── guests: GuestLine[]       # 1..10 righe

GuestLine
  ├── first_name: string
  ├── last_name: string
  ├── meal_choice: enum        # es. standard | vegetarian | vegan | gluten_free | baby
  └── dietary_notes: string?   # allergie / intolleranze / note menu baby
```

Alternativa equivalente: tabella `rsvp_guests` con FK a `rsvps.id`.

### 2.4 Campi legacy (da migrare)

| Campo attuale | Destino |
|---------------|---------|
| `dietary_notes` (unico testo) | Sostituito da note per persona in `GuestLine` |
| `faction` | Resta a livello gruppo |

### 2.5 Stato implementazione

- [x] Conferma iniziale (`POST /rsvp/confirm`) — modello vecchio (1 persona implicita)
- [ ] `party` con max 10 ospiti e righe nome/cognome/menu
- [ ] Modifica (`PATCH /rsvp/me` o equivalente)
- [ ] Blocco deadline 15 giorni
- [ ] Email conferma + magic link modifica
- [ ] Copy/i18n (rimuovere riferimenti “token invito”)

---

## 3. Hero / esperienza AoT

### 3.1 Direzione

- **Niente scroll lungo** come UX principale su mobile.
- **Trailer autoplay 3D** (timeline a tempo, ~20–40 s), scena Operation Ravenna.
- Pulsante **“Salta”** sempre visibile → landing + CTA “Conferma presenza”.
- `prefers-reduced-motion`: poster statico / countdown, senza sequenza pesante.

### 3.2 Due registri visivi

| Area | Stile |
|------|--------|
| Hero / `cinematic/` / `scenes/` | Cinematografico AoT, 3D |
| Pagine prodotto (RSVP, album, travel…) | Design system OBW (`obw-*`) |

### 3.3 Stato implementazione

- [x] Hero scroll-scrub (da sostituire/affiancare con trailer)
- [ ] Trailer a tempo + skip
- [ ] CTA mobile evidente post-hero

---

## 4. Contenuti sito

| Sezione | Accesso | Stato |
|---------|---------|--------|
| Landing (storia, cerimonia, FAQ, regalo IBAN) | Pubblico | OBW ✅ |
| Travel / servizi logistici | Login | Da migrare OBW |
| Band / programma giornata | Pubblico o login | Da aggiungere |
| Album foto | Lettura pubblica; upload con login | Da migrare OBW |
| Admin (stats, utenti, contatti) | bride / groom / admin | Parziale |

---

## 5. Album foto

- **Chi carica:** solo utenti registrati.
- **Quando:** sempre, anche **dopo** il matrimonio (nessun blocco per data).
- **Moderazione:** oggi auto-`approved`; moderazione admin opzionale in futuro.
- **Produzione:** richiede S3 (`S3_*` in `backend/.env`).

---

## 6. QR e bigliettini

- QR → **home** del sito (non token per persona).
- Generazione PNG/PDF: da fare (script o tool esterno).
- Opzionale: `?utm=paper` per analytics.

---

## 7. Accessibilità e mobile

- Target principale: **smartphone** (QR da bigliettino).
- Touch target ≥ 44px; i18n `it` / `en` / `fr` / `de`.
- Skip intro hero; `prefers-reduced-motion`.
- Piano B: contatto WhatsApp/telefono in sezione contatti.

---

## 8. Fuori scope / fasi successive

- Magic link come unico login (senza password)
- Recupero password self-service
- Storybook / catalogo design system
- Headquarters dashboard ospite esteso
- Moderazione foto in admin (API non ancora esposte)

---

## 9. Ordine di implementazione

1. RSVP: party fino a 10 ospiti (nome, cognome, menu per persona), modifica, deadline 15 gg
2. Email conferma + magic link modifica RSVP
3. Hero: trailer + skip (mobile-first)
4. Flusso register → RSVP continuo
5. Migrazione pagine secondarie OBW
6. Band/programma + asset QR bigliettino
7. (Opz.) refresh token più lungo in produzione

---

## 10. Riferimenti nel repo

| Argomento | Path |
|-----------|------|
| Data matrimonio | `frontend/src/constants/weddingEvent.ts` |
| Auth / sessione | `backend/settings.py`, `frontend/src/services/authSession.ts` |
| RSVP attuale | `backend/services/rsvp_service.py`, `frontend/src/pages/RsvpPage/` |
| Checklist UI | `.cursor/skills/aot-premium-design/ui-migration-checklist.md` |
| Agenti Cursor | `.cursor/README.md` |
