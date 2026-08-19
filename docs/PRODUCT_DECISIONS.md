# AOT Wedding App — Decisioni di prodotto

Documento di riferimento per sviluppo, agenti AI e scelte UX.  
Visione, stack, hero e roadmap → [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md).

Ultimo aggiornamento: 2026-06-29

## Visione

Sito matrimonio **semplice e accessibile** su mobile, con **effetto wow** all’apertura (tema AoT / Operation Ravenna),
e flusso chiaro: informarsi → registrarsi → confermare presenza (anche per familiari) → servizi/regalo → foto.

| | |
|---|---|
| **Coppia** | Ilaria & Davide |
| **Operazione** | Operation Ravenna |
| **Data** | 31 maggio 2027, 16:30 (Europe/Rome) |
| **Luogo** | Lido Adriano · Amarissimo Cala Celeste · Ravenna |
| **Invitati teorici** | ~140 (bigliettini / capienza) |
| **Partecipanti attesi** | ~100 o meno (stima per cucina e spille) |

Costanti codice: `frontend/src/constants/weddingEvent.ts`

---

## 1. Inviti e registrazione

### 1.1 Modello inviti (scelto: A)

- Bigliettino cartaceo con **QR → sito** (URL canonico).
- **Nessuna lista chiusa** a livello tecnico: chi ha il link può registrarsi.
- Su alcuni bigliettini sono invitati **più persone (familiari)** — gestiti nel RSVP di gruppo.

### 1.1bis Invito digitale personalizzato (WhatsApp) — busta animata

Canale **aggiuntivo**, non sostitutivo del QR generico: per gli invii diretti (WhatsApp),
un link tipo `/invito/{token}` apre una busta animata (CSS puro, click sul sigillo →
si apre) con il nome dell'invitato precompilato.

- **Non è un meccanismo di autenticazione** — resta fuori scope il passwordless login (§8).
  Il token risolve solo `first_name`/`last_name` per personalizzare il saluto, via
  `GET /invites/{token}` pubblico e read-only. Nessun dato di sessione, nessun RSVP.
- Tabella dedicata `invite_links` (id, token, first_name, last_name, created_at),
  generata offline con `backend/scripts/generate_invite_links.py` a partire da un CSV.
- Il tasto "Conferma presenza" nella busta porta a `/auth/register` con nome/cognome
  precompilati (passati via router state, mai in URL/query — restano fuori da history e log).
- Non cambia §1.1: chi non ha un link personale può comunque registrarsi dal QR/home.

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
- L’utente si **registra**, poi indica **quanti partecipano** e inserisce **manualmente** i dati di ciascuno.
- **Modifica consentita** fino a **25 giorni prima** del matrimonio → deadline **6 maggio 2027**.
- Dopo la deadline: **nessuna modifica** (blocco totale — avviso cucina ~2 settimane prima dell’evento).
- Motivo deadline: comunicare i numeri finali alla cucina con margine sufficiente.

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
| **Tipo menu** | Sì | Select — vedi §2.3 |
| **Intolleranze** | Sì | Select — vedi §2.3; default “Nessuna” |
| **Altre segnalazioni** | No | Campo testo libero (allergie non in lista, note baby, ecc.) |

**Presenza:** l’account indica quanti partecipano; ogni partecipante è una riga con nome, cognome e scelte menu. Non tutti gli invitati teorici (~140) si registreranno: i totali reali emergono dalle conferme.

### 2.3 Menu — due select + testo

**Select 1 — Tipo menu**

| Valore | Note |
|--------|------|
| Standard | Default |
| Vegetariano | |
| Vegano | |
| Senza glutine | |
| Menu bambino | |

**Select 2 — Intolleranze**

| Valore |
|--------|
| Nessuna |
| Glutine |
| Lattosio |
| Uova |
| Frutta a guscio |
| Pesce / crostacei |
| Altro (specificare nel campo testo) |

**Campo testo — Altre segnalazioni:** allergie non coperte, preferenze baby, note per la cucina.

Lista intolleranze **v1**: come sopra; aggiornabile se la cucina richiede voci diverse.

### 2.4 Fazioni (3 reggimenti — tema AoT)

#### Comportamento

- **3 fazioni**, ispirate alle tre divisioni di AoT (verde / guarnigione / gendarmeria).
- L’ospite **non sceglie** la fazione: viene **assegnata automaticamente dal backend al save**.
- **Tutto il gruppo** (famiglia / party) riceve la **stessa fazione**.
- **Bilanciamento:** ad ogni save il backend assegna la fazione con il **conteggio persone più basso** (tie-break deterministico).
- Target indicativo su ~100 partecipanti: ~33 / ~33 / ~33 (non un cap fisso su 140 invitati teorici).

#### Nomi in UI — custom Operation Ravenna (da definire)

**Non** usare in produzione nomi canon AoT su spille e materiali stampati se si preferisce un’identità propria.

| ID codice (stabile) | Ruolo AoT | Colore / icona | Nome display (TBD — esempi) |
|---------------------|-----------|----------------|----------------------------|
| `scout_regiment` | Corpo di ricerca | Verde | es. *Compagnia del Volo* |
| `garrison` | Guarnigione | Rosso / mura | es. *Guardia di Lido* |
| `military_police` | Gendarmeria | Blu | es. *Ordine del Cerimoniale* |

I nomi definitivi li sceglie la coppia (tono briefing militare + matrimonio). In i18n: 4 lingue. L’ID enum resta in codice; cambiano solo le stringhe display.

#### Spille

- **1 spilla per partecipante** (ogni riga `GuestLine`), non per account.
- Admin deve poter **esportare / visualizzare** conteggi per fazione e lista nome → fazione per produzione spille.

### 2.5 Modello dati (target implementazione)

```
RSVP (1 per user_id)
  ├── attending: bool
  ├── faction: enum | null     # assegnata dal BE al save; null se non partecipa
  └── guests: GuestLine[]       # 1..10 righe

GuestLine
  ├── first_name: string
  ├── last_name: string
  ├── meal_choice: enum        # standard | vegetarian | vegan | gluten_free | baby
  ├── intolerance: enum        # none | gluten | lactose | eggs | nuts | seafood | other
  └── dietary_notes: string?   # testo libero — altre segnalazioni
```

Alternativa equivalente: tabella `rsvp_guests` con FK a `rsvps.id`.

### 2.6 Campi legacy (da migrare)

| Campo attuale | Destino |
|---------------|---------|
| `dietary_notes` (unico testo) | Sostituito da meal + intolerance + note per persona |
| `faction` scelta utente | Sostituita da **assegnazione automatica** bilanciata |

### 2.7 Stato implementazione

- [x] Conferma iniziale (`POST /rsvp/confirm`) — modello vecchio (1 persona implicita)
- [ ] `party` con max 10 ospiti e righe nome/cognome/menu
- [ ] Due select menu + campo testo per persona
- [ ] Fazione auto-assegnata e bilanciata (gruppo omogeneo)
- [ ] Modifica (`PATCH /rsvp/me` o equivalente)
- [ ] Blocco deadline **25 giorni** (6 maggio 2027)
- [ ] Email conferma + magic link modifica
- [ ] Admin: conteggi fazione per spille / export
- [ ] Copy/i18n (rimuovere riferimenti “token invito”; aggiornare nomi fazione custom)

---

## 3. Hero / esperienza AoT

### 3.1 Direzione (decisa)

- **Ora:** hero = **immagine fissa** stile briefing operazione (no sviluppo trailer finché RSVP non è pronto).
- **Dopo:** trailer **≈35–55 s**, stile reel + overlay testi (Astra) e parallax opzionale desktop (One Piece).
- **Narrazione:** 10 atti Operation Ravenna (vialetto → ODM → mura → giganti → couple strike → countdown) — vedi [`hero-references/HERO_STORYBOARD.md`](hero-references/HERO_STORYBOARD.md).
- **Produzione:** video prerender + overlay React; 3D WebGL in pausa come runtime mobile.
- Pulsante **“Salta”** sempre visibile → landing + CTA “Conferma presenza”.
- `prefers-reduced-motion`: poster statico / countdown, senza sequenza pesante.
- **Mobile-first:** 90%+ aperture da smartphone (QR).

### 3.2 Look del sito (oltre l’hero)

Mix **briefing militare** + **matrimonio elegante AoT**: non rivista di nozze generica, non UI da videogioco. Copy e skin richiamano Operation Ravenna; form RSVP restano chiari.

### 3.3 Stato implementazione

- [x] Hero scroll-scrub 3D (in pausa — non estendere)
- [ ] Placeholder immagine briefing + CTA
- [ ] Redesign pagine verso identità AoT-matrimonio
- [ ] Trailer video reel-style + skip (fase successiva)
- [ ] Test su iPhone + Android reali

---

## 4. Contenuti sito

| Sezione | Accesso | Stato |
|---------|---------|--------|
| Landing (storia, cerimonia, FAQ, regalo IBAN) | Pubblico | OBW ✅ — **da riallineare** look AoT |
| Travel / servizi logistici | Login | Da migrare |
| Band / programma giornata | Pubblico o login | Da aggiungere |
| Album foto | Lettura pubblica; upload con login | Da migrare |
| Admin (stats, utenti, fazioni, contatti) | bride / groom / admin | Parziale — serve export spille |

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
- BaaS (Supabase/Firebase) al posto del backend custom — **non previsto**

---

## 9. Ordine di implementazione

1. Placeholder hero + direzione visiva AoT-matrimonio (mix briefing + elegante)
2. RSVP: party fino a 10, due select menu + testo, fazione auto-bilanciata, modifica, deadline **6 maggio 2027**
3. Email conferma + magic link modifica RSVP
4. Flusso register → RSVP continuo + login allineato
5. Pagine Album, Travel, Profile, Admin + export fazioni per spille
6. Storyboard hero → video reel (AI / montaggio esterno) → integrazione mobile
7. Band/programma + asset QR bigliettino

---

## 10. Riferimenti nel repo

| Argomento | Path |
|-----------|------|
| Data matrimonio | `frontend/src/constants/weddingEvent.ts` |
| Auth / sessione | `backend/settings.py`, `frontend/src/services/authSession.ts` |
| RSVP attuale | `backend/services/rsvp_service.py`, `frontend/src/pages/RsvpPage/` |
| Fazioni (enum) | `frontend/src/services/rsvpApi.ts` (`FactionId`) |
| Invito digitale (WhatsApp) | `backend/models/invite_link_model.py`, `backend/scripts/generate_invite_links.py`, `frontend/src/pages/InvitePage/` |
| Checklist UI | `.cursor/skills/aot-premium-design/ui-migration-checklist.md` |
| Agenti Cursor | `.cursor/README.md` |
| Storyboard hero | `docs/hero-references/HERO_STORYBOARD.md` |
| Frame / video ref. | `docs/hero-references/` (`.mov` in `.gitignore`) |
