# AOT Wedding — Brief di progetto

Documento condiviso: visione, stack, hero, roadmap.  
Regole business RSVP, fazioni, menu, date → [`PRODUCT_DECISIONS.md`](PRODUCT_DECISIONS.md).

**Specifica di rendering (atti, camera, overlay, clip):** [`HERO_RENDER_SPEC.md`](hero-references/HERO_RENDER_SPEC.md)

Ultimo aggiornamento: 2026-06-30

---

## 1. Perché questo documento

Punto di partenza per sviluppo e agenti AI:

- **Cosa** deve provare l’ospite (Operation Ravenna → matrimonio pratico).
- **Come** lo costruiamo senza sacrificare mobile e RSVP.
- **Cosa** tenere del repo attuale e cosa rifare selettivamente.

---

## 2. Visione creativa

### Concept

**Operation Ravenna** — l’ospite vive pochi secondi di tensione stile Attack on Titan (ODM tra i palazzi, mura, operazione), poi atterra su un sito matrimonio chiaro: data, luogo, RSVP, servizi, regalo, foto.

Sequenza hero **target** (fase video, non ora):

1. ODM / volo tra le vie (prima persona, ritmo reel)
2. Mura / uscita operazione
3. Corridoio / tensione (se in storyboard)
4. **Couple strike** — Ilaria & Davide
5. Flash → **31 maggio 2027, 16:30** · Lido Adriano

### Identità visiva del sito

**Problema attuale:** il sito non “sembra” un matrimonio AoT; la landing OBW è elegante ma troppo distante dal tema.

**Direzione scelta:** mix tra:

| Polo | Contenuto |
|------|-----------|
| **A — Briefing militare** | Operation Ravenna, badge fazione, countdown, copy missione |
| **B — Matrimonio elegante** | Nomi, data, luogo leggibili; whitespace; form RSVP chiari |

Non videogioco, non rivista di nozze generica. L’RSVP deve ispirare fiducia; l’intro deve dare il wow.

### Pubblico

- **90%+ smartphone** (QR bigliettino, 4G, device eterogenei).
- Età mista: skip intro, testi chiari, form semplici.
- Lingue: `it`, `en`, `fr`, `de`.
- Device test disponibili: **iPhone + Android**.

### Priorità esperienza ospite

1. Capire quando e dove
2. Registrarsi e **confermare presenza** (anche famiglia, menu)
3. Servizi / band / come arrivare
4. Regalo
5. Foto (dopo il sì)
6. Wow hero (memorabile, ma non blocca 1–2)

---

## 3. Must-have funzionali

| # | Funzionalità | Note |
|---|--------------|------|
| 1 | Landing informativa (data, luogo, storia, regalo) | Skin AoT-matrimonio |
| 2 | Hero: **ora** immagine fissa; **dopo** trailer reel skippable | Vedi §6 |
| 3 | Registrazione + login | Email + password |
| 4 | RSVP gruppo (max 10, dati per persona, 2 select menu + testo) | PRODUCT_DECISIONS |
| 5 | Fazione **auto-assegnata** (3 reggimenti, bilanciata, gruppo uguale) | Per spille |
| 6 | Modifica RSVP fino al **6 maggio 2027** | Magic link in email |
| 7 | Admin: conteggi fazione / export per **spille** (1 per partecipante) | |
| 8 | Travel, album, admin | Login dove serve |
| 9 | Album foto | Upload registrati; anche post-matrimonio |

**Numeri:** ~140 invitati teorici, ~100 partecipanti attesi (stima cucina e spille).

---

## 4. Stack tecnologico

### Scelto — evolvere il repo attuale

| Layer | Tecnologia | Note |
|-------|------------|------|
| Frontend | **Vite + React + TypeScript** | SPA matrimonio; adeguata anche per video hero + overlay |
| Backend | **FastAPI + SQLAlchemy** | RSVP, fazioni, magic link, pytest |
| DB | **PostgreSQL** | |
| Foto | **S3-compatible** | Presigned upload già presente |
| Email | **Servizio transazionale** (es. Resend, SendGrid, SMTP dominio) | Conferma RSVP + magic link; **non** è un BaaS |
| i18n | 4 lingue custom | |
| Hero (futuro) | Video MP4/WebM + React | Produzione AI/montaggio **esterna** al runtime |

### Cos’è un BaaS (e perché non ci serve ora)

**BaaS = Backend as a Service** (es. Supabase, Firebase): auth, database e storage già pronti in cloud.

Il progetto ha già JWT, RSVP, album, Alembic e test: migrare a BaaS aggiungerebbe costo e poco beneficio. Restiamo su **stack self-hosted / VPS** per API e DB.

### Scartato

| Proposta | Perché no |
|----------|-----------|
| Rewrite completo (Next + Supabase) | Perde mesi; non risolve mobile da solo |
| Tailwind al posto di SCSS | OBW in SCSS; migrazione senza valore immediato |
| 3D WebGL come unica hero | Non prioritario; reel video più adatto al mobile |

---

## 5. Rifare da capo?

### Verdetto: **no al rewrite totale**

| Tenere | Rifare / evolvere |
|--------|-------------------|
| FastAPI, Postgres, S3, auth JWT | UI pagine → identità AoT-matrimonio |
| Landing, i18n, test backend | RSVP party, fazioni, deadline |
| Codice `cinematic/` (in pausa) | Hero: placeholder → video reel |

### Cosa non convinceva (e il fix)

1. **Look generico** → redesign mix briefing + elegante AoT
2. **RSVP incompleto** → sprint `feature/rsvp-party`
3. **Hero scroll 3D su mobile** → congelato; obiettivo = video reel corto
4. **Complessità 3D** → non investire finché RSVP e look non sono ok

---

## 6. Hero section

### Fase attuale: placeholder

- **Immagine fissa** stile briefing operazione (mura, countdown, CTA RSVP).
- Nessuno sviluppo trailer fino a RSVP + shell visiva allineata.

### Fase successiva: trailer Operation Ravenna

**Specifica completa (10 atti, timeline, tech mobile+web):** [`hero-references/HERO_STORYBOARD.md`](hero-references/HERO_STORYBOARD.md)

Riferimenti visivi in `docs/hero-references/`:

| File | Cosa ispira |
|------|-------------|
| `astra.mov` | Overlay testi, cinematic dark, video AI |
| `hero-one-piece.mov` | Capitoli, parallax, GSAP + Vite |
| `frames/` | Frame estratti (1 fps) per moodboard |

I `.mov` restano in locale (`.gitignore`); in repo: storyboard + frame JPG.

### Requisiti tecnici hero (futuro)

| Requisito | Dettaglio |
|-----------|-----------|
| Durata | **≈35–55 s**, non scroll lungo (vedi storyboard) |
| Orientamento | **Mobile-first**; verticale o crop-safe |
| 3D browser | **Rinunciabile** |
| Produzione | Video con AI / montaggio esterno; integrazione `<video>` + skip |
| Partecipazione | Opzionale leggera (tap, overlay); priorità fluidità mobile |
| Fallback | Immagine statica; `prefers-reduced-motion` |
| Audio | Muted autoplay; tap per audio se serve |

### Opzioni valutate

| ID | Approccio | Stato |
|----|-----------|--------|
| **A** | Video reel (MP4/WebM) + skip | **Target** |
| B | Video + layer interattivi React | Se serve più “partecipazione” |
| C | 2.5D / parallax codice | Piano B se video non basta |
| D | WebGL scroll-scrub attuale | **In pausa** |

### Narrazione (sintesi)

10 atti: vialetto → città → ODM tetti → squadra → mura → giganti → corridoio / piedi → risalita gigante → **couple strike** sposi → countdown. Dettaglio in [`HERO_STORYBOARD.md`](hero-references/HERO_STORYBOARD.md).

---

## 7. Information architecture

```
/                          Home
├── Hero (placeholder → trailer)   ← skippable
├── Mission / storia               ← briefing + matrimonio
├── Cerimonia
├── RSVP CTA
├── Regalo / IBAN
├── FAQ
└── Contatti

/auth/register, /auth/login
/rsvp                       ← party, menu, fazione auto
/travel
/album
/profile
/admin                      ← stats, fazioni, export spille
```

Flusso: **QR → home → (hero o skip) → registrati → RSVP → resto**.

---

## 8. Roadmap

| Sprint | Obiettivo |
|--------|-----------|
| **0** | Placeholder hero + direzione visiva AoT-matrimonio |
| **1** | RSVP party, 2 select menu, fazione auto-bilanciata, deadline 6/05/2027 |
| **2** | Email conferma + magic link modifica |
| **3** | Register → RSVP fluido; login allineato |
| **4** | Album, Travel, Admin + export spille |
| **5** | Storyboard hero dai video ref → produzione reel → integrazione mobile |
| **6** | Band, QR bigliettino, polish |

**Regola:** il sito **funziona** prima di essere **spettacolare**. Hero 3D congelato fino a sprint 5.

---

## 9. Criteri di successo (launch)

- [ ] Ospite da QR completa RSVP famiglia in **< 3 min** su mobile
- [ ] Hero skippabile; nessuno schermo nero su iPhone/Android testati
- [ ] Modifica RSVP fino al **6 maggio 2027**; blocco dopo
- [ ] Admin vede conteggi per fazione e lista per spille
- [ ] Upload foto con S3 configurato
- [ ] pytest + vitest verdi; i18n su stringhe nuove

---

## 10. Rischi e mitigazioni

| Rischio | Mitigazione |
|---------|-------------|
| Video pesante su 4G | Durata corta; compressione; poster statico |
| Autoplay iOS | Muted, playsinline, skip immediato |
| Sbilanciamento fazioni | Algoritmo least-count; monitor admin |
| Email in spam | SPF/DKIM; provider dedicato |
| Nomi fazione non definiti | ID stabili in codice; copy TBD in i18n |

---

## 11. Fazioni — naming (da chiudere con la coppia)

Tre reggimenti **come in AoT**, ma **nomi display propri** Operation Ravenna (evita merchandising canon puro; rende le spille “vostre”).

| ID codice | Ispirazione | Esempi nome (non definitivi) |
|-----------|-------------|------------------------------|
| `scout_regiment` | Corpo di ricerca · verde | Compagnia del Volo, Avanguardia Ravenna |
| `garrison` | Guarnigione · mura | Guardia di Lido, Mura del Delta |
| `military_police` | Gendarmeria · blu | Ordine del Cerimoniale, Vigilanza d’onore |

**Prossimo passo:** 30 minuti per scegliere i tre nomi definitivi in italiano + traduzioni en/fr/de.

---

## 12. Documenti correlati

| File | Uso |
|------|-----|
| [`PRODUCT_DECISIONS.md`](PRODUCT_DECISIONS.md) | RSVP, menu, fazioni, auth, date |
| [`README.md`](../README.md) | Setup dev |
| [`docs/hero-references/HERO_STORYBOARD.md`](hero-references/HERO_STORYBOARD.md) | Storyboard hero (10 atti, tech, timeline) |
| `docs/hero-references/frames/` | Frame riferimento Astra / One Piece |
| `.cursor/skills/aot-premium-design/` | Token UI (da adattare verso AoT-matrimonio) |

---

## 13. Decisioni riassuntive

| Domanda | Risposta |
|---------|----------|
| Rifare tutto da capo? | **No** |
| Stack | **Vite + FastAPI + Postgres + S3** (+ email transazionale) |
| BaaS? | **No** |
| Hero ora | **Immagine fissa** |
| Hero dopo | **Video reel** ODM, mobile-first; 3D non obbligatorio |
| Look sito | **Mix briefing militare + matrimonio elegante AoT** |
| Fazioni | **3**, auto-bilanciate, 1 spilla per partecipante |
| Deadline RSVP | **6 maggio 2027** (25 giorni prima) |
| Da dove partire | Sprint 0–1 su `feature/rsvp-party` |
