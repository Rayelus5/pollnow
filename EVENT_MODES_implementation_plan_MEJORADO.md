# Plan de Implementación — Pollnow v3.0: Modos de Eventos (FINAL)

## Resumen ejecutivo

Añadir 4 modos: **GALA** (existe), **TIERLIST**, **PREGUNTAS**, **DIBUJO**.  
Cada modo tiene flujo de votación propio, dashboard de gestión propio y límites por plan.

---

## Decisiones de diseño confirmadas

| Pregunta | Respuesta |
|---|---|
| Almacenamiento dibujos | **Cloudflare R2** (ver Fase 0) |
| DIBUJO público | ❌ Siempre privado (por ahora) |
| Resultados PREGUNTAS | Privados (solo el creador los ve) |
| Fases DIBUJO | **Automáticas por fecha** — el creador elige `drawingDeadline` y `votingDeadline` |
| Tema del dibujo | El creador define el prompt visible a los participantes |

---

## Fase 0 — Almacenamiento: Cloudflare R2

**¿Por qué R2?** Tier gratuito: 10 GB storage, 1M operaciones de escritura/mes, 10M de lectura/mes, **sin costes de egress** (a diferencia de S3/GCS). API compatible con S3, sencilla de integrar.

### Pasos de alta

1. Crear cuenta en https://cloudflare.com → Workers & Pages → R2
2. Crear bucket `pollnow-drawings`
3. Configurar dominio público para el bucket (o usar URL de R2 con token)
4. Generar API Token con permisos R2 Read + Write

### Variables de entorno nuevas

```bash
CLOUDFLARE_R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=pollnow-drawings
CLOUDFLARE_R2_PUBLIC_URL=https://drawings.pollnow.es  # dominio custom o URL pública R2
```

### Integración en código

```typescript
// src/lib/r2.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadDrawing(buffer: Buffer, key: string): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: "image/png",
  }));
  return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
}
```

**Dependencia nueva:** `@aws-sdk/client-s3` (SDK de S3, compatible con R2).

---

## Fase 1 — Schema Prisma

### Cambios en model `Event`

```prisma
enum EventMode { GALA  TIERLIST  PREGUNTAS  DIBUJO }
enum DrawingPhase { DRAWING  VOTING  RESULTS }

model Event {
  // ... campos existentes ...
  mode              EventMode    @default(GALA)

  // Solo para DIBUJO
  drawingPrompt     String?      @db.VarChar(500)
  drawingTimeLimit  Int?         // segundos que tienen para dibujar (null = ilimitado)
  drawingPhase      DrawingPhase? // null si mode != DIBUJO
  drawingDeadline   DateTime?    // cierre de fase de dibujo → auto a VOTING
  votingDeadline    DateTime?    // cierre de fase de votación → auto a RESULTS

  // Relaciones nuevas
  tiers             TierlistTier[]
  questions         Question[]
  drawings          DrawingSubmission[]
}
```

### Nuevos modelos

```prisma
// TIERLIST
model TierlistTier {
  id        String  @id @default(uuid())
  eventId   String
  label     String  @db.VarChar(50)
  color     String  @default("#6366f1")
  order     Int     @default(0)
  event     Event   @relation(fields: [eventId], references: [id], onDelete: Cascade)
  entries   TierlistVoteEntry[]
  @@index([eventId])
}

model TierlistVote {
  id        String   @id @default(uuid())
  eventId   String
  voterHash String
  userId    String?
  createdAt DateTime @default(now())
  entries   TierlistVoteEntry[]
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
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
enum QuestionType { CHECKBOX  RADIO }

model Question {
  id          String         @id @default(uuid())
  eventId     String
  text        String         @db.VarChar(300)
  description String?        @db.VarChar(500)
  type        QuestionType
  pageIndex   Int            @default(0)
  order       Int            @default(0)
  isRequired  Boolean        @default(false)
  event       Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  options     QuestionOption[]
  answers     QuestionAnswer[]
  @@index([eventId])
}

model QuestionOption {
  id         String   @id @default(uuid())
  questionId String
  text       String   @db.VarChar(200)
  order      Int      @default(0)
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  answers    QuestionAnswer[]
  @@index([questionId])
}

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
model DrawingSubmission {
  id        String   @id @default(uuid())
  eventId   String
  voterHash String
  userId    String?
  imageUrl  String   @db.Text
  score     Int      @default(0)
  createdAt DateTime @default(now())
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  votes     DrawingVote[]
  @@unique([eventId, voterHash])
  @@index([eventId, score])
}

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

## Fase 2 — Límites de Plan

### PlanLimits ampliado (`src/lib/plans.ts`)

```typescript
export type PlanLimits = {
  // GALA (existentes)
  pollsPerEvent: number;
  participantsPerEvent: number;
  collaboratorsPerEvent: number;
  maxSharedEvents: number;
  // TIERLIST
  tierlistMaxTiers: number;
  tierlistMaxOptions: number;
  // PREGUNTAS
  preguntasMaxQuestions: number;
  preguntasMaxOptions: number;
  preguntasMaxPerPage: number;
  // DIBUJO
  drawingMaxEvents: number;        // 0 = no disponible
  drawingMinTimeSecs: number | null;
  drawingMaxTimeSecs: number | null; // null = ilimitado
  drawingAllowUnlimited: boolean;
};
```

| Plan | TL Tiers | TL Opts | PQ Max | PQ Opts | PQ/Pg | DRW Max | DRW Min | DRW Max | DRW ∞ |
|---|---|---|---|---|---|---|---|---|---|
| FREE | 5 | 10 | 8 | 5 | 4 | 0 | — | — | ❌ |
| PREMIUM | 10 | 20 | 15 | 10 | 15 | 1 | 10s | 180s | ❌ |
| PLUS | 15 | 35 | 30 | 20 | 30 | 3 | 10s | null | ✅ |
| UNLIMITED | 25 | 80 | 50 | 30 | 50 | 8 | 10s | null | ✅ |
| ENTERPRISE | 50 | 120 | 70 | 50 | 70 | 15 | 10s | null | ✅ |

---

## Fase 3 — Creación de Eventos

### CreateEventButton.tsx — Flujo en 2 pasos

**Paso 1:** Selector de modo con 4 cards visuales (icono + nombre + descripción corta). Si FREE intenta DIBUJO → upsell inline.

**Paso 2:** Formulario estándar + campos adicionales según modo:
- **DIBUJO**: prompt del tema (texto), `drawingDeadline` (datetime), `votingDeadline` (datetime), tiempo límite por participante (slider o toggle "sin límite" para PLUS+)
- **TIERLIST/PREGUNTAS/GALA**: formulario estándar (título, descripción, tags, fecha)

> [!IMPORTANT]
> Los eventos DIBUJO nacen siempre con `isPublic = false` y no se puede cambiar (por ahora). El campo `isPublic` se debe ocultar/bloquear en EventSettings cuando `mode === DIBUJO`.

### dashboard-actions.ts — `createEvent`

- Acepta `mode`, `drawingPrompt`, `drawingDeadline`, `votingDeadline`, `drawingTimeLimit`
- Para DIBUJO: valida que el usuario tenga PREMIUM+, cuenta cuántos eventos DIBUJO ya tiene y compara con `drawingMaxEvents`
- Inicializa `drawingPhase = DRAWING` si `mode === DIBUJO`

---

## Fase 4 — Cron: Transición automática de fases DIBUJO

El creador elige fechas. Un cron diario (o cada hora si se configura) avanza las fases automáticamente.

### src/app/api/cron/drawing-phases/route.ts

```typescript
// GET — protegido con CRON_SECRET
// 1. Busca eventos con mode=DIBUJO y drawingPhase=DRAWING donde drawingDeadline < now()
//    → actualiza a drawingPhase=VOTING
// 2. Busca eventos con mode=DIBUJO y drawingPhase=VOTING donde votingDeadline < now()
//    → actualiza a drawingPhase=RESULTS
```

### vercel.json — añadir cron

```json
{ "path": "/api/cron/drawing-phases", "schedule": "0 * * * *" }
```

(Cada hora — más frecuente que el cron de expiración de suscripciones)

> [!NOTE]
> En la página `/e/[slug]` también se comprueba en tiempo real si `drawingDeadline` o `votingDeadline` han pasado respecto a `new Date()`, como fail-safe independiente del cron.

---

## Fase 5 — Dashboard de Gestión

### EventTabs.tsx — Tabs por modo

| Tab | GALA | TIERLIST | PREGUNTAS | DIBUJO |
|---|---|---|---|---|
| Categorías (Poll) | ✅ | ❌ | ❌ | ❌ |
| Participantes | ✅ | ✅ | ❌ | ❌ |
| Tiers | ❌ | ✅ | ❌ | ❌ |
| Preguntas | ❌ | ❌ | ✅ | ❌ |
| Dibujo | ❌ | ❌ | ❌ ✅ |
| Ajustes | ✅ | ✅ | ✅ | ✅ |
| Stats | ✅ | ✅ | ✅ | ✅ |

### [NEW] TierlistManager.tsx
- CRUD de tiers (nombre, color, orden con drag & drop)
- Participantes reutilizan `ParticipantList` con `aspectRatio: square`
- Muestra X/límite tiers y opciones usadas

### [NEW] QuestionList.tsx
- CRUD de preguntas (texto, descripción, tipo CHECKBOX/RADIO, obligatoria)
- CRUD de opciones por pregunta con límite del plan visible
- Drag & drop para reordenar
- Selector de página (pageIndex) para paginación multi-página

### [NEW] DrawingConfig.tsx
- Muestra estado actual de la fase (badge: DRAWING / VOTING / RESULTS)
- Tema del dibujo (editable solo en fase DRAWING)
- Fechas: `drawingDeadline` y `votingDeadline` (editables)
- Tiempo por participante: toggle "ilimitado" (PLUS+) o slider segundos
- Stats: N dibujos subidos, N votos emitidos
- (Opcional) Botón de avance manual de fase para emergencias (solo owner)

### EventSettings.tsx
- Oculta toggle `isPublic` cuando `mode === DIBUJO`
- Para PREGUNTAS: añade sección "Privacidad de resultados" (info: siempre privados)

---

## Fase 6 — Canvas de Dibujo

### [NEW] src/components/DrawingCanvas.tsx

Canvas HTML5 nativo. Sin librería externa.

**Barra de herramientas (toolbar inferior):**

```
[Tamaños: ● ● ● ● ●]  [Opacidad ████░]  [Pincel] [Goma] [Cubo]
[Color picker + HEX]  [Últimos 6 colores]  [Línea] [□ trazo] [■ relleno] [○ trazo] [● relleno] [Cuentagotas]  [↩ Deshacer] [↪ Rehacer]
```

**Implementación:**
- Modos: `pencil` | `eraser` | `fill` | `line` | `rect-stroke` | `rect-fill` | `circle-stroke` | `circle-fill` | `eyedropper`
- Grosor: 5 tamaños predefinidos (2, 5, 10, 20, 40px)
- Opacidad: slider 0-100 → `ctx.globalAlpha`
- Undo/Redo: stack de `ImageData[]` (máx 30 estados)
- Color picker: `<input type="color">` + `<input type="text">` HEX sincronizados
- Colores recientes: array `string[]` en `useState`, máx 6
- Touch events: `touchstart/move/end` mapeados a `mousedown/move/up`
- Export: `canvas.toBlob('image/png')` → `FormData` → POST a `/api/drawing/upload`

---

## Fase 7 — Votación Pública por Modo

### /e/[slug]/page.tsx

```typescript
// Server Component
switch (event.mode) {
  case "GALA":      return <VotingForm ... />         // existente
  case "TIERLIST":  return <TierlistVotingClient ... />
  case "PREGUNTAS": return <PreguntasVotingClient ... />
  case "DIBUJO":    return <DrawingVotingClient ... />
}
```

### [NEW] TierlistVotingClient.tsx

- Header evento (nombre, descripción, badge modo)
- Bandeja inferior: todas las cards cuadradas de participantes (arrastrables)
- Tabla de tiers: filas con etiqueta coloreada (izquierda) + zona de drop (derecha)
- Drag & Drop: `@hello-pangea/dnd` (ya instalado)
- Botón "Registrar voto" → POST `/api/tierlist-votes`
- Tras votar: card de confirmación

### [NEW] PreguntasVotingClient.tsx

- Paginación por `pageIndex`: navegación Anterior/Siguiente
- Cada pregunta: card con título, descripción, opciones checkbox o radio custom
- Validación de preguntas obligatorias antes de avanzar
- Botón "Enviar respuestas" en última página → POST `/api/preguntas-votes`
- El evento puede ser público (se muestra en comunidad hasta `galaDate`)
- Tras `galaDate`, el evento deja de aparecer en `/polls` aunque `isPublic=true`

### [NEW] DrawingVotingClient.tsx — 3 fases

**Fase DRAWING:**
- Muestra `drawingPrompt` (tema)
- Countdown hasta `drawingDeadline` (si hay tiempo límite individual: countdown del `drawingTimeLimit`)
- `<DrawingCanvas />` con toda la toolbar
- Botón "Enviar dibujo" → upload a R2 → crea `DrawingSubmission`
- Tras enviar: card de confirmación + preview del dibujo subido

**Fase VOTING:**
- Galería por lotes de 20 dibujos aleatorios (los no vistos aún por el votante)
- Cada card: imagen del dibujo + botón ❤️ Votar
- `GET /api/drawing/batch?eventId=X&seen=[ids]` → devuelve 20 DrawingSubmissions random
- `POST /api/drawing/vote` → `UPDATE score = score + 1` atómico
- Botón "Ver más dibujos" carga el siguiente lote
- Countdown hasta `votingDeadline`

**Fase RESULTS:**
- Top 100 dibujos por `score DESC LIMIT 100`
- Podio animado (top 3) + galería masonry resto
- No se muestran todos si hay más de 100 (mensaje "Solo se muestran los 100 mejores")

---

## Fase 8 — APIs REST nuevas

```
POST   /api/tierlist-votes            — registra voto tierlist (único por voterHash+eventId)
GET    /api/tierlist-votes/results    — agrega resultados (tier medio por participante)

POST   /api/preguntas-votes           — registra todas las respuestas (transacción Prisma)
GET    /api/preguntas-votes/results   — conteo % por opción (solo para el owner del evento)

POST   /api/drawing/upload            — recibe PNG, sube a R2, crea DrawingSubmission
GET    /api/drawing/batch             — 20 dibujos aleatorios no vistos por el votante
POST   /api/drawing/vote             — score++ atómico + crea DrawingVote
GET    /api/drawing/results           — top 100 por score
GET    /api/cron/drawing-phases       — avanza fases por fecha (protegido con CRON_SECRET)
```

**Estrategia batch escalable a 100k dibujos:**
```sql
SELECT id, imageUrl FROM "DrawingSubmission"
WHERE "eventId" = $1
  AND id NOT IN (/* array de IDs ya vistos, enviados por el cliente */)
ORDER BY RANDOM()
LIMIT 20
```
Para eventos con >10k dibujos, opcionalmente usar `TABLESAMPLE BERNOULLI(5)` para muestrear sin full-scan.

---

## Fase 9 — Resultados

### /e/[slug]/results/page.tsx — routing por modo

### [NEW] TierlistResultsClient.tsx
- "Tierlist media": donde puso la mayoría a cada participante
- Distribución: barras de % en cada tier por participante

### [NEW] PreguntasResultsClient.tsx
- Solo accesible al owner (verificación server-side con `accessKey` o sesión)
- Por pregunta: barra de progreso por opción + % + N respuestas

### [NEW] DrawingResultsClient.tsx
- Podio top 3 con animación
- Galería masonry top 100
- Badge con score de cada dibujo

---

## Fase 10 — Página /polls

- Filtros por modo: iconos con tooltip (GALA, TIERLIST, PREGUNTAS — DIBUJO no aparece)
- Badge de modo en las cards de eventos
- Eventos PREGUNTAS: desaparecen de la lista cuando `galaDate` < `now()` (misma lógica que GALA)
- Eventos DIBUJO: **nunca aparecen** en `/polls`

---

## Archivos nuevos

| Archivo | Descripción |
|---|---|
| `src/lib/r2.ts` | Cliente Cloudflare R2 |
| `src/lib/event-modes.ts` | Helpers de validación de modos |
| `src/components/DrawingCanvas.tsx` | Lienzo HTML5 completo |
| `src/components/TierlistVotingClient.tsx` | Votación TIERLIST |
| `src/components/PreguntasVotingClient.tsx` | Votación PREGUNTAS |
| `src/components/DrawingVotingClient.tsx` | Votación DIBUJO (3 fases) |
| `src/components/TierlistResultsClient.tsx` | Resultados TIERLIST |
| `src/components/PreguntasResultsClient.tsx` | Resultados PREGUNTAS (privados) |
| `src/components/DrawingResultsClient.tsx` | Resultados DIBUJO top 100 |
| `src/components/dashboard/TierlistManager.tsx` | Gestión tiers en dashboard |
| `src/components/dashboard/QuestionList.tsx` | Gestión preguntas en dashboard |
| `src/components/dashboard/DrawingConfig.tsx` | Config evento DIBUJO |
| `src/app/api/tierlist-votes/route.ts` | API voto tierlist |
| `src/app/api/tierlist-votes/results/route.ts` | API resultados tierlist |
| `src/app/api/preguntas-votes/route.ts` | API voto preguntas |
| `src/app/api/preguntas-votes/results/route.ts` | API resultados preguntas |
| `src/app/api/drawing/upload/route.ts` | Upload dibujo a R2 |
| `src/app/api/drawing/batch/route.ts` | Lotes aleatorios para votar |
| `src/app/api/drawing/vote/route.ts` | Voto a dibujo |
| `src/app/api/drawing/results/route.ts` | Top 100 resultados |
| `src/app/api/cron/drawing-phases/route.ts` | Cron transición de fases |

## Archivos modificados

| Archivo | Cambio clave |
|---|---|
| `prisma/schema.prisma` | +EventMode, +DrawingPhase, +campos DIBUJO en Event, +8 modelos |
| `src/lib/plans.ts` | +8 campos en PlanLimits, valores por plan |
| `src/lib/user-plan.ts` | mapRow amplía mapeo de limits JSON |
| `src/components/dashboard/CreateEventButton.tsx` | Paso 1 selector modo + campos DIBUJO |
| `src/components/dashboard/EventTabs.tsx` | Tabs condicionales por mode |
| `src/components/dashboard/EventSettings.tsx` | Ocultar isPublic en DIBUJO, info resultados PREGUNTAS |
| `src/components/dashboard/ParticipantList.tsx` | Card cuadrada en modo TIERLIST |
| `src/app/lib/dashboard-actions.ts` | createEvent acepta mode + validaciones |
| `src/app/e/[slug]/page.tsx` | Switch por mode → componente correcto |
| `src/app/e/[slug]/results/page.tsx` | Switch por mode → resultados correctos |
| `src/app/polls/page.tsx` | Filtros por modo, excluir DIBUJO |
| `vercel.json` | +cron drawing-phases cada hora |
| `MIGRATION_GUIDE_v3.0.md` | +R2 vars, +nuevos modelos |

---

## Verificación

- `npx prisma db push` tras schema
- `npm run build` tras cada fase
- Test manual: flujo completo TIERLIST (drag & drop), flujo PREGUNTAS multi-página, flujo DIBUJO (dibujar → subir → votar lote → resultados top 100)
- Verificar que FREE no puede crear DIBUJO
- Verificar que PREMIUM no puede poner tiempo ilimitado en DIBUJO
- Verificar que eventos DIBUJO no aparecen en /polls
- Verificar que resultados PREGUNTAS no son accesibles sin ser owner
