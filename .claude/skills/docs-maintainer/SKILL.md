---
name: docs-maintainer
description: Use when a code change in Pollnow affects documented behavior — schema/Prisma models, API routes or rate limits, env vars, subscription plans, caching/SEO config — to keep /docu and README in sync. Trigger after edits to prisma/schema.prisma, src/app/api/**, src/lib/{plans,user-plan,rate-limit-redis,event-counters}.ts, sitemap/robots/metadata, or when adding env vars.
---

# Pollnow docs maintainer

Mantén la documentación de `/docu` y el `README.md` alineados con el código. Tras un cambio
relevante, actualiza el doc correspondiente **en el mismo PR**.

## Mapa cambio → documento

| Si cambias… | Actualiza… |
|-------------|-----------|
| `prisma/schema.prisma` (modelos/campos) | `docu/01-overview/README.md` (entidades) y, si aplica, `docu/03-architecture/overview.md` |
| Rutas en `src/app/api/**` o sus límites | `docu/05-api/rate-limiting.md` (tabla de límites) |
| `src/lib/rate-limit-redis.ts` | `docu/05-api/rate-limiting.md` |
| `src/lib/event-counters.ts` | `docu/07-infrastructure/redis-upstash.md` |
| `src/lib/plans.ts` / `user-plan.ts` / `plan-actions.ts` / modelo `SubscriptionPlan` | `docu/04-subsystems/billing-plans.md` |
| `unstable_cache` / `revalidateTag` / ISR | `docu/03-architecture/overview.md` (capas de caché) |
| `sitemap.ts` / `robots.ts` / metadata / OG / JSON-LD | `docu/06-seo/seo.md` |
| Nueva variable de entorno | `docu/07-infrastructure/environments.md` **y** `MIGRATION_GUIDE_v3.0.md` |
| Estilo visual / nuevos patrones UI | `DESIGN.md` |
| Cualquier release | `docu/10-changelog/CHANGELOG.md` (+ archivo `vX.Y.md`) |

## Reglas

- Cada archivo de `/docu` lleva frontmatter con `title` y `updated` (fecha ISO). Actualiza
  `updated` al editar.
- No dupliques contenido: enlaza entre documentos con rutas relativas.
- El `README.md` se mantiene **≤ 150 líneas**; el detalle va en `/docu`.
- Verifica que los enlaces de `docu/INDEX.md` no queden rotos al añadir/renombrar archivos.
- Recuerda las convenciones del proyecto: **`prisma db push`** (no migrate), comandos Prisma
  con **`npx`**, URL canónica `https://pollnow.es`.
