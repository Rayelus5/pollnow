---
title: Bug Bounty
updated: 2026-05-24
---

# Bug Bounty

Programa público para que los usuarios reporten errores y vulnerabilidades. Página pública
informativa + formulario para usuarios autenticados, panel de gestión en admin y notificación
por email.

## Modelo de datos

`BugReport` (`prisma/schema.prisma`):

| Campo | Tipo | Notas |
|-------|------|-------|
| `severity` | `BugSeverity` | `LOW` / `MEDIUM` / `HIGH` / `CRITICAL` |
| `status` | `BugStatus` | `PENDING` → `REVIEWING` → `ACCEPTED`/`REJECTED` → `REWARDED` |
| `pageUrl` | String | Página donde ocurre |
| `screenshotUrl` | String? | Captura en Vercel Blob (`bug-reports/<userId>/…`) |
| `adminNotes` | Text? | Notas internas (no visibles para el usuario) |

Relación: `User.bugReports`. Aplicado con **`npx prisma db push`** (no migrate).

## Flujo

1. **Página pública** `/bug-bounty`: sección informativa (tabla de severidades, qué entra/qué
   no, nota de divulgación responsable) visible para todos. El formulario solo se muestra a
   usuarios autenticados; si no, banner de login.
2. **Envío** — `submitBugReport` (`src/app/lib/bug-actions.ts`): validación Zod, **rate limit
   3 reportes / 24h por usuario** (ver [rate-limiting.md](../05-api/rate-limiting.md)), subida
   opcional de captura (JPG/PNG/WEBP, máx 5MB) a Vercel Blob, creación del reporte y **email al
   admin** (`contacto@rayelus.com`).
3. **Panel admin** `/admin/bugs`: lista con filtros por severidad y estado + paginación. Detalle
   `/admin/bugs/[id]`: cambio de estado, notas internas, envío de email custom al usuario y botón
   **REWARDED** (solo si `ACCEPTED`) con recordatorio de asignar la suscripción manualmente desde
   el perfil del usuario.

## Emails (Resend)

En `src/lib/mail.ts`: `sendBugReportToAdmin` (al recibir un reporte) y `sendBugReplyToUser`
(mensaje custom del admin). Siguen la plantilla oscura compartida (`wrapEmail`).

## Archivos clave

- Acciones: `src/app/lib/bug-actions.ts`
- Página pública: `src/app/bug-bounty/page.tsx` + `src/components/BugBountyForm.tsx`
- Admin: `src/app/admin/bugs/{page.tsx,[id]/page.tsx}`, `src/components/admin/{BugDetailClient,bugBadges}.tsx`
