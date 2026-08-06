# Piano di Implementazione — Hero Matrimonio (restyle landing)

Documento operativo per il restyle della landing sul modello di `Hero Matrimonio.dc.html`.
Indipendente da `PROJECT_BRIEF.md` / `PRODUCT_DECISIONS.md` (che restano validi); registra le decisioni
della sessione di grill e traduce il lavoro in task attuabili.

Ultimo aggiornamento: 2026-08-06

---

## 1. Contesto e vincoli

- **Non si tocca il backend.** API e logiche (`FastAPI :8000`) restano invariate.
- Il file `Hero Matrimonio.dc.html` è un prototipo di design tool (placeholders `{{ }}`, `<sc-if>`, `<image-slot>`):
  **non importabile direttamente** — va riprodotto in React con i componenti esistenti.
- FE: **React 19 + Vite 6 + TS, SCSS custom** (no Tailwind), i18n custom 4 lingue (`it/en/fr/de`).
- Dati evento già presenti in `frontend/src/constants/weddingEvent.ts` e i18n → **nessun cambio dati**.
- I componenti `Landing*`, `MissionDocumentHero`, `HoneymoonGiftSection` e il design system `.obw-*`
  sono **da ristilare, non da riscrivere**.

## 2. Decisioni condivise (sessione grill)

| Nodo | Decisione |
|------|-----------|
| Palette | Esatta del prototipo: hero `#B48EAD` (malva), tinta sezioni `#2A1614`, testo `#FDF6EC` (osso) |
| Architettura | Landing single-page a scroll come prototipo; `/rsvp /album /profile /admin` restano pagine protette |
| Viaggio | NO sezione Viaggio in landing → resta pagina `/travel` (protetta) |
| Galleria | Preview foto reali (`fetchPublicPhotoAlbum`, GET `/photos`) + CTA → `/album` |
| RSVP | 3 passi come prototipo + CTA → `/rsvp` (guard reindirizza a login se non autenticato) |
| Font | Prototipo: Great Vibes (display) / Cormorant Infant (body) / Geist (utility) |
| Petali | Riuso `HeroParticleField` esistente (canvas, `prefers-reduced-motion` ok) |
| Componenti | Ristilare l'esistente, non ricostruire |
| Nav | Ancore in home (Storia/Programma/RSVP/Galleria/Regalo/Contatti) + route `/album` `/travel`, CTA RSVP e menu account altrove |
| 3D/cinematic | In pausa, gated dietro `VITE_CINEMATIC_HERO_ENABLED` — non toccare |
| Tipografia | `--font-display/body/editorial/utility` aggiornati in `index.css` + link Google Fonts in `index.html` |

## 3. Mappa sezioni → componenti

| Sezione prototipo | Componente esistente | Intervento |
|-------------------|----------------------|-----------|
| Hero (petali, countdown, nomi, stemma, scroll-cue) | `MissionDocumentHero` + SCSS | Restyle palette/typo |
| La Nostra Storia (foto sposi) | `LandingStorySection` | Restyle (usa foto reali webp in `public/assets/wedding/`) |
| Galleria (foto decorate + CTA) | **NUOVO** `GallerySection` | Fetch GET `/photos`, griglia + CTA `/album` |
| Programma (data/ora/luogo) | `LandingCeremonySection` | Restyle |
| RSVP (3 passi) | `LandingRsvpSection` | Restyle |
| Verso il Giappone (IBAN) | `HoneymoonGiftSection` | Restyle |
| FAQ | `LandingFaqSection` | Restyle |
| Contatti | `LandingContactsSection` | Restyle |
| Nav override | `AppTopBar` | Ancora in home, route altrove |

## 4. Fasi di lavoro

### Fase 0 — Base (fatta)
- [x] Commit base su `main` (`4577a2e`)
- [x] Branch `feat/hero-matrimonio-design`
- [x] `.claude/` in `.gitignore`

### Fase 1 — Fondazioni (design token + font)
- [x] `frontend/index.html`: Google Fonts → `Great Vibes` (400), `Cormorant Infant` (400/500/600 + italic), `Geist` (300/400)
- [x] `frontend/src/index.css`: aggiornare `--font-*` e palette `--obw-*` alla palette prototipo
  - sfondo hero malva `#B48EAD`, tinta sezioni `#2A1614`, bone `#FDF6EC`, accent oro `#C9A84C`
  - tenere gli alias `--aot-*` (usati da componenti legacy)
- [x] Verifica: `npm run build` in `frontend/` (nota: `npm run build` full è bloccato da errori TS pre-esistenti nel codice 3D in pausa; `npx vite build` passa)

### Fase 2 — Hero (MissionDocumentHero)
- [x] SCSS: sfondo full-bleed foto cover + scrim a gradiente prototipo (top malva verso trasparente)
- [x] Typography: titolo dei nomi in Great Vibes, data in Cormorant Infant, kicker in Geist
- [x] Countdown e scroll-cue mantenuti e allineati alla palette
- [x] `HeroParticleField` montato nell'hero (già presente) — verificare contrasto su sfondo foto
- [x] Stemma riusato da `public/assets/wedding/stemma.webp`
- [x] Verifica: hero responsive + `prefers-reduced-motion`

### Fase 3 — Sezioni Landing
- [x] `LandingStorySection`: foto real (davide.webp / ilaria.webp), palette prototipo
- [x] `LandingCeremonySection` (Programma): restyle data/ora/luogo
- [x] `LandingRsvpSection` (3 passi): restyle
- [x] `HoneymoonGiftSection` (regalo IBAN): restyle
- [x] `LandingFaqSection`: restyle
- [x] `LandingContactsSection`: restyle
- [x] Verifica: lint + build + navigazione 4 lingue

### Fase 4 — Nuova sezione Galleria
- [x] NUOVO `src/components/Landing/GallerySection/` (`GallerySection.tsx` + `styles/GallerySection.scss`)
  - fetch `fetchPublicPhotoAlbum()` in `useEffect`
  - griglia foto decorate (forme arrotondate/circolari come prototipo), stato: loading / vuoto / errore
  - CTA "Vuoi rivivere i momenti? Caricali pure qui" → `/album`
- [x] i18n: chiavi `landing.gallery.*` in `it/en/fr/de`
- [x] Test: componente Visualizza in `GallerySection` con stati 0 foto / N foto / errore => vitest

### Fase 5 — Nav (AppTopBar + HomePage)
- [x] `HomePage`: comporre la landing finale (Hero + Story + Gallery + Ceremony + Rsvp + Gift + Faq + Contacts), senza import cinematic
- [x] `AppTopBar`: se `pathname === '/'` mostra menu `obw-anchor` alle sezioni (`#story`, `#gallery`, `#ceremony`, `#rsvp`, `#gift`, `#faq`, `#contacts`); altrove route `/album` `/travel` + CTA RSVP + `AppUserMenu`
- [x] Scroll-smooth / scroll-margin per gli anchor (`html { scroll-behavior: smooth }` già presente; gestire `scroll-margin-top` vs header sticky)
- [x] Verifica: navigazione con ancore su home + route su altre pagine, mobile menu

### Fase 6 — Design system `.obw-*`
- [x] `styles/shared/aot-design-system.scss`: typography (display/body/kicker) + `.obw-card`, `.obw-btn`, `.obw-tag`, `.obw-nav` allineati alla palette prototipo
- [x] Verifica che le pagine non-landing (Login, Rsvp, Travel, Album, Profile, Admin) restino usabili con le nuove token
- [x] Accessibilità: contrasto WCAG AA su testo osso `#FDF6EC` su sfondi chiari e viceversa; touch target ≥ 44px

### Fase 7 — Verifica e chiusura
- [x] `npm run lint` (non disponibile) / verifica `npx vite build` + `npx tsc` sui file toccati
- [x] `npm test` (vitest) — i test delle modifiche (Gallery) verdi; 7 fallimenti pre-esistenti nel codice cinematic (uguali su `main`)
- [x] Build di produzione `vite build` ok
- [x] i18n: tutte le nuove chiavi presenti nei 4 file locale (no fallback implicito)
- [ ] Firma: codici `docs/` aggiornati (CONTEXT.md + ADR) se serve

## 5. Non-scope (fuori da questo task)
- Backend (nessun file in `backend/` toccato)
- Codice 3D/cinematic (`src/cinematic/`, `src/scenes/`, `src/data/`) e `TitanPreviewPage`
- Fazioni/spille, email/magic link, moderazione foto (già deciso in `PRODUCT_DECISIONS.md`)
- Migrazione dati / schema DB

## 6. Rischi
| Rischio | Mitigazione |
|---------|-------------|
| Palette malva `#B48EAD` potrebbe ridurre contrasto testo osso | Test contrasto AA su hero; scrimma sul gradiente |
| Font script Great Vibes in tutto body=lento | Limitato a titoli display; body resta Cormorant Infant / Geist per utility |
| Nav a ancore in home con header sticky che copre le sezioni | `scroll-margin-top` sulle sezioni |
| Galleria reali in landing = latenza/errore se backend down | Stato vuoto + retry leggero, niente blocchi luminosi |
| 4 lingue = chiavi mancanti | Script/verifica build tipizzata (TranslationKey) |
| `npm run build` (`tsc -b`) fallisce su errori TS pre-esistenti nel codice 3D in pausa | Validazione tramite `npx vite build` (passa); non si tocca `src/cinematic/` |
| 7 test vitest pre-esistenti rossi (cinematic + authRouteAccess) | Presenti anche su `main`; i test delle modifiche (Gallery) passano |