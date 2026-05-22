---
title: Visión general y modelo de dominio
updated: 2026-05-22
---

# Visión general

Pollnow permite crear **galas digitales**: eventos de premios con categorías votables. El
organizador crea un evento, define categorías (polls) y nominados (participantes), comparte el
enlace y la audiencia vota. Los resultados pueden sellarse hasta la fecha de la gala (**Modo
Gala**) y revelarse en directo.

## Modelo de dominio (entidades principales)

| Entidad | Descripción |
|---------|-------------|
| **User** | Cuenta. Incluye rol (`USER`/`MODERATOR`/`ADMIN`) y campos de suscripción Stripe. |
| **Event** | La gala. Tiene `slug`, `accessKey` (privadas), `isPublic`, `status` (`DRAFT`/`PENDING`/`APPROVED`/`DENIED`), `galaDate`, `tags[]`. |
| **Participant** | Nominado de un evento (nombre + imagen). |
| **Poll** | Categoría de votación. `votingType`: `SINGLE` / `MULTIPLE` / `LIMITED_MULTIPLE`. |
| **Option** | Vincula un Participant a un Poll (un nominado en una categoría). |
| **Vote** / **VoteOption** | Voto (papeleta) y sus opciones elegidas. Voto anónimo por `voterHash`. |
| **EventLike** / **EventVote** | Like y voto (±1) sobre el evento en el explorador público. |
| **EventCollaborator** / **CollaboratorInvitation** | Colaboración en equipo con permisos. |
| **SubscriptionPlan** | Definición de planes (límites, precio, stripePriceId) — editable desde admin. |
| **Report**, **ModerationLog**, **SupportChat**, **Notification**, **Raffle**, **AnnouncementBar**, **PromotionConfig** | Moderación, soporte, sorteos y marketing. |

## Planes (tiers)

| Plan | Eventos | Categorías/ev | Nominados/ev | Colaboradores/ev |
|------|---------|---------------|--------------|-------------------|
| Free | 1 | 5 | 12 | 0 |
| Premium | 5 | 10 | 30 | 1 |
| Plus | 10 | 15 | 50 | 5 |
| Unlimited | 20 | 30 | 100 | 15 |
| Enterprise | 150 | 50 | 1000 | 30 |

Los límites se almacenan en la tabla `SubscriptionPlan` y se gestionan desde `/admin/plans`.
Ver [billing-plans.md](../04-subsystems/billing-plans.md).

## Ciclo de vida de una votación

1. El organizador crea el evento (nace como `DRAFT`).
2. Añade categorías y nominados (con límites según su plan).
3. Publica / lo hace público (aparece en `/polls` si `isPublic`).
4. La audiencia vota (anónimo por `voterHash` o autenticado).
5. En modo Gala, los resultados se sellan hasta `galaDate` y se revelan en directo.

> Para el detalle exhaustivo de cada subsistema (auth, voto anónimo, stats, colaboración,
> soporte, admin…), ver la [referencia completa heredada](./full-reference.md).
