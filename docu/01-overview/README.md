---
title: Visión general y modelo de dominio
updated: 2026-05-23
---

# Visión general

Pollnow permite crear **eventos de votación interactiva**. El organizador crea un evento, lo
configura según su **modo**, comparte el enlace y la audiencia participa. Desde v3.0 hay 4
modos: **Gala** (premios por categorías), **Tierlist** (ordenar nominados en tiers),
**Preguntas** (formulario tipo test) y **Dibujo** (estilo Gartic Phone). Ver
[event-modes.md](../04-subsystems/event-modes.md).

## Modelo de dominio (entidades principales)

| Entidad | Descripción |
|---------|-------------|
| **User** | Cuenta. Incluye rol (`USER`/`MODERATOR`/`ADMIN`) y campos de suscripción Stripe. |
| **Event** | El evento. Tiene `mode` (`GALA`/`TIERLIST`/`PREGUNTAS`/`DIBUJO`), `slug`, `accessKey`, `isPublic`, `status`, `galaDate`, `tags[]` y campos de DIBUJO (`drawingPrompt`, `drawingPhase`, `drawingDeadline`, `votingDeadline`, `drawingTimeLimit`). |
| **Participant** | Nominado de un evento (nombre + imagen). Usado por GALA y TIERLIST. |
| **Poll** / **Option** | Categoría de votación (GALA) y vínculo Participant↔Poll. `votingType`: `SINGLE`/`MULTIPLE`/`LIMITED_MULTIPLE`. |
| **Vote** / **VoteOption** | Voto (papeleta GALA) y sus opciones. Voto anónimo por `voterHash`. |
| **TierlistTier** / **TierlistVote** / **TierlistVoteEntry** | Modo TIERLIST: tiers, voto y asignación nominado→tier. |
| **Question** / **QuestionOption** / **QuestionAnswer** | Modo PREGUNTAS: formulario (CHECKBOX/RADIO) y respuestas. |
| **DrawingSubmission** / **DrawingReaction** | Modo DIBUJO: dibujos (en Vercel Blob) y reacciones (LIKE/DISLIKE/SUPERLIKE). |
| **EventLike** / **EventVote** | Like y voto (±1) sobre el evento en el explorador público. |
| **EventCollaborator** / **CollaboratorInvitation** | Colaboración en equipo con permisos. |
| **SubscriptionPlan** | Definición de planes (límites por modo, precio, stripePriceId, features) — editable desde admin. |
| **Report**, **ModerationLog**, **SupportChat**, **Notification**, **Raffle**, **AnnouncementBar**, **PromotionConfig** | Moderación, soporte, sorteos y marketing. |

## Planes (tiers)

| Plan | Eventos | Categorías/ev | Nominados/ev | Colaboradores/ev |
|------|---------|---------------|--------------|-------------------|
| Free | 1 | 5 | 12 | 0 |
| Premium | 5 | 10 | 30 | 1 |
| Plus | 10 | 15 | 50 | 5 |
| Unlimited | 20 | 30 | 100 | 15 |
| Enterprise | 150 | 50 | 1000 | 30 |

Cada plan tiene además **límites por modo** (tiers/opciones de tierlist, preguntas/opciones,
eventos de dibujo y tiempos). Todos se almacenan en `SubscriptionPlan` y se gestionan desde
`/admin/plans`. Ver [billing-plans.md](../04-subsystems/billing-plans.md) y
[event-modes.md](../04-subsystems/event-modes.md).

## Ciclo de vida de una votación

1. El organizador crea el evento (nace como `DRAFT`).
2. Añade categorías y nominados (con límites según su plan).
3. Publica / lo hace público (aparece en `/polls` si `isPublic`).
4. La audiencia vota (anónimo por `voterHash` o autenticado).
5. En modo Gala, los resultados se sellan hasta `galaDate` y se revelan en directo.

> Para el detalle exhaustivo de cada subsistema (auth, voto anónimo, stats, colaboración,
> soporte, admin…), ver la [referencia completa heredada](./full-reference.md).
