# Guía de migración — Pollnow v3.0

Pasos manuales necesarios para desplegar v3.0 (incluye los **modos de evento**: Tierlist, Preguntas y Dibujo).

## Nuevas variables de entorno

v3.0 introduce **rate limiting distribuido con Upstash Redis**. Añade estas variables en `.env.local` (desarrollo) y en Vercel (producción):

```bash
# Upstash Redis (rate limiting distribuido + caché de hot paths)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Vercel Blob (dibujos del modo DIBUJO + imágenes de nominados re-alojadas)
BLOB_READ_WRITE_TOKEN=

# Búsqueda de imágenes de nominados (opcional; sin ella solo Wikimedia)
PEXELS_API_KEY=

# Protección de los crons (expire-subscriptions, drawing-phases, blob-gc)
CRON_SECRET=
```

> - **Upstash** (https://console.upstash.com → Redis → "REST API"): sin estas dos, el rate limiter
>   va en **fail-open**.
> - **Vercel Blob**: en Vercel se autoconfigura al crear un store Blob; cópiala a `.env` para local.
>   Sin ella fallan las subidas de dibujos e imágenes re-alojadas.
> - **PEXELS_API_KEY**: registro gratis en https://www.pexels.com/api/. Opcional.
> - **CRON_SECRET**: un string aleatorio. Vercel lo manda como `Authorization: Bearer <CRON_SECRET>`
>   a los crons **solo si está definido**; sin él, los crons responden 401.

## Base de datos — flujo `db push`

> ⚠️ La BD de producción (Neon) tiene **drift** respecto al historial de migraciones
> (se usó `prisma db push` en el pasado). Por eso `prisma migrate dev/deploy`
> intentaría **resetear** la base de datos. **No lo uses.**
>
> El flujo de v3.0 es **`prisma db push`** (sincroniza schema → BD sin migraciones ni resets):
>
> ```bash
> npx prisma db push
> ```

### Estado actual de la BD (v3.0)

- **Índices compuestos** (`Event(status,createdAt)`, `Vote(pollId,createdAt)`,
  `CollaboratorInvitation(eventId,status)`, `Report(isReviewed,createdAt)`): **ya presentes**.
- **Tabla `SubscriptionPlan`**: **ya existe con los 5 planes** (Free, Premium, Plus, Unlimited,
  Enterprise). No requiere seed; los límites de modos resuelven por fallback hasta editarse en admin.
- **Modos de evento**: nuevos enums (`EventMode`, `DrawingPhase`, `QuestionType`, `ReactionType`)
  y modelos (`TierlistTier`, `TierlistVote`, `TierlistVoteEntry`, `Question`, `QuestionOption`,
  `QuestionAnswer`, `DrawingSubmission`, `DrawingReaction`). Se aplican con `npx prisma db push`.

### Gestión de planes

Los planes ya **no están hardcodeados** como fuente de verdad: se editan desde el panel admin en
**`/admin/plans`** (solo rol ADMIN). Los cambios se reflejan al instante vía `revalidateTag`.
Las constantes de `src/lib/plans.ts` quedan como **fallback fail-open** si la BD no responde.

## Checklist de despliegue

- [ ] Variables de entorno en Vercel: Upstash, `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`
      (y `PEXELS_API_KEY` si se quiere búsqueda en Pexels).
- [ ] `npx prisma db push` ejecutado (**NO** `migrate deploy`).
- [ ] Store de **Vercel Blob** creado.
- [ ] Crons activos en `vercel.json` (`drawing-phases`, `blob-gc`, `expire-subscriptions`).
- [ ] Build limpio.
- [ ] Verificación de rate limiting (headers RFC + 429) y `sitemap.xml`.
