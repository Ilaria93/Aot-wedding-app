# Operation Ravenna — Specifica di rendering hero

Documento operativo: **come** deve essere resa la sequenza hero (movimento, camera, testi, tecnica).  
Narrazione e riferimenti: [`HERO_STORYBOARD.md`](HERO_STORYBOARD.md) · prodotto: [`../PRODUCT_DECISIONS.md`](../PRODUCT_DECISIONS.md).

Ultimo aggiornamento: 2026-06-30

---

## 1. Cosa stiamo producendo

Un **trailer fullscreen ~45 s** in cui l’ospite è un soldato in operazione a **Ravenna**: corsa → ODM in città → mura → giganti → risalita → **Ilaria & Davide** in couple strike → **countdown** al matrimonio.

| Deliverable | Formato |
|-------------|---------|
| Video hero mobile | `hero-mobile.mp4` · 720×1280 · ~4–6 MB · 24 fps |
| Video hero desktop (opz.) | `hero-desktop.mp4` · 1080×1920 o 16:9 crop |
| Poster / fallback | `hero-poster.webp` |
| Testi titolo / data | **Overlay React** (i18n), non nel video |
| Skip + CTA | UI React sopra il player |

**Non** è un videogioco interattivo né scroll WebGL lungo: è **cinema breve + sito**.

---

## 2. Regole di rendering globali

### 2.1 Linguaggio camera (da frame `frames/pxl-*`)

| Regola | Dettaglio |
|--------|-----------|
| **POV soldato** | Prima persona o chase **dietro** al personaggio (spalle, gas ODM visibile) |
| **Velocità** | Motion blur accettato; tagli **1–3 s** per micro-beat |
| **Scala** | Mura e giganti compaiono **in lontananza** prima del primo piano |
| **Ritmo** | Alternare **wide** (squadra, città) e **chase** (POV stretto) |
| **Rotazione** | Una sola piroetta marcata (atto 9); afterimage / scie corpo ammesse |
| **Setting** | Ravenna / Lido Adriano stylized — **non** Trost letterale |

### 2.2 Stile visivo (da `frames/astra` + `frames/hero-one-piece`)

| Elemento | Come renderlo |
|----------|----------------|
| **Atmosfera** | Dark cinematic, contrasto alto, cielo o fumo drammatico |
| **Testi** | Overlay **Astra**: kicker piccolo + titolo grande (Cinzel / display) |
| **Capitoli** | Ogni atto può avere un “chapter card” 0,5–1 s (stile One Piece reel) |
| **Colori** | Charcoal, verde Survey Corps, oro sobrio, cielo saturo negli atti aerei |

### 2.3 Cosa non fare

- Copiare frame, personaggi o nomi canon AoT
- Bruciare testi o date nel video (servono 4 lingue)
- Clip > 8 s senza cambio inquadratura
- 3D realtime nel browser come unica soluzione mobile
- Audio autoplay con musica forte (muted di default)

---

## 3. Sequenza per atti — scheda di rendering

Durata target totale: **~48 s** (comprimibile a **~38 s**).  
Timestamp = inizio approssimativo nel master montato.

**Legenda frame ref.:** `pxl-rec-3/NNNNN` → `t ≈ (N−1) × 0,1 s` (estrazione @ 100 ms).  
Apri `docs/hero-references/frames/` per confronto visivo.

---

### Atto 1 — Corsa sul vialetto  
**0:00 – 0:05** (~5 s)

| Campo | Specifica |
|-------|-----------|
| **Movimento** | Corsa **a terra**, camera bassa, avanzamento verso la città; leggero handheld |
| **Inquadratura** | POV petto / occhi; vialetto, vegetazione, periferia |
| **Emozione** | Partenza operazione, fiato, urgenza |
| **Overlay** | `OPERATION RAVENNA` (kicker) + sottotitolo missione |
| **Ref. movimento** | *Da produrre* — non presente nei MP4 AoT (episodio parte già in volo) |
| **Produzione** | 1 clip AI 5 s · terreno · nessun ODM ancora |

---

### Atto 2 — Arrivo in città  
**0:05 – 0:10** (~5 s)

| Campo | Specifica |
|-------|-----------|
| **Movimento** | La città si apre; passaggio da periferia a **tetti e torri** ravennati |
| **Inquadratura** | Wide che stringe → medium sulla skyline urbana |
| **Overlay** | `RAVENNA` / `SETTORE URBANO` |
| **Ref. frame** | `pxl-rec-3/00100`–`00120` (vista densa case, torri) |
| **Produzione** | 1 clip · transizione dolce verso atto 3 |

---

### Atto 3 — Volo tra le case → tetti  
**0:10 – 0:18** (~8 s)

| Campo | Specifica |
|-------|-----------|
| **Movimento** | **Primo aggancio ODM**; volo tra palazzi; atterraggio su **tetto inclinato** |
| **Camera** | Chase dietro + 1 taglio laterale obliquo (striscia velocità) |
| **Dettagli** | Tegole in primo piano; fumo leggero; gas ODM bianco |
| **Overlay** | `ODM ATTIVO` (breve, 1 s) |
| **Ref. frame** | `pxl-rec-3/00140`–`00160` (corsa tetto); `pxl-rec-3/00080`–`00100` (volo obliquo); `pxl-video/00200`+ (chase) |
| **Produzione** | 2–3 clip concatenate · cuore dell’immersione |

---

### Atto 4 — Scambi di volo / squadra  
**0:18 – 0:23** (~5 s)

| Campo | Specifica |
|-------|-----------|
| **Movimento** | Altri soldati **sfrecciano** incrociando traiettoria; **cambio direzione** brusco |
| **Inquadratura** | Wide formazione + flash 1 s su volti/lame in volo |
| **Overlay** | `SQUADRA` (flash) — opzionale dialogo muto |
| **Ref. frame** | `pxl-1830/00020`–`00040` (squadra cielo); `pxl-rec-3/00010`–`00030`; `pxl-rec-3/00280`–`00300` (primi piani in volo) |
| **Produzione** | Max **3 tagli** da 1–2 s · non allungare |

---

### Atto 5 — Le mura  
**0:23 – 0:28** (~5 s)

| Campo | Specifica |
|-------|-----------|
| **Movimento** | Volo verso il **parapetto**; rallentamento; mani sul bordo |
| **Inquadratura** | Mura enormi che **chiudono l’orizzonte** dietro la città |
| **Overlay** | `LE MURA` |
| **Ref. frame** | `pxl-rec-3/00180`–`00220` (mura sullo sfondo durante volo); `pxl-rec-3/00400` (fly-through città con wall) |
| **Produzione** | 1–2 clip · enfatizzare **scala** |

---

### Atto 6 — Oltre le mura / giganti  
**0:28 – 0:33** (~5 s)

| Campo | Specifica |
|-------|-----------|
| **Movimento** | Sguardo **giù** oltre il parapetto; prima visione **giganti** nella pianura / tra alberi |
| **Inquadratura** | POV testa che sporge; reveal verticale |
| **Overlay** | `OLTRE LE MURA` |
| **Ref. frame** | `pxl-rec-3/00240`–`00260` (giganti tra tetti, fumo) |
| **Produzione** | 1 clip reveal · hold 1 s sullo shock visivo |

---

### Atto 7 — Corridoio alberi e giganti  
**0:33 – 0:40** (~7 s)

| Campo | Specifica |
|-------|-----------|
| **Movimento** | Lancio ODM **tra tronchi e corpi**; stretto corridoio di movimento; velocità alta |
| **Camera** | Passaggi ravvicinati; profondità con ostacoli sx/dx |
| **Overlay** | testo minimo o nessuno (tensione pura) |
| **Ref. frame** | `pxl-video/00300`–`00350`; `pxl-video/00660` (passaggio vicino gigante) |
| **Produzione** | 2 clip · montaggio rapido |

---

### Atto 8 — Tra i piedi / quasi presi  
**0:40 – 0:44** (~4 s)

| Campo | Specifica |
|-------|-----------|
| **Movimento** | Passaggio **sotto** / tra **gambe** del gigante; mani che **afferrano**; schivata |
| **Inquadratura** | Camera quasi a terra poi risalita violenta |
| **Overlay** | `EVITA` o nessuno (1 parola max) |
| **Ref. frame** | `pxl-video/00600`–`00700`; adattare da passaggio spalla/gamba |
| **Produzione** | 1 clip intensa · **comprimibile** se serve tagliare durata |

---

### Atto 9 — Piroetta / risalita sul gigante  
**0:44 – 0:50** (~6 s)

| Campo | Specifica |
|-------|-----------|
| **Movimento** | Salto con **piroetta**; risalita lungo il corpo del gigante; **camera ruota** con il personaggio |
| **Effetto** | Afterimage / scie del corpo (1–2 fantasmi) |
| **Overlay** | nessuno o kicker minimo |
| **Ref. frame** | `pxl-1830/00025`–`00035` (rotazione con scie) |
| **Produzione** | 1 clip dedicata · unico beat con rotazione 3D marcata |

---

### Atto 10 — Couple strike + countdown  
**0:50 – 0:58** (~8 s)

| Campo | Specifica |
|-------|-----------|
| **Movimento** | Vedi **shot list** §4 — sequenza **originale**, non nei ref. AoT |
| **Overlay** | Countdown + data + CTA dopo il flash |
| **Produzione** | Clip separata · massima cura su inquadratura sposi |

---

## 4. Shot list — Couple strike (atto 10)

Sequenza **obbligatoria** per il payoff matrimonio.

| Shot | Durata | Camera | Azione | Note |
|------|--------|--------|--------|------|
| **10.1** | 1,5 s | POV sopra testa gigante | Superiamo la cresta cranica | Silenzio visivo |
| **10.2** | 1,0 s | Steadicam frontale basso | **Ilaria** entra da **sinistra**, **Davide** da **destra**, **solo di schiena** | Simmetrici, ODM / lame pronte |
| **10.3** | 1,0 s | Stesso asse | **Piroetta sincronizzata** verso l’interno | |
| **10.4** | 1,0 s | Frontale medium | Si **girano** verso camera; lame incrociate **verso lo spettatore** | Non mostrare volti fino a questo frame |
| **10.5** | 0,5 s | — | **Flash** bianco / lens flare | Transizione |
| **10.6** | 3,0 s | Hold o slow push | Overlay: **31 maggio 2027 · 16:30** · Lido Adriano · CTA | Handoff alla landing |

**Vestiti / look sposi (TBD):** uniforme stylized Operation Ravenna o abiti cerimonia + lame simboliche.

---

## 5. Overlay testi (layer React)

Stile **Astra**: titoli grandi, kicker `obw-meta`, fade in/out sui beat.

### 5.1 Sync con il video

Array `heroScenes` (esempio):

```ts
type HeroSceneOverlay = {
  at: number;      // secondi da inizio video
  duration: number;
  i18nKey: string; // es. hero.overlay.act1
};
```

| `at` (s) | `i18nKey` (bozza) | Stile |
|----------|-------------------|--------|
| 0,0 | `hero.overlay.operation` | Kicker + titolo |
| 5,0 | `hero.overlay.ravenna` | Titolo |
| 10,0 | `hero.overlay.odm` | Kicker corto |
| 18,0 | `hero.overlay.squad` | Flash 0,8 s |
| 23,0 | `hero.overlay.walls` | Titolo |
| 28,0 | `hero.overlay.beyond` | Titolo |
| 40,0 | `hero.overlay.dodge` | 1 parola (opz.) |
| 52,0 | `hero.overlay.countdown` | Data + luogo |

Testi in **4 lingue**; mai nel file video.

### 5.2 UI fissa

| Elemento | Posizione | Comportamento |
|----------|-----------|---------------|
| **Salta** | Alto a destra, safe area | Sempre visibile; salta a landing / CTA |
| **CTA** | Basso centro dopo atto 10 | `Conferma presenza` → `/rsvp` |
| **Audio** | Icona opzionale | Tap per unmute |

---

## 6. Montaggio master

### 6.1 Struttura file

```
public/hero/
  hero-mobile.mp4      # master verticale
  hero-desktop.mp4     # opzionale
  hero-poster.webp
```

### 6.2 Pipeline clip

1. Generare **1 clip per atto** (o per shot negli atti 3, 4, 7, 10)
2. Review su frame ref. in `frames/pxl-*`
3. Montaggio (DaVinci / CapCut / ecc.) con transizioni **cut** o **flash** breve
4. Export mobile: H.264 · 720×1280 · 24 fps · 600–900 kbps · **no audio** o traccia muta
5. Integrazione sito + test iPhone / Android

### 6.3 Durata per versione

| Versione | Atti | Durata |
|----------|------|--------|
| **Completa** | 1–10 | ~48 s |
| **Corta** | 1–3, 5–6, 9–10 (taglia 4, 7–8) | ~35 s |

---

## 7. Integrazione web (runtime)

```
HeroSection
├── hero-poster.webp          (LCP immediato)
├── <video playsInline muted>
├── HeroOverlayLayer          (testi sync a currentTime)
├── HeroSkipButton
└── HeroCta                   (visibile dopo ato 10 o su skip)
```

| Contesto | Comportamento |
|----------|---------------|
| Mobile | Autoplay muted; `hero-mobile.mp4`; no parallax |
| Desktop | Stesso video o `hero-desktop`; parallax 2–4 PNG opzionale |
| `prefers-reduced-motion` | Solo poster + countdown statico |
| Connessione lenta | Poster + tap “Avvia operazione” |

---

## 8. Checklist accettazione

- [ ] Ogni atto 1–9 ha movimento riconoscibile vs frame ref.
- [ ] Atto 10 rispetta shot list (schiena → giro → lame → flash)
- [ ] Durata totale ≤ 55 s
- [ ] Video mobile ≤ 6 MB
- [ ] Overlay leggibili su 375 px
- [ ] Skip funziona entro 1 tap
- [ ] Countdown = data in `weddingEvent.ts`
- [ ] Nessun asset canon AoT / Netflix

---

## 9. Documenti correlati

| File | Contenuto |
|------|-----------|
| [`HERO_STORYBOARD.md`](HERO_STORYBOARD.md) | Storyboard, architettura, frame index |
| [`extract-frames.sh`](extract-frames.sh) | Rigenera `frames/` |
| [`../PROJECT_BRIEF.md`](../PROJECT_BRIEF.md) | Visione e stack |
| `frames/pxl-rec-3/` | Ref. principale movimento ODM |

---

## 10. Prossimo passo produzione

1. Sfogliare `frames/pxl-rec-3/` e `pxl-1830/` per validare i beat
2. Scrivere **prompt AI** per atto 1 (vialetto) e atto 10 (sposi) — unici senza ref. diretto
3. Generare clip atto 3 → test montaggio 15 s
4. Solo dopo RSVP: integrazione player nel sito
