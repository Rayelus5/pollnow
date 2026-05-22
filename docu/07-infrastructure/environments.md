---
title: Variables de entorno
updated: 2026-05-22
---

# Variables de entorno

Todas se definen en `.env` (desarrollo) y en Vercel (producción). Las `NEXT_PUBLIC_*` se
exponen al cliente.

## Base de datos (Neon / Prisma)

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Conexión **pooled** (PgBouncer) para queries en runtime |
| `DATABASE_URL_UNPOOLED` | Conexión **directa** para operaciones de esquema (`db push`) |

## Autenticación (Auth.js)

| Variable | Uso |
|----------|-----|
| `AUTH_SECRET` | Secreto de NextAuth |
| `AUTH_URL` | URL base de auth |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | OAuth de Google |

## Pagos (Stripe)

| Variable | Uso |
|----------|-----|
| `STRIPE_SECRET_KEY` | API key secreta |
| `STRIPE_WEBHOOK_SECRET` | Validación de firma del webhook |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Key pública (cliente) |

## Redis (Upstash) — **nuevo en v3.0**

| Variable | Uso |
|----------|-----|
| `UPSTASH_REDIS_REST_URL` | Rate limiting distribuido + contadores |
| `UPSTASH_REDIS_REST_TOKEN` | idem |

> Sin estas dos, el rate limiting y los contadores van en **fail-open**. Obtenlas en
> https://console.upstash.com (REST API).

## Tiempo real (Pusher)

| Variable | Uso |
|----------|-----|
| `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` | Servidor |
| `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` | Cliente |

## Email e IA

| Variable | Uso |
|----------|-----|
| `RESEND_API_KEY` | Envío de emails |
| `GEMINI_API_KEY` | Chatbot (Google Generative AI) |
| `POLLINATIONS_API_KEY` | Generación de imágenes |

## Otras

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_APP_URL` | URL pública de la app |
| `NEXT_PUBLIC_DEMO_EVENT_URL` | Enlace al evento demo |
| `ADMIN_IP_WHITELIST` | IPs permitidas para admin |
| `IP_ADDRESS` | (uso interno) |

## Checklist de despliegue (Vercel)

- [ ] Todas las variables anteriores configuradas.
- [ ] `npx prisma db push` ejecutado (NO `migrate deploy` — ver
      [setup](../02-getting-started/setup.md)).
- [ ] La tabla `SubscriptionPlan` tiene los planes (ya poblada; no requiere seed).
- [ ] Verificar rate limiting (429 + headers) y `sitemap.xml`.
