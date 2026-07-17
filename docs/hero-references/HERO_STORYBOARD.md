# Operation Ravenna — Hero cinematico (storyboard)

Specifica creativa e tecnica per l’intro del sito.  
Contesto prodotto: [`../PROJECT_BRIEF.md`](../PROJECT_BRIEF.md) · [`../PRODUCT_DECISIONS.md`](../PRODUCT_DECISIONS.md).

**Render spec (come produrre ogni atto):** [`HERO_RENDER_SPEC.md`](HERO_RENDER_SPEC.md)

Ultimo aggiornamento: 2026-06-30

---

## 1. Obiettivo

Far vivere all’ospite **40–55 secondi** di operazione in prima persona (ODM, mura, giganti), chiudere con **Ilaria & Davide** in couple strike e **countdown** al matrimonio, poi passare al sito pratico (RSVP).

| Vincolo | Valore |
|---------|--------|
| Priorità device | **Mobile** (QR, 90%+ traffico) |
| Durata target | **35–55 s** (non scroll lungo) |
| Skip | Sempre visibile |
| Fallback | Immagine statica + `prefers-reduced-motion` |
| Lingue overlay | `it`, `en`, `fr`, `de` (testi **non** bruciati nel video) |

**Fase attuale:** placeholder immagine briefing — **nessuna implementazione** di questo storyboard finché RSVP e look sito non sono pronti.

---

## 2. Riferimenti visivi

Video e frame in questa cartella:

| File | Cosa ispira | Frame estratti |
|------|-------------|----------------|
| `astra.mov` | Siti **cinematic dark**, testi in **sovraimpressione**, atmosfera trailer / gaming premium, produzione **video AI** | `frames/astra/frame_*.jpg` |
| `hero-one-piece.mov` | **Capitoli** a schermo intero, **parallax** tra beat, tipografia serif, CTA; stack **Vite + React + GSAP** | `frames/hero-one-piece/frame_*.jpg` |
| `PXL 2026-06-29 18-30-02.mp4` | **Movimento 3D ODM** (ripresa telefono) — crediti, volo squadra, inseguimento | `frames/pxl-1830/frame_*.jpg` |
| `PXL 2026-06-29 Video.mp4` | Stesso episodio, sequenze più lunghe — inseguimento, giganti, vapore | `frames/pxl-video/frame_*.jpg` |
| `Avviso scansione antivirus.mp4` | Stesso episodio (~46 s) — corsa tetti, mura, giganti in città, piroetta | `frames/pxl-rec-3/frame_*.jpg` |

**Fonte anime (riferimento movimento):** *Attack on Titan* S1 **E5** — *Prima battaglia: la difesa di Trost* (ODM tra tetti, mura sullo sfondo, giganti tra case). Non va riprodotto verbatim; serve come **linguaggio camera** per Operation Ravenna.

### Sintesi stile ibrido

```
Azione / immagine  →  video (o clip concatenate), stile immersivo reel
Testi / titoli     →  overlay React stile Astra (kicker, titoli grandi, countdown)
Profondità desktop →  parallax leggero su 2–4 layer (opzionale, enhancement)
```

I file video grezzi (`.mov`, `.mp4`) non vanno in git; restano frame JPG + questo documento (vedi `.gitignore`).

---

## 2b. Sequenze estratte — riprese telefono (movimento 3D)

Analisi frame-by-frame dai tre MP4 Pixel (~25 s, ~38 s, ~46 s). Tutti registrano lo **stesso episodio** da Netflix su laptop; il telefono riprende lo schermo — utile per capire **ritmo, inquadratura e tipo di movimento** da emulare (in video AI o montaggio), non per copiare l’anime.

### Linguaggio camera da replicare

| Tecnica | Cosa fa | Frame esempio |
|---------|---------|---------------|
| **Volo squadra** | Formazione a V, più soldati in parallelo, cielo azzurro | `pxl-1830/frame_000240.jpg`, `pxl-rec-3/frame_000030.jpg` |
| **Inseguimento POV** | Camera dietro al soldato, gas ODM, tetti sfocati in motion blur | `pxl-video/frame_000750.jpg`, `pxl-rec-3/frame_000600.jpg` |
| **Scatto / curva** | Inquadratura obliqua, striscia bianca di velocità | `pxl-rec-3/frame_000300.jpg` |
| **Corsa su tetto** | Piano inclinato, tegole in primo piano, mura all’orizzonte | `pxl-rec-3/frame_000450.jpg` |
| **Mura come scala** | Wall gigante sullo sfondo mentre si vola sulla città | `pxl-rec-3/frame_000600.jpg`, `frame_001200.jpg` |
| **Giganti in città** | Titan tra i tetti, fumo, tensione di scala | `pxl-rec-3/frame_000750.jpg` |
| **Passaggio ravvicinato** | Soldato sfreccia vicino a spalla/gamba del gigante | `pxl-video/frame_000660.jpg` |
| **Piroetta / rotazione** | Personaggio che ruota con **afterimage** (scie del corpo) | `pxl-1830/frame_000090.jpg` (≈3 s) |
| **Squadra in scambio** | Primi piani multipli, lame, dialogo in volo | `pxl-rec-3/frame_000900.jpg` |

### Mappatura → storyboard Operation Ravenna (10 atti)

| Atto nostro | Cosa mostrano le riprese | Clip / frame |
|-------------|--------------------------|--------------|
| 1 Corsa vialetto | Poco in questi MP4 (episodio già in volo); da produrre | — |
| 2 Arrivo città | Vista densa case + torri | `pxl-rec-3/frame_001200.jpg` |
| 3 Volo tra case → tetti | Inseguimento su tetti, motion blur | `pxl-rec-3/frame_000450.jpg`, `frame_000600.jpg` |
| 4 Squadra / scambi | Formazione + dialogo in volo | `pxl-1830/frame_000240.jpg`, `pxl-rec-3/frame_000030.jpg` |
| 5 Le mura | Mura che chiudono l’orizzonte | `pxl-rec-3/frame_000600.jpg` |
| 6 Oltre / giganti visibili | Titan tra edifici, fumo | `pxl-rec-3/frame_000750.jpg` |
| 7–8 Corridoio / piedi | Passaggio stretto vicino al gigante | `pxl-video/frame_000660.jpg` |
| 9 Piroetta sul gigante | Rotazione con scie (afterimage) | `pxl-1830/frame_000090.jpg` |
| 10 Couple strike | **Non presente** nell’anime — da creare ex novo | — |

### Note per produzione video

- **Velocità:** tagli medi **1–3 s** per beat; l’anime alterna wide (squadra) e chase (POV).
- **Motion blur:** accettabile e desiderabile — nasconde dettagli e alleggerisce percezione CGI.
- **Scala:** mura e giganti devono comparire **presto** nello sfondo per dare contesto.
- **Atto 10:** unico beat **originale** (Ilaria & Davide di schiena → giro → lame); non copiare frame AoT.

### Rigenerare i frame (estrazione completa)

Vedi **§11** — ogni fotogramma, non campionamento 1/s.

---

## 3. Narrazione — 10 atti

Sequenza epica concordata (prima persona, soldato Survey Corps a Ravenna).

| # | Atto | Descrizione visiva | Note regia |
|---|------|-------------------|------------|
| **1** | Corsa sul vialetto | Terra, corsa verso la città | Ingresso operazione; POV basso / corsa |
| **2** | Arrivo in città | Ravenna si apre | Transizione da periferia a urbano |
| **3** | Volo tra le case → tetti | Salto ODM, aggancio, atterraggio sui tetti | Cuore “ODM tra le vie” |
| **4** | Scambi di volo / squadra | Altri soldati sfrecciano; cambi di direzione | Flash brevi (1–2 s ciascuno), non prolungare |
| **5** | Le mura | Arrivo al parapetto / scalata | Tensione prima dello sguardo |
| **6** | Oltre le mura | Si guarda giù: i giganti | Revelazione scale |
| **7** | Corridoio alberi + giganti | Passaggio tra tronchi e corpi enormi | Profondità, velocità |
| **8** | Tra i piedi / quasi presi | Mani che si allungano, schivare / mangiare | Beat di tensione massima |
| **9** | Salto + piroetta sul gigante | Risalita lungo il corpo; camera ruota con il movimento | Unico beat con rotazione 3D marcata |
| **10** | Couple strike + countdown | Superata la testa del gigante: **sposi di schiena** da sx e dx → piroetta → si girano verso camera → **attacco incrociato lame** → flash → **countdown 31/05/2027 16:30** | Payoff matrimonio |

### Couple strike — dettaglio (atto 10)

| Momento | Inquadratura | Contenuto |
|---------|--------------|-----------|
| T−3 s | POV sopra la testa del gigante | Ilaria e Davide entrano **da destra e sinistra**, **sempre di schiena** |
| T−2 s | Stesso asse | Piroetta sincronizzata |
| T−1 s | Frontale | Si girano verso lo schermo; lame verso camera |
| T0 | Flash / hold | Attacco incrociato; transizione a countdown |
| T+1 s | Overlay | Data, luogo, CTA “Conferma presenza” |

Vestiti / armi: da definire con la coppia (uniforme cerimoniale vs ODM stylized).

---

## 4. Timeline indicativa (sync overlay)

Durata totale consigliata: **~48 s** (comprimibile a ~38 s tagliando atti 4 e 8).

| Tempo | Atto | Overlay (es. IT — chiavi i18n TBD) |
|-------|------|-------------------------------------|
| 0:00–0:05 | 1 Corsa vialetto | `OPERATION RAVENNA` |
| 0:05–0:10 | 2 Arrivo città | `SETTORE URBANO` / `RAVENNA` |
| 0:10–0:17 | 3 Volo → tetti | `ODM ATTIVO` |
| 0:17–0:21 | 4 Squadra | `SQUADRA` (flash) |
| 0:21–0:26 | 5 Mura | `LE MURA` |
| 0:26–0:30 | 6 Giganti | `OLTRE LE MURA` |
| 0:30–0:38 | 7–8 Corridoio / piedi | testi **corti** o nessun testo (tensione) |
| 0:38–0:45 | 9 Piroetta sul gigante | minimo testo |
| 0:45–0:52 | 10 Couple strike | silenzio visivo → countdown |
| 0:52+ | Handoff | data + CTA RSVP |

I timestamp sono **ancora da calibrare** sul montaggio finale.

---

## 5. Architettura tecnica (mobile + web)

Un solo hero, due modalità di fruizione.

```
┌────────────────────────────────────────────┐
│ Layer 4  UI fissa: Skip, audio, CTA        │
│ Layer 3  Overlay testi (React, i18n)       │
│ Layer 2  Parallax opzionale (desktop)    │
│ Layer 1  Video MP4/WebM fullscreen         │
└────────────────────────────────────────────┘
```

| Piattaforma | Driver progresso | Parallax |
|-------------|------------------|----------|
| **Mobile** | **Tempo** (autoplay muted, `playsinline`) | No (o minimissimo) |
| **Desktop** | Tempo (default) | Opzionale: scroll leggero che scrubba tra beat |

**Non** replicare lo scroll lungo a 9 viewport del WebGL attuale.

### Stack integrazione

| Pezzo | Tecnologia |
|-------|------------|
| Player | `<video>` + React |
| Overlay | Componenti React + token OBW / AoT |
| Sync testi | Timestamp JSON o array `scenes[]` (come `Hero.jsx` nel reel One Piece) |
| Animazione overlay | GSAP (già in progetto) o CSS |
| Parallax desktop | GSAP ScrollTrigger su layer PNG separati (enhancement) |

### Produzione asset

| Asset | Dove si produce | In repo |
|-------|-----------------|---------|
| Clip video atti 1–9 | Tool AI / montaggio esterno (Runway, Kling, ecc.) | `public/hero/` o CDN |
| Clip couple strike | Possibilmente clip dedicata (controllo sposi) | idem |
| Layer parallax | Export PNG da compositing | opzionale |
| Testi | i18n frontend | `frontend/src/i18n/` |

Il **3D WebGL** (`cinematic/`, `scenes/`) resta **riferimento** per camera path e timing, non obbligatorio in runtime su mobile.

---

## 6. Allineamento codice esistente

Il repo contiene già segmenti vicini a questa narrazione:

| Atto storyboard | Scene / segmento codice (circa) |
|-----------------|--------------------------------|
| 1 Corsa | `streetOpening`, `OPERATION_RAVENNA_GROUND_SPRINT_END` |
| 3 Tetti | `rooftops` |
| 5 Mura | `wallsApproach`, `wallLaunch` |
| 7–8 Corridoio giganti | `titanCorridor` |
| 10 Couple strike | `coupleStrike`, `countdownTransition` |

Path utili:

- `frontend/src/data/cameraPaths.ts`
- `frontend/src/constants/operationRavennaOpening.ts`
- `frontend/src/constants/cinematicSceneCaptions.ts`
- `frontend/src/scenes/sequences/coupleStrikeLogic.ts`

**Gap rispetto alla visione:** squadra visibile, passaggio tra i piedi/mani, piroetta 3D sul gigante, sposi sempre di schiena fino al giro, overlay stile Astra.

---

## 7. Opzioni tecniche (stato)

| ID | Approccio | Stato |
|----|-----------|--------|
| **A** | Video prerender + overlay + skip | **Target produzione** |
| B | Video + layer interattivi (tap) | Opzionale post-MVP |
| C | Parallax 2.5D senza video | Piano B |
| D | WebGL scroll-scrub attuale | **Congelato** |

---

## 8. Criteri di accettazione (hero)

- [ ] Durata ≤ 55 s su mobile; skip entro 1 tap
- [ ] Nessun blocco nero su iPhone e Android testati (device coppia)
- [ ] Overlay leggibili su 375px larghezza
- [ ] `prefers-reduced-motion` → poster + countdown, no autoplay
- [ ] Couple strike riconoscibile; countdown con data corretta (`weddingEvent.ts`)
- [ ] Handoff chiaro verso RSVP sotto l’hero
- [ ] 4 lingue su tutti gli overlay

---

## 9. Fasi di lavoro

| Fase | Quando | Output |
|------|--------|--------|
| **0** | Dopo RSVP base | Placeholder immagine briefing |
| **1** | Pre-produzione | Prompt per clip AI (1 prompt per atto); moodboard da frame |
| **2** | Produzione | Montaggio master `.mp4` / `.webm` |
| **3** | Integrazione | Player + `scenes[]` timestamp + overlay i18n |
| **4** | QA | Test device reali; compressione 4G |
| **5** | Polish | Parallax desktop; audio opzionale |

---

## 10. Da definire (TBD)

- [ ] Vestiti e look sposi nell’atto 10
- [ ] Durata esatta atti 4 e 8 (taglio montaggio)
- [ ] Tool AI preferito per le clip
- [ ] Verticale 9:16 vs 16:9 crop-safe (probabilmente **entrambi**: verticale mobile, crop desktop)
- [ ] Chiavi i18n definitive per ogni overlay
- [ ] Musica / SFX (opzionale; rispettare autoplay muted)

---

## 11. Frame di riferimento (campionamento bilanciato)

**Problema:** estrarre *tutti* i fotogrammi (~8 000, ~1 GB) produce troppe immagini quasi identiche (pause Netflix, UI ferma).  
**Soluzione:** due strategie complementari — unità compresa tra secondi e millisecondi.

| Tipo video | Metodo | Unità | Frame tipici |
|------------|--------|-------|--------------|
| Screen recording (`.mov`) | **5 fps** | **1 ogni 200 ms** | ~90–115 |
| Ripresa telefono AoT (`.mp4`) | **10 fps** | **1 ogni 100 ms** | ~250–460 |

**Totale attuale:** **1 289 frame · ~153 MB** (vs 8 229 full · ~959 MB).

Naming: `frames/<cartella>/00001.jpg` … (ordine cronologico).

### Timestamp approssimativo

- **`.mov` @ 5 fps:** `t ≈ (N − 1) × 0,2 s` → `00010.jpg` ≈ 1,8 s  
- **`.mp4` @ 10 fps:** `t ≈ (N − 1) × 0,1 s` → `00010.jpg` ≈ 0,9 s

### Rigenerare

```bash
cd docs/hero-references
./extract-frames.sh
```

Parametri in testa allo script: `FPS_SCREEN=5` (200 ms), `FPS_ACTION=10` (100 ms).

`frames/` resta in `.gitignore`; in repo: `extract-frames.sh` + storyboard.
