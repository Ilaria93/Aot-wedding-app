# Particle letter text — design

## Contesto

`EnvelopeInvite.tsx` rivela le 6 righe della lettera (saluto personale,
headline, nomi sposi, data/luogo, orario cerimonia, intro) un carattere alla
volta, temporizzate da `buildTypeSchedule`. Il reveal carattere-per-carattere
è stato appena sistemato (vedi commit `2551300`): ogni `<span>` ha un
`animation-delay` fisso calcolato dallo schedule della riga, e una CSS
`animation` (non `transition`) fa la dissolvenza — nessuno stato React
guida il fade dopo il mount.

Il committente vuole sostituire quella dissolvenza con un effetto a
particelle (ispirato a un componente di riferimento salvato in
`docs/deferred/particle-text-effect.md`, mai integrato) su **tutte e 6 le
righe**, incluso il paragrafo lungo dell'intro (multi-riga, ~150 caratteri).

Vedi anche `docs/deferred/particle-text-effect.md` per lo snippet originale
(stack Next.js/Tailwind, non applicabile direttamente a questo progetto
Vite + SCSS).

## Perché non un porting 1:1 della demo

Lo snippet originale non copre casi che qui sono obbligatori:

- **Testo multi-riga**: la demo disegna una parola sola centrata via
  `fillText`. Il paragrafo intro deve andare a capo — serve una funzione di
  word-wrap (misura parole via `ctx.measureText`, spezza le righe) assente
  nello snippet.
- **Accessibilità**: la demo disegna solo su `<canvas>` — invisibile a
  screen reader, non selezionabile, non zoomabile via browser text-scaling.
  Il testo reale deve restare nel DOM.
- **Ciclo di parole**: la demo ruota tra 5 parole demo ogni 4s
  (`frameCountRef`/`wordIndexRef`). Qui ogni riga forma il proprio testo una
  sola volta e si ferma — tutta la logica di rotazione va rimossa.
- **Sfondo**: la demo assume sfondo nero con trail semitrasparente nero
  (`rgba(0,0,0,0.1)` per il motion-blur). La lettera ha sfondo pergamena
  chiaro — con il ciclo di parole rimosso, il trail non serve più: basta
  `clearRect` ad ogni frame.
- **Colore**: la demo usa colori random per parola. Qui il colore deve
  seguire la palette del sito, diverso per riga (charcoal-deep per la
  maggior parte, oro per l'orario cerimonia).
- **Interazione mouse** (right-click-and-hold per distruggere particelle):
  non richiesta, va rimossa.

## Architettura

**Un canvas per riga**, non un canvas unico per tutta la lettera. Ogni riga
ha font-family/size/color/allineamento diversi (label maiuscolo piccolo,
titolo display, corsivo editoriale, ecc.) e appare in un momento diverso —
un canvas per riga li isola naturalmente, invece di dover gestire 6 stili
tipografici in un solo canvas condiviso.

**Il canvas si sovrappone al testo reale, non lo sostituisce.** Il testo
vero (già temporizzato/animato dal fix precedente) resta nel DOM esattamente
come ora. Il canvas della riga si piazza sopra via `position: absolute`,
mostra la formazione a particelle, poi **fa fade-out una volta assestato**,
rivelando il testo reale già presente sotto — stesso identico contenuto,
zero duplicazione, zero rischio di disallineamento testo-canvas/testo-DOM.

```
<p className="envelope-invite__personal-greeting ...">
  <TypedText .../>              ← testo reale, invariato dal fix precedente
  <ParticleLine .../>           ← canvas assoluto sopra, sparisce a fine formazione
</p>
```

**Timing**: ogni `ParticleLine` riceve `startMs`/`endMs` dallo stesso
`buildTypeSchedule(letterLines)` già usato per `TypedText` — il ritmo
generale della lettera non cambia, cambia solo come ogni riga *appare*
visivamente durante la sua finestra.

**Solo una riga simula alla volta.** Le righe già assestate fermano il
proprio `requestAnimationFrame` e nascondono il canvas (il testo reale sotto
è già a piena opacità) — stesso concetto di `activeIndex` già esistente in
`EnvelopeInvite.tsx`. Questo limita il costo simultaneo a una sola
simulazione fisica per volta, anche se tecnicamente ogni riga *potrebbe*
sovrapporsi leggermente con la successiva (gap di 180ms tra righe nello
schedule attuale) — il canvas della riga precedente sarà comunque quasi
completamente assestato (durata target ~700-900ms, vedi sotto) prima che
la successiva parta.

## Componente: `ParticleLine`

`frontend/src/components/EnvelopeInvite/ParticleLine.tsx` +
`styles/ParticleLine.scss`.

```ts
type ParticleLineProps = {
  text: string;
  startMs: number;   // dallo stesso schedule di TypedText
  active: boolean;   // isOpen del genitore — non parte finché la lettera non è aperta
  onSettled?: () => void; // opzionale, per debug/telemetria — non strettamente necessario
};
```

Non riceve font/colore come prop: li **legge dal DOM** via
`getComputedStyle` dell'elemento padre (lo stesso `<p>`/`<h1>` che contiene
il testo reale) al momento del mount. Questo evita di duplicare in TS i
valori già definiti in `EnvelopeInvite.scss` (font-family, font-size,
color, line-height) — se lo stile CSS di una riga cambia, il canvas la
segue automaticamente, nessun valore hardcoded da tenere sincronizzato.

### Ciclo di vita

1. **Mount**: canvas assoluto, stessa dimensione del contenitore padre
   (`ResizeObserver` sul padre, DPR-aware — stesso pattern di
   `HeroParticleField.tsx`). Nascosto (`opacity: 0`) finché `active` è
   false. Quando `active` passa a `true`, un effetto cattura
   `performance.now()` come proprio "istante zero" — stesso pattern già
   usato in `useTypewriterLines` per `elapsed` — e la formazione parte
   quando l'orologio interno raggiunge `startMs`.
2. **Al proprio `startMs`**: `clearRect`, genera le posizioni-bersaglio
   rasterizzando il testo su un canvas offscreen (con word-wrap se il testo
   supera la larghezza del contenitore), crea N particelle disperse
   casualmente attorno al centro, le anima verso i bersagli (stessa
   fisica *steering* della demo: `move()`/`draw()` di `Particle`, portata
   senza modifiche concettuali).
3. **Nessun trail**: ogni frame fa `clearRect` pieno, non un rettangolo
   semitrasparente — non c'è bisogno del motion-blur perché non c'è
   dissolvenza tra parole diverse, solo comparsa una tantum.
4. **Assestamento**: quando la velocità media delle particelle scende sotto
   una soglia (o dopo un tempo massimo fisso, es. 900ms, whichever prima),
   il canvas fa fade-out (CSS `transition: opacity`) e si ferma il loop
   (`cancelAnimationFrame`) — il testo reale sotto (già a `opacity: 1` per
   il fix precedente, la cui `animation-delay` combacia con questo stesso
   `startMs`) resta visibile.
5. **`prefers-reduced-motion: reduce`**: il canvas non si monta nemmeno —
   stesso pattern già in uso in `HeroParticleField.tsx`. Il testo reale
   (gestito da `TypedText`, che già rispetta reduced-motion per conto suo)
   è l'unica cosa che appare.
6. **Cleanup**: `cancelAnimationFrame` + `ResizeObserver.disconnect()` allo
   smontaggio, stesso pattern di `HeroParticleField.tsx`.

### Word-wrap (nuovo, non nella demo originale)

Prima di generare le particelle-bersaglio: misura ogni parola con
`ctx.measureText`, accumula parole su una riga finché non supera la
larghezza del contenitore (stessa larghezza del canvas), va a capo,
ripete. Usa il `line-height` letto da `getComputedStyle` per spaziare le
righe rasterizzate. Necessario solo per la riga "intro" (le altre 5 righe
sono abbastanza corte da stare su una riga, ma la funzione si applica a
tutte per uniformità — non serve un ramo speciale "riga corta vs lunga").

### Colore e conteggio particelle

- Colore: `getComputedStyle(parentEl).color` (già risolve eventuali
  `color-mix()` in un valore concreto) — niente randomizzazione.
- Conteggio particelle: derivato dall'area del testo rasterizzato (stesso
  approccio di `HeroParticleField.seed()`, che scala il conteggio petali
  sull'area del contenitore), con un tetto massimo (es. 400) per tenere
  la simulazione leggera su mobile anche per il paragrafo intro più lungo.

## Modifiche a `EnvelopeInvite.tsx`

Le 6 chiamate a `<TypedText text=... startMs=... endMs=... />` restano
identiche (il testo reale e il suo fade continuano a esistere, invariati),
e si aggiunge accanto, per ciascuna, `<ParticleLine text=... startMs=...
active={isOpen} />` come overlay. Nessuna modifica a `buildTypeSchedule`,
`computeTypeReveal`, `useTypewriterLines` — restano gli stessi, già
testati.

## Testing

- `ParticleLine` non ha logica pura isolabile facilmente in unit test (è
  quasi tutto canvas/rAF/DOM) — coerente con `HeroParticleField.tsx`, che
  infatti non ha test dedicati nel repo. Verifica tramite avvio del sito e
  controllo visivo (come già fatto per il fix precedente), non test
  automatici nuovi.
- La funzione di word-wrap, essendo pura (testo + larghezza max → righe),
  **è** isolabile e testabile: un piccolo `wrapText(ctx, text, maxWidth):
  string[]` con un test che verifica lo spezzamento su un caso noto.
- I test esistenti (`envelopeTypewriter.test.ts`) restano invariati e
  devono continuare a passare — non tocchiamo `buildTypeSchedule`/
  `computeTypeReveal`.

## Rischi noti

- **Performance mobile**: simulazione fisica reale, non solo CSS. Il tetto
  di 400 particelle e "una riga alla volta" sono le mitigazioni; se il
  test visivo su un dispositivo reale mostra scatti, il tetto va abbassato
  ulteriormente (parametro isolato, facile da tunare).
- **Leggibilità durante la formazione**: le particelle sono per natura
  meno leggibili del testo vero durante il movimento (a differenza del fix
  precedente, dove il testo era sempre leggibile, solo più o meno
  trasparente). Accettato come parte dell'effetto richiesto.
- **Word-wrap non è tipografia perfetta**: giustificazione/hyphenation non
  previste — solo a-capo greedy per parola intera, sufficiente per il tono
  informale di un paragrafo di invito.
