# Guía de migración — Pollnow v3.0

Pasos manuales necesarios para desplegar v3.0. Este documento se completa a lo largo del desarrollo; la sección de despliegue final se cierra en la Fase 8.

## Nuevas variables de entorno

v3.0 introduce **rate limiting distribuido con Upstash Redis**. Añade estas variables en `.env.local` (desarrollo) y en Vercel (producción):

```bash
# Upstash Redis (rate limiting distribuido + caché de hot paths)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

> Las obtienes en https://console.upstash.com → crea una base de datos Redis → pestaña "REST API".
> Si estas variables faltan, el rate limiter funciona en modo **fail-open** (deja pasar la request y lo registra), por lo que la app no se rompe en local sin Redis.

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
  Enterprise). No requiere seed.

### Gestión de planes

Los planes ya **no están hardcodeados** como fuente de verdad: se editan desde el panel admin en
**`/admin/plans`** (solo rol ADMIN). Los cambios se reflejan al instante vía `revalidateTag`.
Las constantes de `src/lib/plans.ts` quedan como **fallback fail-open** si la BD no responde.

## Checklist de despliegue (se completa en Fase 8)

- [ ] Variables de entorno Upstash configuradas en Vercel
- [ ] `npx prisma migrate deploy` ejecutado
- [ ] Seed de planes ejecutado
- [ ] Build limpio
- [ ] Verificación de rate limiting (headers RFC + 429)
- [ ] Sitemap accesible
