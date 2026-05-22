---
title: Rate limiting
updated: 2026-05-22
---

# Rate limiting (Upstash)

Desde v3.0 el rate limiting es **distribuido** (Upstash Redis), apto para multi-instancia
(Vercel). Sustituye al limitador in-memory anterior.

## Implementación

`src/lib/rate-limit-redis.ts`:

```ts
const rl = await rateLimit(`vote:${userId}`, 20);        // 20 req / 60s
if (!rl.allowed) return tooManyRequests(rl);             // 429 con headers RFC
```

- **Sliding window** de Upstash (`@upstash/ratelimit`). Reutiliza instancias por límite+ventana.
- **Fail-open**: si faltan las env vars de Upstash o Redis falla, **se permite** la request
  (y se registra). La app nunca se cae por un fallo de rate limiting.
- `getClientIp(req)` para limitar por IP.

## Headers RFC

`tooManyRequests(rl)` y `rateLimitHeaders(rl)` añaden en las respuestas:

```
RateLimit-Limit: <límite>
RateLimit-Remaining: <restantes>
RateLimit-Reset: <unix-seconds>
Retry-After: <segundos>   (solo en 429)
```

## Límites por ruta

| Ruta | Clave | Límite (por 60s) |
|------|-------|------------------|
| `/api/generate-image` | user / ip | 5 (auth) · 2 (anónimo) |
| `/api/admin/send-email` | user | 5 |
| `/api/polls` (crear) | ip | 10 |
| `/api/collaborators/invite` | ip | 10 |
| `/api/events/[id]/like` | user | 15 |
| `/api/polls/[id]/vote` | ip | 15 |
| `/api/chat` | ip | 15 |
| `/api/events/[id]/vote` | user | 20 |
| `/api/collaborators/respond` | ip | 20 |
| `/api/collaborators/[eventId]` (DELETE) | ip | 20 |
| `/api/users/search` | ip | 30 |
| `/api/events/random` | ip | 30 |
| `/api/admin/*/batch` | user | 30 |
| `/api/collaborators/[eventId]` (PATCH) | ip | 30 |
| `/api/support/messages/[chatId]` | user | 30 |
| `/api/tags` | ip | 60 |
| `/api/polls/[id]` (GET) | ip | 60 |
| `/api/polls/[id]/results` | ip | 60 |
| `/api/collaborators/[eventId]` (GET) | ip | 60 |

El **webhook de Stripe está exento** (se valida por firma).

## Configuración

Requiere `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`
(ver [environments.md](../07-infrastructure/environments.md)). Sin ellas → fail-open.

## Prueba rápida

```bash
for i in $(seq 1 70); do curl -s -o /dev/null -w "%{http_code} " https://pollnow.es/api/tags; done
# Deberían aparecer 429 tras superar el límite, con headers RateLimit-*
```
