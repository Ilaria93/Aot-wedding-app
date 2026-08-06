# Operation Ravenna — Hero cinematico (storyboard)

Specifica creativa e tecnica per l’intro del sito.  
Contesto prodotto: [`../PROJECT_BRIEF.md`](../PROJECT_BRIEF.md) · [`../PRODUCT_DECISIONS.md`](../PRODUCT_DECISIONS.md).

**Render spec (come produrre ogni atto):** [`HERO_RENDER_SPEC.md`](HERO_RENDER_SPEC.md)

Ultimo aggiornamento: 2026-07-20

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

### Mura — dettaglio (atti 5–6, dettato dalla coppia 2026-07-20)

| Momento | Inquadratura | Contenuto |
|---------|--------------|-----------|
| Arrivo | POV in salita sulle mura | Ci si tira su sul cammino di ronda |
| +0–1 s | Da dietro, destra | Davide sopraggiunge da dietro, sorpassa a destra, si ferma |
| +1–3 s | Camera ferma | Pausa: si guarda il panorama oltre le mura (~2 s, nessuna azione) |
| +3–4 s | POV | Ci si gira a destra e si corre per pochi passi lungo il cammino di ronda |
| +4–5 s | POV in caduta | Lancio oltre il bordo esterno delle mura, verso i giganti |

Questo dettaglio raffina gli atti 5–6 esistenti (arrivo mura → oltre le mura) con la coreografia esatta indicata dalla coppia, da usare per i prompt video §12.

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
- [x] Tool AI preferito per le clip → **Leonardo AI** (immagine di partenza) + **Hailuo 2.3 / MiniMax** (image-to-video) — vedi §12
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

---

## 12. Prompt generativi (Leonardo AI + Hailuo 2.3)

Tool scelto (2026-07-20): **Leonardo AI** genera il frame di partenza (immagine), **Hailuo 2.3** (MiniMax, disponibile dentro Leonardo) lo anima in clip video (image-to-video). Generare prima l'immagine e poi animarla mantiene i personaggi coerenti tra un atto e l'altro, invece di rigenerarli da zero ad ogni clip.

**Attenzione copyright:** i prompt descrivono equipaggiamento a funi/cavi generico, città mediterranea, giganti umanoidi, stile anime — **mai** nominare "Attack on Titan", personaggi o loghi dell'anime originale. Il linguaggio camera si ispira alla serie ma il contenuto generato deve restare originale.

**Impostazioni Leonardo consigliate:** formato **9:16 verticale** (mobile-first), modello anime/cel-shaded (es. *AlbedoBase XL*, *Anime Pastel Dream*), prompt negativo `text, watermark, logo, extra limbs, blurry face, low quality, western comic style`.

### Stile condiviso (da includere in ogni prompt immagine)

```
Cinematic anime-style illustration, sakuga-quality dynamic anime action art,
warm golden hour light, dust and haze in the air, muted terracotta-and-sandstone
Mediterranean coastal city, thin steel cables trailing from waist-mounted
mechanical gear, high contrast lighting, dramatic wide-angle lens, no text,
no logo, no watermark --ar 9:16
```

Ilaria e Davide: descritti in modo generico (capelli scuri, corporatura atletica, giacca tattica color sabbia con cinghie e rocchetto per i cavi) — **i dettagli fisici vanno personalizzati** per assomigliare davvero a voi due.

### Prompt immagine (Leonardo) — uno per atto

| # | Atto | Prompt |
|---|------|--------|
| 1 | Corsa sul viottolo | `First-person POV running fast along a narrow dirt path at golden hour, toward a distant Mediterranean coastal city skyline silhouetted against an orange sky, dust kicked up from the ground, low camera angle showing motion, [stile condiviso]` |
| 2 | Arrivo in città | `First-person POV sprinting into a dense Mediterranean city at dusk, narrow stone streets opening into a wide piazza, warm terracotta rooftops on both sides, dynamic low-angle motion shot, [stile condiviso]` |
| 3 | Lancio ODM verso i tetti | `First-person POV, two thin steel cables from mechanical hip-mounted gear firing upward into rooftops above, sudden upward launch, city rooftops falling away below, wind-blown motion lines, dramatic upward wide-angle shot, [stile condiviso]` |
| 4 | Incrocio in volo | `First-person POV flying above terracotta rooftops, a young woman with long dark hair tied back, tan tactical jacket with belt straps and cable-reel gear, seen from behind, overtaking fast on the left with a motion trail, motion blur, [stile condiviso]` |
| 5 | Corsa tra i tetti verso le mura | `First-person POV swinging between rooftops on steel cables, skimming just above red clay tiles and chimneys, massive ancient stone walls looming straight ahead on the horizon, dynamic low sweeping camera angle, [stile condiviso]` |
| 6 | Le mura: arrivo e pausa panorama | `First-person POV standing on top of a massive ancient stone wall, a young man with short dark hair, athletic build, tan tactical jacket with cable-reel gear, sweeping past from behind on the right and coming to a stop beside camera, both looking out over a wide panoramic coastal landscape beyond the wall, calm cinematic wide shot, [stile condiviso]` |
| 7 | Corsa sulle mura e lancio | `First-person POV sprinting along the top of a massive stone wall then leaping off the outer edge into open air, camera pitching downward mid-fall, vast landscape opening up below, motion blur, [stile condiviso]` |
| 8 | Tra i giganti | `First-person POV flying fast at ground level between the legs of colossal humanoid giants, extreme scale contrast, low camera angle emphasizing height of the giants, two other airborne figures overtaking nearby, dust and haze, motion blur, [stile condiviso]` |
| 9 | Avvitamento sul gigante | `First-person POV spiraling upward around the leg and torso of a colossal giant in one continuous corkscrew motion, camera rotating with the spin, reaching the neck and launching straight up into the sky, dramatic motion blur, [stile condiviso]` |
| 10 | Couple strike + countdown | `First-person POV airborne high above a colossal giant's head, a young woman with long dark hair on the left and a young man with short dark hair on the right, both tan tactical jackets with cable-reel gear, streaking past at high speed and turning mid-air to face camera in perfect sync, blades raised toward the viewer in a crossed strike pose, dramatic backlit golden sky, epic cinematic anime art, high contrast, [stile condiviso]` |

### Prompt motion (Hailuo 2.3, image-to-video) — uno per atto

Più corti di proposito: Hailuo riceve già l'immagine come primo fotogramma, il prompt deve descrivere solo **cosa si muove**, non ridescrivere la scena.

| # | Atto | Motion prompt |
|---|------|----------------|
| 1 | Corsa sul viottolo | `Camera tracks forward at running speed, slight vertical bounce, dust particles kicked up, steady forward momentum toward the horizon.` |
| 2 | Arrivo in città | `Camera continues forward tracking motion, streets rush past on both sides, slight speed lines, smooth forward push into the piazza.` |
| 3 | Lancio ODM verso i tetti | `Sudden sharp upward camera movement as cables pull taut, whip-fast vertical launch, city drops away below, motion blur on the edges.` |
| 4 | Incrocio in volo | `Camera holds steady flying forward, second figure sweeps past from left to right at high speed leaving a motion trail, brief camera flinch to follow.` |
| 5 | Corsa tra i tetti verso le mura | `Camera swings and glides forward in an arc motion between rooftops, banking slightly left and right, walls growing larger straight ahead.` |
| 6 | Le mura: arrivo e pausa panorama | `Camera settles from motion to stillness as figure lands, second figure sweeps in from behind on the right and stops, camera holds still on the wide view for a beat.` |
| 7 | Corsa sulle mura e lancio | `Camera pushes forward rapidly for a few steps then tips sharply downward and forward as the leap begins, falling motion, wind rushing.` |
| 8 | Tra i giganti | `Camera flies fast and low, weaving side to side between giant legs, motion blur, two figures overtake from behind.` |
| 9 | Avvitamento sul gigante | `Camera spirals continuously upward in a tight corkscrew rotation following the giant's body, then straightens and launches vertically upward.` |
| 10 | Couple strike + countdown | `Two figures streak past camera from left and right at high speed, both rotate to face camera in sync, arms swing weapons toward the lens, hard flash to white.` |

### Flusso di lavoro consigliato

1. Genera l'immagine dell'atto 1 in Leonardo con il prompt immagine.
2. Passa quell'immagine a Hailuo 2.3 (image-to-video) con il motion prompt corrispondente.
3. Ripeti per gli atti 2–10, riusando la stessa descrizione fisica di Ilaria/Davide per coerenza tra i frame.
4. Se un atto risulta troppo statico con Hailuo (probabile per gli atti 3, 9, 10 — molto dinamici), prova lo stesso frame di partenza su Runway Gen-3, Kling o Luma Dream Machine prima di scartarlo.
5. Monta le clip risultanti in ordine (Fase 2 — vedi §9).
