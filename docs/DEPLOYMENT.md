# Pubblicazione — piano di rilascio

Deciso il 2026-08-31, in vista del weekend. Stack scelto per costo **zero o
quasi zero**, nessuna carta di credito richiesta su nessun servizio in free
tier.

## Stack

| Pezzo | Servizio | Perché |
|---|---|---|
| Frontend (build statico Vite) | **Vercel** | Free tier senza limiti pratici per questo traffico, riconosce Vite senza config, deploy automatico da GitHub |
| Backend (FastAPI) | **Render** (free web service) | Nixpacks-style, nessun Dockerfile da scrivere, deploy da GitHub |
| Database (Postgres) | **Neon** (free tier) | Postgres gratuito indipendente da Render — il Postgres free di Render scade dopo un po' di inattività/tempo, Neon no |
| Foto (album) | **Cloudflare R2** | S3-compatible, il codice supporta già `S3_ENDPOINT_URL` per provider non-AWS; free tier 10GB, nessun costo di banda in uscita |

**Compromesso accettato:** il piano free di Render "addormenta" il backend
dopo ~15 minuti di inattività — la prima richiesta dopo la pausa impiega
30-50s. Per un sito con traffico basso e diluito su mesi (matrimonio il
6-7 maggio 2027, vedi `RSVP_EDIT_DEADLINE` in `backend/settings.py`) è
accettabile. Se si vuole eliminarlo nelle ultime settimane prima
dell'evento, si passa al piano Render a pagamento (~7$/mese) solo per quel
periodo.

## Cosa serve modificare nel codice

**Niente.** Il codice è già interamente pilotato da env vars: CORS
(`CORS_ALLOW_ORIGINS`), URL del backend nel frontend (`VITE_API_URL`,
`frontend/src/constants/apiConfig.ts`), stringa di connessione DB
(`DATABASE_URL`), credenziali S3. Nessun `localhost` hardcoded trovato in
`frontend/src`.

L'unica aggiunta è [`render.yaml`](../render.yaml) nella root del repo: un
Blueprint che dice a Render come buildare/avviare il backend (root dir
`backend/`, comando di build, comando di start che lancia le migrazioni
Alembic prima di uvicorn). I valori dei secret (`sync: false`) restano da
inserire a mano nella dashboard Render — non sono committati.

## Checklist per il weekend

1. **Neon** → crea progetto, copia la connection string (già include
   `sslmode=require`).
2. **Cloudflare R2** → crea bucket, genera Access Key/Secret, nota
   l'endpoint URL (`https://<account_id>.r2.cloudflarestorage.com`).
3. **Render** → nuovo Web Service da GitHub, root del repo (legge
   `render.yaml` automaticamente). Inserire nella dashboard:
   - `DATABASE_URL` → connection string Neon
   - `JWT_SECRET_KEY` → nuovo valore random lungo (**diverso** da quello di
     dev), es. `openssl rand -hex 32`
   - `WEDDING_ROLE_SECRET` → nuovo valore, da condividere solo con
     sposi/admin
   - `CORS_ALLOW_ORIGINS` → dominio Vercel finale (punto 4, va aggiornato
     dopo il primo deploy Vercel)
   - `S3_BUCKET_NAME`, `S3_REGION` (`auto` per R2), `S3_ACCESS_KEY_ID`,
     `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT_URL` → valori da R2
   - Copia l'URL pubblico assegnato da Render (es.
     `https://aot-wedding-backend.onrender.com`)
4. **Vercel** → import del repo, **Root Directory = `frontend`**
   (monorepo, va impostato a mano — Vercel non lo indovina). Env var:
   - `VITE_API_URL` → URL Render del punto 3
5. Torna su Render e aggiorna `CORS_ALLOW_ORIGINS` con il dominio Vercel
   assegnato (es. `https://aot-wedding.vercel.app`).
6. Verifica: apri il dominio Vercel, prova login/registrazione, apri
   `/invito/<token>` generato con
   `backend/scripts/generate_invite_links.py` puntato al DB Neon.

## Dominio personalizzato

Non necessario per il weekend — si può partire con i sottodomini
`*.vercel.app` / `*.onrender.com` e collegare un dominio vero in un
secondo momento (Vercel lo supporta senza ridistribuire nulla).

## Cose fuori scope per questo rilascio

- Email transazionale (Resend/SendGrid) per conferma RSVP / magic link:
  non ancora implementata nel codice (vedi `docs/PRODUCT_DECISIONS.md`
  §1.3) — non blocca questo deploy.
- CI/CD: nessuna pipeline configurata, deploy è push-to-GitHub → build
  automatica su Vercel/Render.
