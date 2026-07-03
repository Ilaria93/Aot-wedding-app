# OBW UI Migration Checklist

Usa questo file con la skill **aot-premium-design** o l'agente **@obw-ui**.  
Reference visivo: `/Users/misa/Downloads/Premium Wedding Experience`

## Stato migrazione

| Area | File | Stato |
|------|------|-------|
| Design tokens | `frontend/src/index.css` | ✅ |
| Component library | `frontend/src/styles/shared/aot-design-system.scss` | ✅ |
| Top bar | `components/AppTopBar/` | ✅ |
| RSVP page | `pages/RsvpPage/`, `components/Rsvp/` | ✅ party UI OBW |
| Landing RSVP CTA | `components/Landing/LandingRsvpSection.tsx` | ✅ briefing split |
| Mission document hero | `components/MissionDocumentHero/` | ✅ |
| Story section | `components/Landing/LandingStorySection.tsx` | ✅ |
| Ceremony section | `components/Landing/LandingCeremonySection.tsx` | ✅ |
| Gift section | `components/HoneymoonGiftSection/` | ✅ |
| FAQ section | `components/Landing/LandingFaqSection.tsx` | ✅ |
| Contacts section | `components/Landing/LandingContactsSection.tsx` | ✅ |
| Home wrapper | `pages/HomePage/` | ✅ |
| Login / Register | `pages/LoginPage/`, `pages/RegisterPage/`, `components/AuthExperience/` | ✅ split auth experience |
| Album | `pages/AlbumPage/` | ⬜ |
| Travel / Location | `pages/TravelPage/` | ⬜ |
| Profile | `pages/ProfilePage/` | ⬜ |
| Admin | `pages/AdminPage/` | ⬜ |
| Cursor UI (rules + skill) | `05-ui-design.mdc` + `aot-premium-design` | ✅ |
| Headquarters dashboard | *(nuova pagina)* | ⬜ |

Legenda: ✅ fatto · 🔄 in corso · ⬜ da fare

## Anti-regressione

Regole complete: `SKILL.md` (palette, tipografia, anti-pattern). Qui solo note migrazione:

- `.obw-fade-up` una per sezione, non su ogni figlio
- Icone Lucide: `color="var(--obw-gold)"` o `currentColor` sul parent

## Pattern per sezione landing

### Split editoriale (story, ceremony, gift header)

```tsx
<section className="obw-section obw-fade-up" id="story">
  <div className="obw-container obw-split">
    <div>...</div>
    <div className="obw-card">...</div>
  </div>
</section>
```

### Sezione centrata (RSVP CTA)

```tsx
<section className="obw-section obw-section--center obw-section--deep obw-fade-up">
  <p className="obw-kicker">{t('...')}</p>
  <h2 className="obw-display obw-display--lg">...</h2>
  <p className="obw-body obw-body--center obw-body--narrow">...</p>
  <Link className="obw-btn obw-btn--primary" to="...">...</Link>
</section>
```

### FAQ dark

```tsx
<section className="obw-section obw-section--dark obw-section--center obw-fade-up">
  <p className="obw-kicker obw-kicker--light">...</p>
  <h2 className="obw-display obw-display--light">...</h2>
  <div className="obw-faq-list">...</div>
</section>
```

## Micro-interazioni (solo sottili)

- Hover card: `obw-card--interactive`
- Hover button: già in `.obw-btn--primary`
- Parallax / nebbia: solo hero cinematico, non nelle card form
- Skeleton: `.obw-skeleton` durante fetch

## Dopo ogni pagina migrata

```bash
cd frontend && npx tsc --noEmit && npm test
```

Aggiorna la tabella **Stato migrazione** in questo file.
