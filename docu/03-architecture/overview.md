---
title: Arquitectura y runtime
updated: 2026-05-22
---

# Arquitectura y runtime

## Modelo de ejecución

- **Next.js 16 App Router** con React Server Components + Server Actions.
- **Server Actions** para mutaciones (crear/editar evento, votar, admin…).
- **Route Handlers** (`/api/*`) para endpoints que consume el cliente (like/vote de evento,
  generación de imágenes, búsqueda, colaboradores, tags…).
- **Middleware** (`middleware.ts`) para guards de auth en rutas protegidas.

## Rendering

| Página | Estrategia |
|--------|-----------|
| `/` (landing) | Estática + metadata |
| `/polls` | `force-dynamic` + listado público cacheado con `unstable_cache` |
| `/e/[slug]` | `force-dynamic` (voto/timing en vivo) |
| `/about`, `/empresas` | Estáticas |
| `/dashboard/*`, `/admin/*` | Dinámicas, protegidas |

## Capas de caché

1. **`unstable_cache`** (datos idempotentes):
   - Listado público de `/polls` → tag `events-public`, revalidate 60s.
   - Agregación de tags (`/api/tags`) → tag `events-public`, revalidate 300s.
   - Planes (`getActivePlans`) → tag `subscription-plans`, revalidate 3600s.
   - Announcement bar → tag `announcement`.
2. **Redis (Upstash)** para hot paths:
   - Contadores `event:{id}:score` y `event:{id}:likes`, TTL 60s
     (ver [redis-upstash.md](../07-infrastructure/redis-upstash.md)).
3. **Invalidación** vía `revalidateTag(...)` en las mutaciones correspondientes
   (p.ej. crear/editar/borrar/aprobar evento → `events-public`).

## Performance backend (v3.0)

- `getEventStats()` resuelto en 3 queries paralelas (sin includes anidados masivos).
- Sin loops `await prisma.*` en bucle: `createMany`/`deleteMany` en transacción.
- Scores vía `aggregate`/`groupBy` (no cargar arrays de votos).
- Índices compuestos: `Event(status,createdAt)`, `Vote(pollId,createdAt)`,
  `CollaboratorInvitation(eventId,status)`, `Report(isReviewed,createdAt)`.

## Base de datos

PostgreSQL en Neon, vía Prisma. **Flujo `db push`** (no migraciones — ver
[setup](../02-getting-started/setup.md)). Conexión pooled (`DATABASE_URL`) en runtime y
directa (`DATABASE_URL_UNPOOLED`) para operaciones de esquema.
