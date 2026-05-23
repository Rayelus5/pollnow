---
title: Planes y facturación
updated: 2026-05-23
---

# Planes y facturación

Desde v3.0 los planes **no están hardcodeados** como fuente de verdad: viven en la tabla
`SubscriptionPlan` y se gestionan desde el panel admin. Es la **única fuente de verdad** para
planes en toda la web (admin, `/premium`, badges, límites).

## Tabla `SubscriptionPlan`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | String (cuid) | |
| `name` | String | "Free", "Premium"… |
| `slug` | String @unique | "free", "premium"… |
| `quota` | Int | nº de eventos permitidos |
| `limits` | Json | Límites GALA (`pollsPerEvent`, `participantsPerEvent`, `collaboratorsPerEvent`, `maxSharedEvents`) **+ por modo** (`tierlistMaxTiers`, `tierlistMaxOptions`, `preguntasMaxQuestions`, `preguntasMaxOptions`, `preguntasMaxPerPage`, `drawingMaxEvents`, `drawingMinTimeSecs`, `drawingMaxTimeSecs`, `drawingAllowUnlimited`). `null` = ilimitado/no aplica |
| `features` | Json | Flags + **textos de marketing de `/premium`**: `featureList[]`, `tagline`, `period`, `highlight`, `enterpriseLike`, `originalPrice` |
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
> **componentes cliente** reciben datos resueltos por props (o usan los helpers client-safe de
> `@/lib/plans`), no priceIds hardcodeados.

> **Fallback por slug:** `mapRow` (en `user-plan.ts`) rellena los límites ausentes en el JSON de
> BD con los valores hardcodeados **del mismo slug**. Así, planes creados antes de añadir campos
> nuevos (p.ej. límites de modos) resuelven correctamente sin editar la BD a mano.

## Helpers de presentación (client-safe)

`src/lib/plans.ts` expone, además del fallback:

- `PLAN_BADGE` / `planBadge(slug)` — etiqueta + clases del badge por slug (presentación).
- `planSlugFromUser(user, plans)` — resuelve el slug real del usuario contra la lista de planes.

Usados para evitar el bug histórico de "todo usuario `active` = PREMIUM" y para no duplicar el
mapeo slug⇄priceId⇄label. Los priceIds de Stripe ya **no se duplican** en el admin: el selector
de plan (`UserActions`) y el bono de bienvenida toman el `stripePriceId` desde los planes de BD.

## Página `/premium`

`PricingSection.tsx` se construye desde `getActivePlans()`: **precio, priceId y características
salen de BD**. Los textos vienen del JSON `features` (`featureList`, `tagline`, …) con un
fallback por slug si están vacíos. El descuento se calcula desde `features.originalPrice`.

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
