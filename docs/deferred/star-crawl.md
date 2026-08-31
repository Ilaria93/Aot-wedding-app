# Star crawl — componente pronto, non ancora agganciato

Vedi anche [`PRODUCT_DECISIONS.md` §8](../PRODUCT_DECISIONS.md#8-fuori-scope--fasi-successive).

Meccanica del crawl di apertura di Star Wars (testo che scorre verso l'alto rimpicciolendo verso
l'orizzonte per la prospettiva), vestita con la palette e i font del sito (pergamena/oro/carbone) invece che
stelle e sfondo nero. **A differenza dell'effetto particellare**, questo è già costruito e funzionante — manca
solo la decisione su dove usarlo nel sito e che testo fargli scorrere.

## Dov'è nel codice

- Componente: [`frontend/src/components/StarCrawl/StarCrawl.tsx`](../../frontend/src/components/StarCrawl/StarCrawl.tsx)
  (+ [`styles/StarCrawl.scss`](../../frontend/src/components/StarCrawl/styles/StarCrawl.scss)) — solo
  CSS/SCSS (`perspective` + `rotateX` fissa + animazione di `top`), nessuna nuova dipendenza.
- Props: `lines: string[]`, `title?: string`, `durationSeconds?: number` (default 32s).
- Rispetta `prefers-reduced-motion` (testo fermo, nessuna animazione).

## Come vederlo

Solo in sviluppo (`npm run dev`), mai nella build di produzione:

```
http://localhost:5173/dev/star-crawl
```

Rotta registrata in [`App.tsx`](../../frontend/src/App.tsx) dietro `import.meta.env.DEV`, e aggiunta a
`DEV_PUBLIC_PATHS` in
[`authRouteAccess.ts`](../../frontend/src/components/AuthGuard/authRouteAccess.ts) (stesso pattern già
usato per `/dev/titan-preview`). La pagina di anteprima è
[`StarCrawlPreviewPage.tsx`](../../frontend/src/pages/StarCrawlPreviewPage/StarCrawlPreviewPage.tsx), con
testo segnaposto — da sostituire quando si decide il contenuto vero.

## Decisioni ancora aperte

- **Dove**: nella pagina invito (`/invito/{token}`)? Prima della busta, dopo la lettera, o altrove? Non
  ancora deciso.
- **Testo**: prologo/racconto della coppia, oppure le stesse info della lettera, oppure altro — non ancora
  deciso.
- Quando si decide: passare `lines`/`title` reali al posto del placeholder, scegliere `durationSeconds`, e
  capire come si aggancia al resto del flusso (`EnvelopeInvite.tsx`) senza duplicare contenuti già mostrati
  dalla macchina da scrivere.
