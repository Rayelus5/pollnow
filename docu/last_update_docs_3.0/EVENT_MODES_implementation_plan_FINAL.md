# Pollnow v3.0 — Modos de Eventos (TIERLIST · PREGUNTAS · DIBUJO)

## Context

Hoy Pollnow solo tiene un formato de evento (estilo gala/GameAwards), implícito: el modelo `Event` no
tiene campo de tipo y todo el flujo (`/e/[slug]`, votos por `Poll`/`Option`, dashboard) asume ese único
formato. La v3.0 añade **3 modos nuevos** junto al GALA existente, cada uno con su propio flujo de
votación pública, su panel de gestión y sus límites por plan:

- **TIERLIST** — un único tema por evento; tiers renombrables (no fijos S/A/B…); nominados con imagen
  (reutiliza generación IA); cards **cuadradas**; el votante arrastra nominados a tiers.
- **PREGUNTAS** — tipo Google Form, **solo CHECKBOX y RADIO** (sin texto libre, pese a que un mockup lo
  insinúa — el requisito escrito manda); multipágina; **resultados privados** (solo el creador).
- **DIBUJO** — solo PREMIUM+; inspirado en Gartic Phone; 3 fases (DIBUJO → VOTACIÓN → RESULTADOS);
  lienzo HTML5 propio; pensado para 50k–100k participaciones; **siempre privado**.

**Decisiones cerradas con el usuario:**
- **Almacenamiento de dibujos: Vercel Blob**, detrás de una capa de abstracción (`src/lib/drawing-storage.ts`)
  para poder migrar a R2/S3 después sin tocar el resto. El usuario añade las env vars manualmente.
- **Votación DIBUJO por reacciones**: `LIKE = +100`, `DISLIKE = -100`, `SUPERLIKE = +300` (equivale a 3 likes;
  **1 superlike por evento y usuario**). El ranking final son los 100 dibujos con mayor score.
- DIBUJO nunca es público; PREGUNTAS puede publicarse pero desaparece de la comunidad al cerrar y sus
  resultados son privados; el creador fija el tema y las fechas de cierre de cada fase de DIBUJO.

> Este es el plan de **diseño/arquitectura** de la ampliación. La implementación se hará por fases.

---

## Estado actual relevante (anclado al código)

- **Sin campo `mode`**: `Event` en `prisma/schema.prisma` (PostgreSQL/Neon → migrar con `npx prisma db push`,
  nunca `migrate`). Tiene `slug`, `accessKey`, `isPublic`, `status` (DRAFT/PENDING/APPROVED/DENIED), `galaDate`.
- **Voto GALA**: `POST /api/polls/[id]/vote` (no server action). `voterHash` = cookie `voter_id` (UUID puesta en
  `src/middleware.ts`). Dedup por `@@unique([pollId, voterHash])`. Rate limit Upstash en `src/lib/rate-limit-redis.ts`.
- **Página pública**: `src/app/e/[slug]/page.tsx` (`force-dynamic`) → lobby; gating por `galaDate`; resultados en
  `src/app/e/[slug]/results/`. Privado: exige `?key=accessKey`.
- **Límites de plan en 4 sitios que hay que ampliar**: tipo `PlanLimits` en `src/lib/plans.ts` (+ `PLANS` fallback),
  `mapRow` en `src/lib/user-plan.ts`, `PlanLimitsInput` en `src/app/lib/plan-actions.ts`, y el formulario admin
  `src/components/admin/AdminPlansManager.tsx`. Fuente de verdad real: `SubscriptionPlan.limits` (JSON en BD).
- **Dashboard del evento**: `src/app/dashboard/event/[id]/page.tsx` compone `EventTabs.tsx` (tabs fijos:
  settings/participants/polls/stats/team). `PollList.tsx` ya usa `@hello-pangea/dnd` (drag&drop, v18, instalado).
  `ParticipantList.tsx` genera imágenes IA vía `POST /api/generate-image` (Pollinations, devuelve data-URI base64).
- **Crear evento**: `createEvent` en `src/app/lib/dashboard-actions.ts` (acepta title/description/tags; enforce `quota`).
- **`@vercel/blob` NO está instalado** → añadir dependencia.

---

## Fase 0 — Almacenamiento de dibujos (Vercel Blob, abstraído)

- `npm i @vercel/blob`. Env var (la añade el usuario): `BLOB_READ_WRITE_TOKEN`.
- **[NEW] `src/lib/drawing-storage.ts`** — única superficie de almacenamiento:
  ```ts
  export async function putDrawing(buf: Buffer, key: string): Promise<{ url: string; key: string }>
  export async function deleteDrawing(key: string): Promise<void>
  ```
  Implementado con `put(key, buf, { access: "public", contentType: "image/png" })` de `@vercel/blob`.
  Toda la app usa esta API; migrar a R2/S3 luego = reescribir solo este archivo.
- Optimización para no disparar el volumen: el canvas exporta PNG a resolución acotada (p.ej. 1024×768) y, si
  procede, comprimido; nombrado `events/{eventId}/drawings/{submissionId}.png`. Guardamos `imageUrl` + `blobKey`.

---

## Fase 1 — Schema Prisma (`prisma/schema.prisma`)

Enums nuevos:
```prisma
enum EventMode    { GALA  TIERLIST  PREGUNTAS  DIBUJO }
enum DrawingPhase { DRAWING  VOTING  RESULTS }
enum QuestionType { CHECKBOX  RADIO }
enum ReactionType { LIKE  DISLIKE  SUPERLIKE }
```

En `model Event` (campos nuevos; los de DIBUJO solo se usan cuando `mode = DIBUJO`):
```prisma
mode             EventMode     @default(GALA)
drawingPrompt    String?       @db.VarChar(500)   // tema visible a participantes
drawingTimeLimit Int?          // segundos por participante (null = sin límite)
drawingPhase     DrawingPhase? // null salvo DIBUJO
drawingDeadline  DateTime?     // fin fase dibujo  → pasa a VOTING
votingDeadline   DateTime?     // fin fase votación → pasa a RESULTS
// relaciones nuevas
tiers         TierlistTier[]
tierlistVotes TierlistVote[]
questions     Question[]
drawings      DrawingSubmission[]
```

Modelos nuevos (resumen; cascada `onDelete: Cascade` desde `Event`):
- **TIERLIST** — reutiliza `Participant` como "nominados" (render cuadrado por modo):
  - `TierlistTier { id, eventId, label @db.VarChar(50), color, order, @@index([eventId]) }`
  - `TierlistVote { id, eventId, voterHash, userId?, createdAt, @@unique([eventId, voterHash]) }`
  - `TierlistVoteEntry { id, voteId, tierId, participantId, @@unique([voteId, participantId]) }`
- **PREGUNTAS**:
  - `Question { id, eventId, text @db.VarChar(300), description? @db.VarChar(500), type QuestionType, pageIndex, order, isRequired, @@index([eventId]) }`
  - `QuestionOption { id, questionId, text @db.VarChar(200), order, @@index([questionId]) }`
  - `QuestionAnswer { id, eventId, questionId, optionId, voterHash, userId?, createdAt, @@unique([questionId, optionId, voterHash]), @@index([questionId]) }`
- **DIBUJO** (diseñado para 100k filas):
  - `DrawingSubmission { id, eventId, voterHash, userId?, imageUrl @db.Text, blobKey @db.Text, score Int @default(0), likeCount Int @default(0), dislikeCount Int @default(0), superlikeCount Int @default(0), impressions Int @default(0), createdAt, @@unique([eventId, voterHash]), @@index([eventId, score]), @@index([eventId, impressions]) }`
  - `DrawingReaction { id, submissionId, eventId, voterHash, userId?, type ReactionType, createdAt, @@unique([submissionId, voterHash]), @@index([submissionId]), @@index([eventId, voterHash]) }`

`score` se mantiene **denormalizado** (no se recalcula desde votos): cada reacción lo actualiza atómicamente.
El índice `[eventId, score]` hace el top-100 trivial; `[eventId, impressions]` permite reparto justo de exposición.

Aplicar con `npx prisma db push` (memoria del proyecto: nada de `migrate`).

---

## Fase 2 — Límites de plan (4 archivos + admin UI)

Ampliar `PlanLimits` (en `src/lib/plans.ts`) y reflejarlo en `PLANS`, en `mapRow` de `user-plan.ts`
(con fallback `num(...)`), en `PlanLimitsInput` de `plan-actions.ts` y en los inputs de `AdminPlansManager.tsx`:
```ts
// TIERLIST
tierlistMaxTiers: number; tierlistMaxOptions: number;
// PREGUNTAS
preguntasMaxQuestions: number; preguntasMaxOptions: number; preguntasMaxPerPage: number;
// DIBUJO
drawingMaxEvents: number;            // 0 = no puede crear DIBUJO
drawingMinTimeSecs: number | null;   // null = no aplica
drawingMaxTimeSecs: number | null;   // null = sin tope (ilimitado permitido)
drawingAllowUnlimited: boolean;
```

| Plan | TL tiers | TL opts | PQ máx | PQ opts | PQ/pág | DRW eventos | DRW min | DRW max | DRW ∞ |
|---|---|---|---|---|---|---|---|---|---|
| FREE | 5 | 10 | 8 | 5 | 4 | 0 | — | — | ❌ |
| PREMIUM | 10 | 20 | 15 | 10 | 15 | 1 | 10s | 180s | ❌ |
| PLUS | 15 | 35 | 30 | 20 | 30 | 3 | 10s | null | ✅ |
| UNLIMITED | 25 | 80 | 50 | 30 | 50 | 8 | 10s | null | ✅ |
| ENTERPRISE | 50 | 120 | 70 | 50 | 70 | 15 | 10s | null | ✅ |

**[NEW] `src/lib/event-modes.ts`** — helpers reutilizables de negocio:
`assertCanCreateDrawingEvent(userId, plan)` (cuenta `Event where mode=DIBUJO & userId` vs `drawingMaxEvents`),
`clampDrawingTime(secs, plan)`, `checkTierlistLimits(...)`, `checkPreguntasLimits(...)`, `computeDrawingPhase(event, now)`.

---

## Fase 3 — Crear evento con selector de modo

- **[MODIFY] `CreateEventButton.tsx`** → flujo en 2 pasos. Paso 1: 4 cards (GALA 🏆 / TIERLIST 📋 / PREGUNTAS ❓ /
  DIBUJO 🎨). Si el plan no permite DIBUJO (`drawingMaxEvents===0` o ya en el tope) → card bloqueada con upsell
  inline (mismo patrón que el modal de cuota actual). Paso 2: form estándar + extras de DIBUJO (tema, `drawingDeadline`,
  `votingDeadline`, tiempo por participante con toggle "sin límite" solo si `drawingAllowUnlimited`).
- **[MODIFY] `createEvent` (`dashboard-actions.ts`)** → acepta `mode` y campos DIBUJO. Para DIBUJO: valida PREMIUM+,
  `assertCanCreateDrawingEvent`, fuerza `isPublic=false`, fija `drawingPhase=DRAWING`, valida fechas (drawing < voting),
  clampa tiempo al rango del plan. Mantiene la comprobación de `quota` global existente.

---

## Fase 4 — Dashboard de gestión por modo

- **[MODIFY] `EventTabs.tsx` + `dashboard/event/[id]/page.tsx`** → tabs condicionales por `event.mode`:

  | Tab | GALA | TIERLIST | PREGUNTAS | DIBUJO |
  |---|---|---|---|---|
  | Categorías (`PollList`) | ✅ | — | — | — |
  | Nominados (`ParticipantList`) | ✅ | ✅ (cuadrado) | — | — |
  | Tiers (`TierlistManager`) | — | ✅ | — | — |
  | Preguntas (`QuestionManager`) | — | — | ✅ | — |
  | Dibujo (`DrawingConfig`) | — | — | — | ✅ |
  | Ajustes / Stats / Equipo | ✅ | ✅ | ✅ | ✅ |

- **[NEW] `TierlistManager.tsx`** — CRUD de tiers (label editable, color, orden con `@hello-pangea/dnd`), contador `X/límite`.
- **[NEW] `QuestionManager.tsx`** — CRUD preguntas (texto, descripción, tipo CHECKBOX/RADIO, `isRequired`, `pageIndex`),
  CRUD de opciones por pregunta con límite visible, reordenar con drag&drop.
- **[NEW] `DrawingConfig.tsx`** — badge de fase actual, tema (editable solo en DRAWING), `drawingDeadline`/`votingDeadline`,
  tiempo por participante (toggle/slider según plan), stats (nº dibujos, nº reacciones), botón de avance manual de fase (owner).
- **[MODIFY] `ParticipantList.tsx`** — prop `square` para render 1:1 en TIERLIST; limita por `tierlistMaxOptions` cuando aplica.
- **[MODIFY] `EventSettings.tsx`** — oculta/bloquea `isPublic` cuando `mode=DIBUJO`; en PREGUNTAS muestra aviso
  "resultados privados". Los managers reutilizan los patrones de server actions de `event-actions.ts`.

---

## Fase 5 — Lienzo de dibujo

**[NEW] `src/components/DrawingCanvas.tsx`** — HTML5 Canvas puro (sin librería de pago), client-only. Según el mockup
`Event_DIBUJO_mode_complete_test.jpg`:
- Modos de puntero: `pencil` · `eraser` · `fill` (cubo, flood-fill) · `line` · `rect`/`rect-fill` · `circle`/`circle-fill` · `eyedropper`.
- Grosor: 5 tamaños (p.ej. 2/5/10/20/40 px) con preview circular. **Opacidad**: slider → `ctx.globalAlpha`.
- Color: `<input type="color">` + input HEX sincronizados; **colores recientes** (máx 6 en estado).
- **Deshacer/Rehacer**: stack de `ImageData` (máx ~30). Eventos táctiles mapeados a mouse para móvil.
- Export: `canvas.toBlob("image/png")` → `FormData` → `POST /api/drawing/upload`.

---

## Fase 6 — Votación pública por modo

- **[MODIFY] `e/[slug]/page.tsx`** → `switch(event.mode)`: GALA mantiene `HomeHero`; el resto renderiza su client.
  Para DIBUJO se calcula la **fase efectiva** en cada request (`computeDrawingPhase`: compara `now` con
  `drawingDeadline`/`votingDeadline`) y se persiste de forma best-effort — así no dependemos de la frecuencia del cron.
- **[NEW] `TierlistVotingClient.tsx`** — header (título=tema), bandeja inferior de nominados cuadrados arrastrables,
  filas de tiers (label coloreada + zona drop) con `@hello-pangea/dnd`; "Registrar voto" → `POST /api/tierlist-votes`;
  card de confirmación (localStorage `voted_*` como en GALA).
- **[NEW] `PreguntasVotingClient.tsx`** — paginación por `pageIndex`; cada pregunta con checkbox o radio custom;
  valida obligatorias antes de avanzar; "Enviar" → `POST /api/preguntas-votes` (transacción). Visible mientras
  `galaDate > now`; tras cierre, deja de aparecer en la comunidad.
- **[NEW] `DrawingVotingClient.tsx`** — 3 fases:
  - **DRAWING**: muestra `drawingPrompt`, countdown (`drawingTimeLimit` o hasta `drawingDeadline`), `<DrawingCanvas/>`,
    "Enviar dibujo" → upload a Blob + crea `DrawingSubmission` (1 por `voterHash`).
  - **VOTING**: galería por **lotes de ~20** que excluye los ya vistos y el dibujo propio; cada card con
    👍 / 👎 / ⭐ (superlike, deshabilitado tras gastarlo). Countdown hasta `votingDeadline`.
  - **RESULTS**: top 100 por `score`, podio top 3 + galería masonry; aviso si hay >100.

---

## Fase 7 — APIs REST nuevas

```
POST  /api/tierlist-votes              registra voto tierlist (1 por eventId+voterHash, valida tiers/nominados)
GET   /api/tierlist-votes/results      agregado: distribución por tier de cada nominado
POST  /api/preguntas-votes             registra respuestas (transacción Prisma; valida límites/obligatorias)
GET   /api/preguntas-votes/results     conteo y % por opción — SOLO owner (auth/accessKey server-side)
POST  /api/drawing/upload              multipart PNG → Blob → DrawingSubmission (rate limit; 1 por voterHash)
GET   /api/drawing/batch               ~20 dibujos por exposición (ver abajo); +impressions; excluye vistos y propio
POST  /api/drawing/react               crea DrawingReaction + actualiza score/contadores atómicamente
GET   /api/drawing/results             top 100 por score DESC
GET   /api/cron/drawing-phases         backup diario de transición de fase (protegido con CRON_SECRET)
```

**Reacciones / scoring (`/api/drawing/react`)** — todo en una transacción:
1. Si `type=SUPERLIKE`: contar `DrawingReaction` del votante en el evento con `type=SUPERLIKE`; si ≥1 → 409.
2. Crear la reacción (el `@@unique([submissionId, voterHash])` impide reaccionar dos veces al mismo dibujo).
3. `UPDATE DrawingSubmission SET score = score + Δ, {like|dislike|superlike}Count += 1` donde
   `Δ = +100 (LIKE) | -100 (DISLIKE) | +300 (SUPERLIKE)`. Incremento atómico (`prisma.$executeRaw` o `update` con `increment`).

**Batch escalable a 100k (`/api/drawing/batch`)** — exposición justa sin full-scan caro:
`SELECT id, "imageUrl" FROM "DrawingSubmission" WHERE "eventId"=$1 AND "voterHash" <> $self AND id <> ALL($seen)
ORDER BY impressions ASC, random() LIMIT 20`, luego `UPDATE ... SET impressions = impressions + 1 WHERE id = ANY(servidos)`.
El cliente envía los `seen` ids de su sesión (capados); el orden por `impressions` reparte vistas de forma pareja para que
el ranking por likes/dislikes sea representativo. El votante ve los lotes que quiera y para cuando quiera.

Aplicar `rateLimit(...)` (patrón `src/lib/rate-limit-redis.ts`) a `upload` y `react`. `voterHash` desde cookie `voter_id`.

---

## Fase 8 — Resultados por modo

- **[MODIFY] `e/[slug]/results/page.tsx`** → routing por `mode`.
- **[NEW] `TierlistResultsClient.tsx`** — "tierlist media" (tier mayoritario por nominado) + barras de distribución.
- **[NEW] `PreguntasResultsClient.tsx`** — accesible **solo al owner** (verificación server-side); barra de % por opción.
- **[NEW] `DrawingResultsClient.tsx`** — podio top 3 + galería masonry top 100, con score visible.

---

## Fase 9 — Comunidad (`/polls`) y Admin

- **[MODIFY] `src/app/polls/page.tsx`** — filtros por modo (iconos GALA/TIERLIST/PREGUNTAS; **DIBUJO nunca se lista**),
  badge de modo en las cards. PREGUNTAS desaparece cuando `galaDate < now` (misma regla que GALA). Excluir DIBUJO del `where`.
- **[MODIFY] `admin/events` (`AdminEventsTableClient.tsx`)** — columna "Modo" + filtro por modo.

---

## Fase 10 — Cron de fases (backup) y migración

- **[NEW] `src/app/api/cron/drawing-phases/route.ts`** — protegido con `CRON_SECRET` (patrón de `expire-subscriptions`):
  DRAWING→VOTING si `drawingDeadline<now`; VOTING→RESULTS si `votingDeadline<now`. Es **respaldo**: la transición real
  ocurre lazy al cargar `/e/[slug]` (`force-dynamic`), por lo que funciona aunque el cron sea solo diario (límite del plan Vercel).
- **[MODIFY] `vercel.json`** — añadir cron diario `/api/cron/drawing-phases`.
- **[MODIFY] `MIGRATION_GUIDE_v3.0.md`** — documentar `BLOB_READ_WRITE_TOKEN`, nuevos modelos y `db push`.
- Tras los cambios de schema/API/planes, ejecutar el agente **docs-maintainer** para sincronizar `/docu` y README.

---

## Orden de implementación sugerido

1. Fase 0 (Blob) + Fase 1 (schema, `db push`) + Fase 2 (límites). Base sin la cual nada compila.
2. Fase 3 (crear con modo) + Fase 4 (dashboard por modo).
3. Fase 5 (canvas) — paralelizable con Fase 4.
4. Fase 6 (voting clients) + Fase 7 (APIs).
5. Fase 8 (resultados) + Fase 9 (polls/admin) + Fase 10 (cron/migración/docs).

---

## Verification

**Automático**
- `npx prisma db push` sin errores tras Fase 1 (NUNCA `migrate` — drift en Neon).
- `npm run build` (TypeScript) verde tras cada fase.
- Tests unitarios de `event-modes.ts`: `checkTierlistLimits`, `clampDrawingTime`, `assertCanCreateDrawingEvent`,
  `computeDrawingPhase`.

**Manual (end-to-end, con `/run` o navegador)**
- TIERLIST: crear como FREE → respeta 5 tiers / 10 nominados; votar con drag&drop en desktop y móvil; ver resultados.
- PREGUNTAS: form multipágina, validar obligatorias; **resultados inaccesibles sin ser owner**; desaparece de `/polls` al cerrar.
- DIBUJO: FREE no puede crearlo (upsell); PREMIUM no puede poner tiempo ilimitado y solo 1 evento; flujo completo
  dibujar → subir a Blob → reaccionar (👍/👎/⭐) → **solo 1 superlike por evento** → top 100 ordenado por score.
- Verificar que eventos DIBUJO **nunca** aparecen en `/polls` y son siempre privados.
- Sanidad de score: 2 likes + 1 superlike − 1 dislike = `200 + 300 − 100 = 400`.
