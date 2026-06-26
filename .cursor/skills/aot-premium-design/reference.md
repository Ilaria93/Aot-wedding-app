# OBW Design System — Reference

## Mapping legacy → OBW

| Legacy | Sostituire con |
|--------|----------------|
| `.section-card` | `.obw-card` |
| `.button-primary` | `.obw-btn.obw-btn--primary` |
| `.eyebrow` | `.obw-kicker` |
| `.title` (hero) | `.obw-display.obw-display--lg` |
| `.subtitle` | `.obw-body` |
| `border-radius: 30px` | `border-radius: var(--obw-radius)` |
| `var(--aot-bronze)` | `var(--obw-gold)` |

## Esempio sezione RSVP landing

```tsx
<section className="obw-section obw-section--center obw-fade-up" id="rsvp">
  <p className="obw-kicker">{t('landing.rsvp.eyebrow')}</p>
  <h2 className="obw-display obw-display--lg">{t('landing.rsvp.heading')}</h2>
  <p className="obw-body obw-body--center obw-body--narrow">{t('landing.rsvp.body')}</p>
  <Link className="obw-btn obw-btn--primary" to="/rsvp">{t('landing.rsvp.button')}</Link>
</section>
```

## Esempio form scelta (RSVP / menu)

```tsx
<button type="button" className={`obw-choice${active ? ' is-active' : ''}`} aria-pressed={active}>
  <span className="obw-choice__radio" aria-hidden />
  <span className="obw-choice__label">{label}</span>
</button>
```

## Prompt Cursor consigliati

- "Usa **@obw-ui** per migrare AlbumPage"
- "Rifai AppTopBar come nel reference Premium Wedding Experience"
- "@obw-ui-reviewer verifica LandingCeremonySection"
