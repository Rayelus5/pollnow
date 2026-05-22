---
title: Redis (Upstash)
updated: 2026-05-22
---

# Redis (Upstash)

Upstash Redis (REST) cumple dos funciones en v3.0:

1. **Rate limiting distribuido** — ver [rate-limiting.md](../05-api/rate-limiting.md).
2. **Contadores de hot path** — score de votos y likes por evento.

## Configuración

```bash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Se obtienen en https://console.upstash.com → base de datos Redis → pestaña **REST API**.
Si faltan, ambos usos van en **fail-open** (rate limit deja pasar; contadores recurren a BD).

## Contadores de evento

`src/lib/event-counters.ts`:

```ts
getEventScore(eventId)      // read-through (Redis o BD + repoblar), TTL 60s
getEventLikes(eventId)      // idem
refreshEventScore(eventId)  // recalcula desde BD (autoritativo) y refresca caché
refreshEventLikes(eventId)  // idem
```

- Claves: `event:{id}:score`, `event:{id}:likes`.
- Los endpoints de voto/like (`/api/events/[id]/vote` y `.../like`) llaman a `refresh*` tras
  mutar: recalculan el valor autoritativo desde BD y refrescan Redis. Así las lecturas
  posteriores sirven de caché y siempre quedan coherentes tras una escritura.
- **Fail-open**: cualquier error de Redis cae a la consulta directa de BD.

## Notas de operación

- Es una sola base Redis para rate limiting + contadores (clientes HTTP ligeros).
- TTL de contadores: 60s → en el listado público los conteos pueden ir hasta 60s desfasados
  (aceptable; la página de evento muestra valores frescos tras cada acción).
