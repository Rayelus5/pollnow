---
title: Planes y facturación
updated: 2026-05-22
---

# Planes y facturación

Desde v3.0 los planes **no están hardcodeados** como fuente de verdad: viven en la tabla
`SubscriptionPlan` y se gestionan desde el panel admin.

## Tabla `SubscriptionPlan`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | String (cuid) | |
| `name` | String | "Free", "Premium"… |
| `slug` | String @unique | "free", "premium"… |
| `quota` | Int | nº de eventos permitidos |
| `limits` | Json | `{ pollsPerEvent, participantsPerEvent, collaboratorsPerEvent, maxSharedEvents }` (`null` = ilimitado) |
| `features` | Json | flags adicionales (p.ej. `{ csvImport: true }`) |
| `price` | Float | precio en € |
| `stripePriceId` | String? @unique | id de precio en Stripe (o `"enterprise"`) |
| `isActive` | Boolean | |
| `sortOrder` | Int | orden de visualización |

## Resolución de plan

- **Servidor (enforcement):** `getPlanFromUser(user)` en `src/lib/user-plan.ts` — **async**,
  lee de BD vía `getActivePlans()` (cacheado con `unstable_cache`, tag `subscription-plans`,
  revalidate 1h). **Fail-open**: si la BD falla, usa el fallback hardcodeado.
- **Cliente (display) / fallback:** `src/lib/plans.ts` mantiene las constantes `PLANS`
  (marcadas `@deprecated` como fuente de verdad) + un resolver puro `resolvePlanFromList`.
  Es **client-safe** (no importa prisma), por eso lo usan componentes cliente como
  `SubscriptionCard`.

> Regla: **código de servidor** importa `getPlanFromUser` de `@/lib/user-plan`;
> **componentes cliente** usan las constantes de `@/lib/plans`.

## Gestión desde admin

`/admin/plans` (solo rol **ADMIN**) — `src/components/admin/AdminPlansManager.tsx` +
`src/app/lib/plan-actions.ts`:

- `createSubscriptionPlan`, `updateSubscriptionPlan`, `togglePlanActive`, `deleteSubscriptionPlan`.
- Cada mutación llama `revalidateTag("subscription-plans")` → el cambio se refleja **sin redeploy**.
- No se puede **eliminar** un plan con usuarios activos asociados (check por `stripePriceId`).

## Flujo Stripe

El checkout y los webhooks asignan `stripePriceId` / `subscriptionStatus` al `User`.
`getPlanFromUser` resuelve el plan comparando `user.stripePriceId` con los `stripePriceId`
de los planes activos. El bono de bienvenida (`promotion-utils.ts`) usa `getPriceIdForSlug`
(también desde BD).
