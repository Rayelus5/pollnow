---
title: Puesta en marcha
updated: 2026-05-22
---

# Puesta en marcha

## Requisitos

- Node.js ≥ 20 (probado con 24.x)
- npm
- Una base de datos PostgreSQL (el proyecto usa **Neon**)
- Cuentas/credenciales para: Stripe, Pusher, Upstash Redis, proveedor de email, Google OAuth

## Instalación

```bash
npm install
```

## Variables de entorno

Crea un `.env` en la raíz. La lista completa está en
[environments.md](../07-infrastructure/environments.md). Mínimo para arrancar:

```bash
DATABASE_URL=...            # conexión pooled (PgBouncer)
DATABASE_URL_UNPOOLED=...   # conexión directa
AUTH_SECRET=...
# ...resto de claves (Stripe, Pusher, Upstash, email, Google)
```

## Base de datos — `db push` (no `migrate`)

> ⚠️ **Importante:** la BD tiene drift respecto al historial de migraciones (se usó
> `prisma db push` en el pasado). `prisma migrate dev/deploy` intentaría **resetearla**.
> Usa siempre **`db push`**.

```bash
npx prisma db push     # sincroniza el esquema con la BD
npx prisma generate    # regenera el cliente Prisma
```

(Comandos de Prisma siempre con `npx`.)

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` | Build de producción |
| `npm start` | Servidor de producción |
| `npx prisma studio` | Explorador visual de la BD |

## Problemas comunes

- **Turbopack panic (`inner_of_upper_lost_followers`)** en `npm run dev`: caché incremental
  corrupta. Solución: `rm -rf .next node_modules/.cache` y reiniciar. Si persiste, usar
  `next dev --webpack`.
- **`prisma migrate` quiere resetear la BD**: no uses migrate; usa `db push` (ver arriba).
- **Rate limiting no limita en local**: falta configurar Upstash → modo fail-open
  (deja pasar todo). Es esperado en desarrollo.
