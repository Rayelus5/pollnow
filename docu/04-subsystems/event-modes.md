---
title: Modos de evento (Gala, Tierlist, Preguntas, Dibujo)
updated: 2026-09-30
---

# Modos de evento

Desde v3.0 un evento tiene un **modo** (`Event.mode`, enum `EventMode`) que define su flujo de
votación, su panel de gestión y sus límites por plan. El modo se elige al crear el evento
(`CreateEventButton.tsx`, paso 1) y es inmutable después.

| Modo | Descripción | Público | Resultados |
|------|-------------|---------|------------|
| `GALA` | Formato original: categorías (Poll) y nominados. | Sí | Sellados hasta `galaDate` |
| `TIERLIST` | Un único tema; tiers renombrables; nominados en cards cuadradas que el votante arrastra. | Sí | Tierlist de consenso tras `galaDate` |
| `PREGUNTAS` | Formulario tipo test, solo CHECKBOX y RADIO (sin texto libre); multipágina. | Sí (desaparece de la comunidad al cerrar) | **Privados** (solo el creador, en sus estadísticas) |
| `DIBUJO` | Estilo Gartic Phone: dibujar → votar → resultados. PREMIUM+. | ❌ Siempre privado | Top 100 por puntos |

## Modelos (Prisma)

- **TIERLIST**: `TierlistTier` (label editable + color + orden), `TierlistVote` (1 por
  `eventId`+`voterHash`), `TierlistVoteEntry` (asigna cada `Participant` a un tier). Reutiliza
  `Participant` como "nominados".
- **PREGUNTAS**: `Question` (texto, `type` CHECKBOX/RADIO, `isRequired`, `pageIndex`),
  `QuestionOption`, `QuestionAnswer` (dedup por `questionId`+`optionId`+`voterHash`).
- **DIBUJO** (campos en `Event`: `drawingPrompt`, `drawingTimeLimit`, `drawingPhase`,
  `drawingDeadline`, `votingDeadline`): `DrawingSubmission` (1 por votante; `imageUrl`+`blobKey`,
  `score` denormalizado, contadores, `impressions`) y `DrawingReaction` (enum `ReactionType`).

Todos cuelgan de `Event` con `onDelete: Cascade`. Ver entidades en
[overview](../01-overview/README.md).

## Límites por plan

Viven en `SubscriptionPlan.limits` (JSON) con fallback en `src/lib/plans.ts`; resueltos en
servidor por `getPlanFromUser`. Ver [billing-plans.md](./billing-plans.md).

| Plan | TL tiers / opts | PQ preguntas / opts / pág | DIBUJO eventos / min / max / ∞ |
|------|------|------|------|
| Free | 5 / 10 | 8 / 5 / 4 | 0 / — / — / ❌ |
| Premium | 10 / 20 | 15 / 10 / 15 | 1 / 10s / 180s / ❌ |
| Plus | 15 / 35 | 30 / 20 / 30 | 3 / 10s / ∞ / ✅ |
| Unlimited | 25 / 80 | 50 / 30 / 50 | 8 / 10s / ∞ / ✅ |
| Enterprise | 50 / 120 | 70 / 50 / 70 | 15 / 10s / ∞ / ✅ |

Helpers de negocio en `src/lib/event-modes.ts`: `canCreateDrawingEvent`, `clampDrawingTime`,
`computeDrawingPhase`, `checkTierlist*`, `checkPreguntas*` y `REACTION_POINTS`.

## Modo DIBUJO en detalle

**3 fases** controladas por fecha: `DRAWING` → (`drawingDeadline`) → `VOTING` →
(`votingDeadline`) → `RESULTS`. La fase **efectiva** se calcula en cada carga de `/e/[slug]`
(`computeDrawingPhase`, página `force-dynamic`) y se persiste best-effort; el cron
`/api/cron/drawing-phases` es solo respaldo (no depende de su frecuencia).

**Lienzo** (`src/components/DrawingCanvas.tsx`): HTML5 puro, sin librería externa. Pincel,
goma, bote (flood-fill), línea, rect/círculo (trazo y relleno), cuentagotas; 5 grosores,
opacidad, color picker + recientes, deshacer/rehacer (stack de 30), cursor custom que escala
con el grosor, barra de herramientas reposicionable (arriba/abajo). Exporta PNG.

**Votación (escala 50k–100k):** galería por lotes de ~20 priorizando los menos vistos
(índice `[eventId, impressions]`) y barajados, excluyendo los ya vistos y el propio dibujo.
Reacciones con score denormalizado y atómico:

| Reacción | Puntos | Regla |
|----------|--------|-------|
| LIKE | +100 | una por dibujo/votante |
| DISLIKE | −100 | una por dibujo/votante |
| SUPERLIKE | +300 | **máx. 1 por evento y votante** |

**Resultados:** top 100 por `score` (índice `[eventId, score]`) con podio + galería; confeti.

## Almacenamiento e imágenes de nominados (Vercel Blob + optimización WebP)

Los dibujos y **todas** las imágenes de nominados (Manual, IA y "Buscar en internet") se
guardan en **Vercel Blob** bajo `events/{eventId}/...`, no en la BD. Antes de este cambio, los modos
Manual e IA guardaban la imagen como **base64 directamente en `Participant.imageUrl`**, lo que
inflaba el HTML servido en cada carga de las páginas de voto (`force-dynamic`, sin caché) y
disparaba el "Fast Origin Transfer" de Vercel con tráfico alto. Ahora los 3 modos pasan
por el mismo pipeline de optimización antes de subir a Blob.

- `src/lib/participant-image.ts` — capa única de optimización + subida para nominados:
  `optimizeToWebp` (sharp: resize máx. 800px + WebP calidad 82, respetando orientación EXIF),
  `storeParticipantImage` (sube el resultado a Blob, cache 1 año ya que la key es un uuid
  único) y `replaceParticipantImage` (sube la nueva y borra la anterior si era un blob).
- `src/lib/drawing-storage.ts` — equivalente para dibujos: `putDrawing`, `deleteDrawing`
  (acepta lote), `isBlobUrl`.
- `src/lib/blob-cleanup.ts` — al borrar evento/usuario se recogen las URLs **antes** del
  cascade y se borran los blobs (best-effort). Cubre `deleteEvent` (dashboard-actions y
  event-actions), `deleteUser` y `/api/admin/users/batch`.
- **Cron GC** `/api/cron/blob-gc` (red de seguridad): borra blobs cuyo `eventId` ya no existe.

Requiere `BLOB_READ_WRITE_TOKEN` (ver [environments.md](../07-infrastructure/environments.md)).

### Los 3 modos de subida de imagen del nominado

- **Manual**: `POST /api/participant-image/upload` (multipart, nodejs runtime) — recibe el
  `File` elegido en `ParticipantList.tsx`, lo optimiza y sube con `storeParticipantImage`.
  Sustituye al antiguo `FileReader.readAsDataURL` (base64 en BD).
- **IA**: `POST /api/generate-image` genera la imagen (Pollinations) y, en vez de devolver un
  data-URI, la optimiza y sube a Blob del `eventId` recibido (requiere sesión + permiso
  `canManageNominees` sobre ese evento) antes de devolver la URL al cliente.
- **Buscar en internet**: `ParticipantList.tsx` agrega **Pexels** (`PEXELS_API_KEY`) +
  **Wikimedia Commons** (sin clave) vía `src/lib/image-search.ts`, hasta 20 resultados (5
  visibles, "mostrar más" de 5 en 5). Al elegir una, `POST /api/participant-image/rehost`
  (whitelist anti-SSRF) descarga, optimiza y re-aloja en Blob.

### Presentación: `next/image`

`src/components/ui/ImageWithSkeleton.tsx` usa `next/image` (`fill` + `sizes`) en vez de un
`<img>` plano, con skeleton/fade-in propio. Esto activa `srcset` responsivo, negociación
automática AVIF/WebP y caché en el edge de Vercel Image Optimization (no cuenta como "Fast
Origin Transfer", a diferencia del HTML generado por SSR). El dominio de Blob
(`*.public.blob.vercel-storage.com`) está whitelisted en `next.config.ts`
(`images.remotePatterns`). Las imágenes legacy en base64 (`data:...`) se siguen sirviendo con
`unoptimized` para no romper el render mientras no se hayan migrado.

### Migración de imágenes legacy (herramienta de admin)

En `/dashboard/event/[id]` → pestaña **Nominados**, los usuarios con `role === "ADMIN"` ven un
botón **"Optimizar todas las imágenes"**. Detecta los nominados cuya imagen no sea ya un blob
WebP (base64, URL externa o blob antiguo sin comprimir) y llama, con concurrencia limitada (3
a la vez), a `POST /api/dashboard/event/[id]/participants/[participantId]/optimize-image`, que
descodifica/descarga la imagen actual, la re-optimiza con `replaceParticipantImage` (borrando
el blob anterior) y actualiza `Participant.imageUrl`. Pensado para migrar en caliente eventos
creados antes de esta optimización (p. ej. tras un pico de tráfico de un evento en directo).

## Nominados: gestión y orden (v3.2)

`ParticipantList.tsx` (pestaña "Nominados" del dashboard): grid de **8 por página**, popups de
crear (alta múltiple) y editar (con flechas ‹ › que recorren toda la lista filtrada), borrado
masivo multi-página y **reordenado arrastrando** con `@dnd-kit` (`rectSortingStrategy` +
`DragOverlay`). El orden se persiste en `Participant.order` y todas las lecturas
(`dashboard/event/[id]`, `e/[slug]` TIERLIST, `stats-actions`) ordenan por
`[{ order: asc }, { createdAt: asc }, { id: asc }]` (estable). La votación tierlist
(`TierlistVotingClient.tsx`) también usa `@dnd-kit` en modo multi-contenedor (bandeja ↔ tiers).
Ver [convenciones de DnD](../../DESIGN.md#16-drag-and-drop) y [v3.2](../10-changelog/v3.2.md).

## APIs

Ver límites en [rate-limiting.md](../05-api/rate-limiting.md).

```
POST /api/tierlist-votes              voto tierlist (1 por evento+votante)
POST /api/preguntas-votes             respuestas del formulario (transacción)
POST /api/drawing/upload              sube PNG a Blob → DrawingSubmission (fase DRAWING)
GET  /api/drawing/batch               lote de ~20 dibujos a votar (+impressions)
POST /api/drawing/react               LIKE/DISLIKE/SUPERLIKE (score atómico)
GET  /api/drawing/results             top 100 por score
GET  /api/search-images               Pexels + Wikimedia (auth)
POST /api/participant-image/rehost    re-aloja imagen elegida en Blob
GET  /api/cron/drawing-phases         avance de fase por fecha (CRON_SECRET)
GET  /api/cron/blob-gc                limpieza de blobs huérfanos (CRON_SECRET)
```

## Estadísticas por modo

`getModeStats()` (`src/app/lib/stats-actions.ts`) + `ModeStatistics.tsx`: TIERLIST (tier más
votado por nominado), PREGUNTAS (% por opción, privado), DIBUJO (KPIs + top dibujos). GALA
mantiene `EventStatistics`.

Desde v3.2, los modos TIERLIST / PREGUNTAS / DIBUJO incluyen **trazabilidad de votantes**
(quién votó qué) cuando el evento no es de voto anónimo y quien consulta tiene permiso. Los
modelos guardan `userId` (no relación directa), así que `getModeStats` los resuelve aparte vía
`buildVoterResolver`.
