---
name: aot-premium-design
description: >-
  Designs and implements the Operation Beyond the Walls premium wedding UI
  (Apple-level polish + cinematic military-parchment atmosphere). Use when styling
  any page, component, landing section, dashboard, form, or when the user mentions
  Premium Wedding Experience, luxury wedding UI, Headquarters dashboard, editorial
  layout, or wants less static/plastic interfaces. NOT anime — military documents,
  stone, fog, parchment, muted gold only.
---

# Operation Beyond the Walls — Premium Design System

## Identità (NON negoziabile)

- **NON** anime, titani, personaggi, pannelli manga, UI da gioco o dark fantasy
- **SÌ** documenti militari, mappe antiche, mura di pietra, cieli drammatici, nebbia,
  architettura medievale realistica, pergamena, simbolismo militare elegante
- Sensazione: **brand di lusso originale** — Apple × Airbnb × Linear × Notion × Porsche
  con atmosfera cinematica AoT

## Stack progetto

- React + Vite + TypeScript, SCSS co-locato
- **Classi design system**: prefisso `obw-` in `frontend/src/styles/shared/aot-design-system.scss`
- Token CSS in `frontend/src/index.css` (`--obw-*`)
- Testi solo `t('chiave')` in it/en/de/fr

Policy sempre attiva: `.cursor/rules/05-ui-design.mdc` · Implementazione TSX/SCSS: `08-ui-implementation.mdc` · Agente: `@obw-ui`.

## Palette (usare SOLO questi token)

| Token | Uso |
|-------|-----|
| `--obw-charcoal` #1a1917 | Testo primario, sezioni dark, CTA filled |
| `--obw-paper` #f0e9d8 | Sfondo principale |
| `--obw-paper-deep` #e8e1d0 | Card su paper |
| `--obw-paper-muted` #d4cdc0 | Input, righe alternate |
| `--obw-stone` #6a6862 | Testo secondario |
| `--obw-green` #3a4a3b | Accento militare, successo |
| `--obw-gold` #b89438 | Label, icone, accenti editoriali |
| `--obw-burgundy` #6b1f2a | Errori, alert critici |
| `--obw-border` rgba(26,25,23,0.1) | Bordi rari e sottili |

## Tipografia

| Ruolo | Font | Uso |
|-------|------|-----|
| Titoli | `var(--font-display)` Cinzel | H1–H3, nomi, inviti |
| Body | `var(--font-sans)` Inter 300–400 | Paragrafi, form |
| Label / numeri | `var(--font-kicker)` Bebas Neue | SOLO caps, tracking largo, orari, codici fase |

Classi: `.obw-kicker`, `.obw-display`, `.obw-display--lg`, `.obw-body`

## Spaziatura e forma

- Sezioni: padding verticale **48–112px** (`--obw-space-xl` / `--obw-space-2xl`)
- Max width contenuto: **1280px** (`--obw-max`)
- **Radius 2px** (`--obw-radius`) — quasi nessun arrotondamento; NO pill 999px
- Ombre naturali soft, **pochi bordi**; lo spazio struttura il layout
- Alto contrasto, **molto whitespace**

## Componenti (classi pronte)

```
.obw-section          — wrapper sezione editoriale
.obw-section--dark   — sfondo charcoal
.obw-section--center — testo centrato
.obw-card             — card premium
.obw-card--dark       — card su charcoal
.obw-card--interactive — hover lift
.obw-btn              — bottone base
.obw-btn--primary     — charcoal fill
.obw-btn--secondary   — outline
.obw-btn--ghost       — solo testo + gold
.obw-input / .obw-textarea
.obw-choice           — riga selezione (RSVP, menu)
.obw-choice.is-active
.obw-timeline         — linea verticale programma
.obw-nav              — header sticky (vedi AppTopBar)
.obw-fade-up          — enter animation
```

## Pagine — struttura attesa

### Landing (`HomePage`)
Hero cinematic (esistente) → Mission Letter → Program → Location → Gallery preview → Gift → Footer

### Headquarters (futuro `/headquarters` o Profile esteso)
Sidebar + Mission Progress, Invitation, QR, Photos, Team, Menu, Communications

### RSVP (`/rsvp`)
Hero agente → form scelte card → conferma dark invitation card

### Album, Gift, Travel
Masonry foto, QR+IBAN minimal, timeline location con foto grandi

## Micro-interazioni (sobrie)

- Hover: `translateY(-1px)` + ombra, **max 220ms**, easing `var(--obw-ease-out)`
- Enter: `.obw-fade-up` stagger 60ms tra figli
- `prefers-reduced-motion`: disabilitare transform
- NO bounce, NO neon, NO glassmorphism pesante

## Anti-pattern

- `border-radius: 24px+`, bottoni pill, blob colorati, peach `#efd4c4` blocks
- Font sans per titoli principali
- Bebas per paragrafi lunghi
- UI affollata, troppe card nested

Dettagli componenti: [reference.md](reference.md)  
Checklist migrazione UI: [ui-migration-checklist.md](ui-migration-checklist.md)
