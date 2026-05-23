# Plan de Implementación — Pollnow v3.0: Modos de Eventos

## Objetivo

Añadir soporte para 4 modos de evento distintos: **GALA** (ya existe), **TIERLIST**, **PREGUNTAS** y **DIBUJO**. Cada modo tiene su propio flujo de votación para el participante, su propio panel de configuración para el creador, y sus propios límites por plan de suscripción.

---

## Contexto y estado actual

- El modelo `Event` no tiene campo `mode` — todos los eventos son implícitamente GALA.
- Los límites del plan viven en `SubscriptionPlan.limits` (JSON) y en el fallback `src/lib/plans.ts`.
- Los flujos de votación pública viven en `/e/[slug]` → `VotingForm.tsx`, `ResultsClient.tsx`, `CompletedView.tsx`.
- El dashboard de gestión vive en `/dashboard/event/[id]` → `DashboardTabs.tsx`, `PollList.tsx`, `ParticipantList.tsx`, `EventSettings.tsx`.
- La creación de eventos se hace en `CreateEventButton.tsx` → server action `createEvent`.

---

## Open Questions

> [!IMPORTANT]
> **Texto del prompt de dibujo**: En modo DIBUJO, ¿el creador define un "tema" (prompt textual) que se muestra a los participantes mientras dibujan? ¿O el lienzo es completamente libre? (Asumo que sí hay un tema configurable, como en Gartic Phone.)

> [!IMPORTANT]
> **Votación en DIBUJO**: Con 50k–100k dibujos, un sistema de "galería completa" no es viable. El plan propone **votación por lotes aleatorios** (cada votante ve ~20 dibujos y vota el mejor de cada par/grupo). ¿Confirmas este enfoque o prefieres un sistema diferente?

> [!IMPORTANT]
> **Almacenamiento de dibujos**: Los dibujos se guardarán como imágenes PNG exportadas del canvas HTML5. ¿Tienes ya un bucket (Supabase Storage, S3, Cloudflare R2, Vercel Blob) o debo incluir en el plan la elección e integración del servicio de almacenamiento?

> [!IMPORTANT]
> **Resultados de PREGUNTAS**: Las respuestas de checkbox/radio son estadísticas agregadas (¿qué % eligió cada opción?). ¿Los resultados son públicos o solo visibles para el creador del evento?

> [!WARNING]
> **DIBUJO en el panel admin**: Los eventos DIBUJO deben pasar por revisión admin como los demás. ¿Alguna restricción adicional de moderación para los dibujos (moderación de contenido)?

---

## Proposed Changes

### Fase 1 — Fundamentos: Schema, Tipos y Límites

#### [MODIFY] schema.prisma

Añadir el enum `EventMode` y el campo `mode` al modelo `Event`. Añadir modelos nuevos para cada modo.

```prisma
enum EventMode {
  GALA
  TIERLIST
  PREGUNTAS
  DIBUJO
}

// En model Event:
mode  EventMode  @default(GALA)

// Nuevo modelo para TIERLIST
model TierlistTier {
  id       String  @id @default(uuid())
  eventId  String
  label    String  @db.VarChar(50)  // nombre editable del tier (S, A, B, Mi tier...)
  color    String  @default("#6366f1")
  order    Int     @default(0)
  event    Event   @relation(fields: [eventId], references: [id], onDelete: Cascade)
  votes    TierlistVoteEntry[]
  @@index([eventId])
}

// Participante en TIERLIST → reutiliza model Participant existente (con imagen cuadrada)

// Voto de tierlist: el usuario asigna cada participante a un tier
model TierlistVote {
  id         String   @id @default(uuid())
  eventId    String
  voterHash  String
  userId     String?
  createdAt  DateTime @default(now())
  entries    TierlistVoteEntry[]
  event      Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  @@unique([eventId, voterHash])
  @@index([eventId])
}

model TierlistVoteEntry {
  id            String       @id @default(uuid())
  voteId        String
  tierId        String
  participantId String
  vote          TierlistVote @relation(fields: [voteId], references: [id], onDelete: Cascade)
  tier          TierlistTier @relation(fields: [tierId], references: [id], onDelete: Cascade)
  @@unique([voteId, participantId])
}

// PREGUNTAS
model Question {
  id          String         @id @default(uuid())
  eventId     String
  text        String         @db.VarChar(300)
  description String?        @db.VarChar(500)
  type        QuestionType   // CHECKBOX | RADIO
  pageIndex   Int            @default(0)  // para paginación multi-página
  order       Int            @default(0)
  event       Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  options     QuestionOption[]
  answers     QuestionAnswer[]
  @@index([eventId])
}

enum QuestionType { CHECKBOX RADIO }

model QuestionOption {
  id         String   @id @default(uuid())
  questionId String
  text       String   @db.VarChar(200)
  order      Int      @default(0)
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  answers    QuestionAnswer[]
  @@index([questionId])
}

// Una respuesta es: un usuario/voterHash eligió esta opción para esta pregunta
model QuestionAnswer {
  id         String         @id @default(uuid())
  eventId    String
  questionId String
  optionId   String
  voterHash  String
  userId     String?
  createdAt  DateTime       @default(now())
  question   Question       @relation(fields: [questionId], references: [id], onDelete: Cascade)
  option     QuestionOption @relation(fields: [optionId], references: [id], onDelete: Cascade)
  @@unique([questionId, optionId, voterHash])
  @@index([questionId])
  @@index([voterHash])
}

// DIBUJO
enum DrawingPhase { DRAWING VOTING RESULTS }

// En model Event añadir campos de DIBUJO:
// drawingPrompt     String?   — tema del dibujo
// drawingTimeLimit  Int?      — segundos (null = ilimitado)
// drawingPhase      DrawingPhase @default(DRAWING)
// drawingDeadline   DateTime? — cuándo cierra la fase de dibujo

model DrawingSubmission {
  id          String   @id @default(uuid())
  eventId     String
  voterHash   String
  userId      String?
  imageUrl    String   @db.Text  // URL al bucket de almacenamiento
  score       Int      @default(0)
  createdAt   DateTime @default(now())
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  votes       DrawingVote[]
  @@unique([eventId, voterHash])
  @@index([eventId])
  @@index([score])
}

// Voto a un dibujo concreto (sistema por lotes)
model DrawingVote {
  id           String            @id @default(uuid())
  submissionId String
  voterHash    String
  createdAt    DateTime          @default(now())
  submission   DrawingSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  @@unique([submissionId, voterHash])
  @@index([submissionId])
}
```

---

#### [MODIFY] src/lib/plans.ts + src/lib/user-plan.ts

Ampliar `PlanLimits` con los nuevos campos de modo:

```typescript
export type PlanLimits = {
  // GALA (existentes)
  pollsPerEvent: number;
  participantsPerEvent: number;
  collaboratorsPerEvent: number;
  maxSharedEvents: number;

  // TIERLIST
  tierlistMaxTiers: number;       // máx categorías
  tierlistMaxOptions: number;     // máx nominados

  // PREGUNTAS
  preguntasMaxQuestions: number;  // máx preguntas
  preguntasMaxOptions: number;    // máx opciones por pregunta
  preguntasMaxPerPage: number;    // máx preguntas por página

  // DIBUJO
  drawingMaxEvents: number;       // máx eventos de este tipo (0 = no disponible)
  drawingMinTime: number | null;  // segundos mínimos (null = no disponible)
  drawingMaxTime: number | null;  // segundos máximos (null = ilimitado)
  drawingAllowUnlimited: boolean; // permite tiempo ilimitado
};
```

**Valores por plan:**

| Plan | tierlistTiers | tierlistOptions | pregsMax | pregsOpts | pregsPerPage | drawingMax | drawingMin | drawingMax | drawingUnlimited |
|---|---|---|---|---|---|---|---|---|---|
| FREE | 5 | 10 | 8 | 5 | 4 | 0 | - | - | false |
| PREMIUM | 10 | 20 | 15 | 10 | 15 | 1 | 10s | 180s | false |
| PLUS | 15 | 35 | 30 | 20 | 30 | 3 | 10s | ∞ | true |
| UNLIMITED | 25 | 80 | 50 | 30 | 50 | 8 | 10s | ∞ | true |
| ENTERPRISE | 50 | 120 | 70 | 50 | 70 | 15 | 10s | ∞ | true |

---

#### [NEW] src/lib/event-modes.ts

Helper con la lógica de negocio de modos:

```typescript
// Verifica si el usuario puede crear un evento de tipo DIBUJO
export async function canCreateDrawingEvent(userId: string, plan: ResolvedPlan): Promise<boolean>
// Verifica que los límites de tierlist no se superen
export function checkTierlistLimits(tiersCount: number, optionsCount: number, plan: ResolvedPlan): boolean
// Devuelve el modo de un evento dado su id
export async function getEventMode(eventId: string): Promise<EventMode>
```

---

### Fase 2 — Creación de Evento: Selector de Modo

#### [MODIFY] src/components/dashboard/CreateEventButton.tsx

El modal de creación añade un **paso 1: selector visual de modo** antes del formulario de título/descripción. Cuatro cards con icono, nombre y descripción breve. Si el usuario FREE intenta DIBUJO → upsell inline.

**UX Flow:**
1. Click "Nuevo Evento"
2. Paso 1: Elige el modo (GALA / TIERLIST / PREGUNTAS / DIBUJO)
3. Paso 2: Formulario estándar (título, descripción, tags) + campos específicos del modo si aplica
4. Submit → `createEvent` con `mode` en el FormData

#### [MODIFY] src/app/lib/dashboard-actions.ts

La action `createEvent` acepta el campo `mode` y lo guarda. Para DIBUJO, valida el límite de eventos de este tipo antes de crear.

---

### Fase 3 — Dashboard de Gestión por Modo

El dashboard de evento `/dashboard/event/[id]` debe adaptarse al modo del evento.

#### [MODIFY] src/components/dashboard/EventTabs.tsx

Las pestañas disponibles varían según el modo:

| Tab | GALA | TIERLIST | PREGUNTAS | DIBUJO |
|---|---|---|---|---|
| Categorías/Polls | ✅ | ❌ | ❌ | ❌ |
| Participantes | ✅ | ✅ | ❌ | ❌ |
| Tiers | ❌ | ✅ | ❌ | ❌ |
| Preguntas | ❌ | ❌ | ✅ | ❌ |
| Dibujo Config | ❌ | ❌ | ❌ | ✅ |
| Ajustes | ✅ | ✅ | ✅ | ✅ |
| Estadísticas | ✅ | ✅ | ✅ | ✅ |
| Equipo | ✅ | ✅ | ✅ | ✅ |

#### [NEW] src/components/dashboard/TierlistManager.tsx

Gestión de tiers para eventos TIERLIST:
- CRUD de tiers (nombre editable, color, orden con drag & drop)
- Los participantes se gestionan desde `ParticipantList.tsx` ya existente (con card cuadrada en modo TIERLIST)
- Límites visuales del plan (X/15 tiers usados)

#### [NEW] src/components/dashboard/QuestionList.tsx

Gestión de preguntas para eventos PREGUNTAS:
- CRUD de preguntas con tipo (CHECKBOX / RADIO)
- Gestión de opciones por pregunta con límite visual
- Reordenamiento drag & drop
- Paginación: configurar a qué página pertenece cada pregunta
- Límites del plan visibles en el header

#### [NEW] src/components/dashboard/DrawingConfig.tsx

Configuración para eventos DIBUJO:
- Campo de texto: **Tema del dibujo** (el prompt que ven los participantes)
- Selector de tiempo: toggle "Sin límite" (solo PLUS+) / slider con segundos (min/max según plan)
- Control de fases: botones para avanzar manualmente entre DRAWING → VOTING → RESULTS
- Estadísticas: N dibujos subidos, N votos emitidos

---

### Fase 4 — Experiencia de Votación Pública por Modo

#### [MODIFY] src/app/e/[slug]/page.tsx

El Server Component detecta `event.mode` y renderiza el componente de votación correspondiente.

#### [NEW] src/components/TierlistVotingClient.tsx

Vista pública del evento TIERLIST:
- Header del evento (nombre, descripción, badge de modo)
- Card de voto registrado (aparece al guardar)
- Zona inferior: **bandeja de opciones** con todas las cards cuadradas arrastrables
- Tabla de tiers: filas con etiqueta editable en el lado izquierdo, zona de drop a la derecha
- Drag & Drop con `@hello-pangea/dnd` (ya instalado en el proyecto)
- Botón "Registrar voto" → POST `/api/tierlist-votes`
- Las cards son cuadradas (aspect-ratio: 1/1), con imagen del participante o solo nombre

#### [NEW] src/components/PreguntasVotingClient.tsx

Vista pública del evento PREGUNTAS:
- Paginación multi-página si el evento tiene páginas configuradas
- Cada pregunta se renderiza como una card con:
  - Header: título + descripción
  - Opciones: checkboxes (CHECKBOX) o radio buttons (RADIO) con estilo custom
- Navegación "Anterior / Siguiente página"
- Botón "Enviar respuestas" en la última página → POST `/api/preguntas-votes`
- Validación: si una pregunta es obligatoria, no se puede avanzar sin responderla

#### [NEW] src/components/DrawingVotingClient.tsx

Vista pública del evento DIBUJO — **3 fases**:

**Fase 1: DRAWING**
- Muestra el tema del dibujo
- Lienzo HTML5 Canvas con la barra de herramientas completa (ver sección Fase 5)
- Countdown si hay límite de tiempo
- Botón "Enviar dibujo" → exporta canvas como PNG → sube a almacenamiento → registra `DrawingSubmission`

**Fase 2: VOTING**
- Galería por lotes aleatorios: se solicitan al servidor paquetes de 20 dibujos al azar que el votante no haya visto
- En cada lote: cards con el dibujo, botón de "Me gusta / Votar" simple (like)
- Sistema paginado del lado del servidor: `GET /api/drawing-votes/batch?eventId=X&voterHash=Y&seen=[ids]`
- Al votar → incrementa `DrawingSubmission.score` atómicamente (`$executeRaw UPDATE ... SET score = score + 1`)
- El votante puede ver tantos lotes como quiera, pero cada dibujo solo aparece una vez por votante

**Fase 3: RESULTS**
- Top 100 dibujos ordenados por `score` DESC
- Galería visual tipo Pinterest/masonry
- Podio (top 3) con animación confetti

---

### Fase 5 — Canvas de Dibujo

#### [NEW] src/components/DrawingCanvas.tsx

Componente cliente puro (sin SSR) que implementa el lienzo de dibujo:

**Herramientas (toolbar inferior):**
- **Modos de puntero**: Pincel, Goma, Relleno (cubo)
- **Tamaños de puntero**: 5 opciones de grosor (XS, S, M, L, XL) con previsualización circular
- **Opacidad**: slider 0-100%
- **Selector de color**: color picker custom (input `type=color` + input HEX manual)
- **Colores recientes**: últimos 6 colores usados guardados en estado local
- **Herramientas extra**: Línea recta, Rectángulo (trazo), Rectángulo relleno, Círculo (trazo), Círculo relleno, Cuentagotas
- **Historial**: Deshacer (Ctrl+Z), Rehacer (Ctrl+Y) — stack de hasta 30 estados (guardados como ImageData)

**Implementación técnica:**
- Canvas HTML5 nativo, sin librería externa — control total
- Touch events para móvil (táctil)
- Export: `canvas.toBlob('image/png')` → Blob → upload multipart

---

### Fase 6 — APIs REST nuevas

#### [NEW] src/app/api/tierlist-votes/route.ts
- `POST` — registra el voto de tierlist (validación: voterHash único por evento, límites del plan)

#### [NEW] src/app/api/tierlist-votes/results/route.ts
- `GET` — agrega resultados: para cada participante, tier medio ponderado y distribución de tiers

#### [NEW] src/app/api/preguntas-votes/route.ts
- `POST` — registra todas las respuestas de un formulario PREGUNTAS (transacción Prisma)

#### [NEW] src/app/api/preguntas-votes/results/route.ts
- `GET` — agrega resultados: para cada pregunta, conteo y % por opción

#### [NEW] src/app/api/drawing/upload/route.ts
- `POST` multipart — recibe el PNG del canvas, lo sube al bucket, crea `DrawingSubmission`
- Rate limit: 1 upload por voterHash por evento

#### [NEW] src/app/api/drawing/batch/route.ts
- `GET ?eventId=X&seen=[id1,id2,...]` — devuelve 20 dibujos aleatorios no vistos por el votante
- Implementación: `SELECT ... WHERE id NOT IN (...) ORDER BY RANDOM() LIMIT 20`
- Para escalabilidad a 100k: usar `TABLESAMPLE BERNOULLI(x)` o paginación por cursor con offset aleatorio

#### [NEW] src/app/api/drawing/vote/route.ts
- `POST` — incremento atómico del score + crea `DrawingVote`
- Rate limit: el votante no puede votar el mismo dibujo dos veces (`@@unique`)

#### [NEW] src/app/api/drawing/results/route.ts
- `GET` — top 100 dibujos por score

#### [NEW] src/app/api/drawing/phase/route.ts
- `PATCH` — avanza la fase (DRAWING → VOTING → RESULTS), solo el owner/admin del evento

---

### Fase 7 — Resultados por Modo

#### [MODIFY] src/app/e/[slug]/results/page.tsx

Renderiza el componente de resultados correcto según `event.mode`.

#### [NEW] src/components/TierlistResultsClient.tsx
- Agrega los votos: muestra la "tierlist media" (dónde puso la mayoría a cada participante)
- Vista de distribución: para cada participante, gráfico de barras con % en cada tier

#### [NEW] src/components/PreguntasResultsClient.tsx
- Para cada pregunta: barra de progreso por opción con % y conteo
- Solo visible si los resultados son públicos (configurable por el creador)

#### [NEW] src/components/DrawingResultsClient.tsx
- Top 100 en galería visual
- Podio animado para top 3

---

### Fase 8 — Página de Eventos Públicos (/polls)

#### [MODIFY] src/app/polls/page.tsx + componentes

- Añadir filtros por modo de evento: iconos clicables (Gala 🏆, Tierlist 📋, Preguntas ❓, Dibujo 🎨)
- Los filtros se añaden como query params `?mode=TIERLIST`
- Las cards de eventos muestran un badge del modo (chip de color)

---

### Fase 9 — Panel de Administración

#### [MODIFY] src/app/admin/events/

- La tabla de eventos muestra la columna "Modo"
- Filtros por modo en el panel admin

---

### Fase 10 — EventSettings adaptado

#### [MODIFY] src/components/dashboard/EventSettings.tsx

- Para TIERLIST: campos de nombre y descripción del único "tema" de la tierlist (visible en la página de votación como encabezado)
- Para DIBUJO: sección de configuración de fases (tiempo, tema del dibujo)
- Para PREGUNTAS: configurar si los resultados son públicos o privados

---

## Estrategia de escalabilidad para DIBUJO (50k-100k participaciones)

> [!WARNING]
> Con 100k dibujos, ningún sistema de "todos votan todos" es viable. Propuesta:

1. **Votación por muestreo aleatorio**: Cada votante ve lotes de 20 dibujos al azar. No necesita ver todos.
2. **Score acumulativo**: Cada "me gusta" suma +1 al score del dibujo con un `UPDATE ... SET score = score + 1 WHERE id = ?` atómico (sin race conditions).
3. **Índice compuesto**: `@@index([eventId, score])` para que el ranking sea instantáneo.
4. **Batch endpoint eficiente**: `SELECT id, imageUrl FROM DrawingSubmission WHERE eventId = ? AND id NOT IN (?) ORDER BY RANDOM() LIMIT 20` — el `NOT IN` con IDs ya vistos (pasados por el cliente) limita el escaneo.
5. **Resultados solo top 100**: `SELECT ... ORDER BY score DESC LIMIT 100` — query trivial.
6. **Upload asíncrono**: el PNG se sube al bucket de forma independiente del ciclo de request de votación.

---

## Orden de implementación (Fases)

```
Fase 1  → Schema Prisma + tipos PlanLimits     [~1 día]
Fase 2  → CreateEventButton con selector modo  [~0.5 días]
Fase 3  → Dashboard tabs + managers por modo   [~3 días]
Fase 5  → DrawingCanvas (lienzo completo)      [~2 días]  ← paralelo con Fase 3
Fase 4  → Voting clients (Tierlist, Preguntas, Dibujo) [~3 días]
Fase 6  → APIs REST de votación y upload       [~2 días]
Fase 7  → Results clients por modo             [~1.5 días]
Fase 8  → Filtros en /polls                    [~0.5 días]
Fase 9  → Admin panel                          [~0.5 días]
Fase 10 → EventSettings adaptado               [~0.5 días]
```

**Total estimado: ~14.5 días de desarrollo**

---

## Archivos nuevos — resumen

| Archivo | Descripción |
|---|---|
| `src/lib/event-modes.ts` | Helpers de lógica de modos |
| `src/components/TierlistVotingClient.tsx` | Votación pública TIERLIST |
| `src/components/PreguntasVotingClient.tsx` | Votación pública PREGUNTAS |
| `src/components/DrawingVotingClient.tsx` | Votación pública DIBUJO (3 fases) |
| `src/components/DrawingCanvas.tsx` | Lienzo de dibujo con todas las tools |
| `src/components/TierlistResultsClient.tsx` | Resultados TIERLIST |
| `src/components/PreguntasResultsClient.tsx` | Resultados PREGUNTAS |
| `src/components/DrawingResultsClient.tsx` | Resultados DIBUJO (top 100) |
| `src/components/dashboard/TierlistManager.tsx` | Gestión de tiers en dashboard |
| `src/components/dashboard/QuestionList.tsx` | Gestión de preguntas en dashboard |
| `src/components/dashboard/DrawingConfig.tsx` | Config de evento DIBUJO |
| `src/app/api/tierlist-votes/route.ts` | API voto tierlist |
| `src/app/api/tierlist-votes/results/route.ts` | API resultados tierlist |
| `src/app/api/preguntas-votes/route.ts` | API voto preguntas |
| `src/app/api/preguntas-votes/results/route.ts` | API resultados preguntas |
| `src/app/api/drawing/upload/route.ts` | API upload dibujo |
| `src/app/api/drawing/batch/route.ts` | API lotes de dibujos para votar |
| `src/app/api/drawing/vote/route.ts` | API voto a dibujo |
| `src/app/api/drawing/results/route.ts` | API top 100 resultados |
| `src/app/api/drawing/phase/route.ts` | API cambio de fase DIBUJO |

## Archivos modificados — resumen

| Archivo | Cambio |
|---|---|
| `prisma/schema.prisma` | +EventMode enum, +mode en Event, +6 nuevos modelos |
| `src/lib/plans.ts` | Ampliar PlanLimits con 8 nuevos campos de modo |
| `src/lib/user-plan.ts` | mapRow mapea los nuevos campos de limits JSON |
| `src/components/dashboard/CreateEventButton.tsx` | Selector de modo en modal |
| `src/components/dashboard/EventTabs.tsx` | Tabs condicionales según mode |
| `src/components/dashboard/EventSettings.tsx` | Secciones adicionales por modo |
| `src/components/dashboard/ParticipantList.tsx` | Card cuadrada en modo TIERLIST |
| `src/app/lib/dashboard-actions.ts` | createEvent acepta mode |
| `src/app/e/[slug]/page.tsx` | Renderiza voting client según mode |
| `src/app/e/[slug]/results/page.tsx` | Renderiza results client según mode |
| `src/app/polls/page.tsx` | Filtros por tipo de evento |

## Verification Plan

### Automated
- `npx prisma db push` tras schema changes
- TypeScript build `npm run build` en cada fase
- Tests unitarios para `checkTierlistLimits` y `canCreateDrawingEvent`

### Manual
- Crear evento TIERLIST como FREE → verificar límites
- Votar en TIERLIST con drag & drop en móvil y desktop
- Completar formulario PREGUNTAS multi-página
- Flujo completo DIBUJO: dibujar → subir → votar lote → ver resultados
- Verificar que FREE no puede crear DIBUJO (upsell)
- Verificar límite de 1 evento DIBUJO en PREMIUM
