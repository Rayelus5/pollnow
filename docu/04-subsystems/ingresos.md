---
title: Sistema de Ingresos
updated: 2026-05-24
---

# Sistema de Ingresos

Permite al admin enviar dinero a usuarios (vinculado a un evento publicado) y que los usuarios
soliciten retirarlo por **Bizum**. El saldo se mantiene **denormalizado** en `User` y se
actualiza **siempre dentro de `prisma.$transaction`**.

## Modelo de datos

- **`User`** += `phonePrefix`, `phoneNumber` (Bizum), `currentBalance` (saldo actual, máx €10),
  `totalEarned` (histórico, nunca decrece).
- **`RevenuePayment`**: pago enviado por el admin. `amount`, `adminNote?` (visible para el
  usuario), relación a `User` (`ReceivedPayments`) y a `Event` (`EventPayments`, `onDelete:
  Restrict`).
- **`WithdrawalRequest`**: solicitud de retiro. `amount`, `method` (`BIZUM`), `recipientPhone`,
  `recipientName`, `status` (`PENDING`/`APPROVED`/`REJECTED`), `rejectionReason?`, `processedAt?`.

Aplicado con **`npx prisma db push`** (no migrate).

## Reglas de negocio (guards en servidor)

Definidas en `src/lib/revenue-config.ts` y validadas en `src/app/lib/revenue-actions.ts`:

| Regla | Valor |
|-------|-------|
| Saldo máximo acumulable | **€10** (`MAX_BALANCE`) |
| Mínimo para retirar | **€5** (`MIN_WITHDRAWAL`) |
| Plazo de pago comunicado | **5 días hábiles** (`WITHDRAWAL_PROCESSING_DAYS`) |
| Retiros simultáneos | **1** `PENDING` por usuario |

- **Envío** (`createRevenuePayment`): valida `currentBalance + amount ≤ 10`, que el evento sea del
  usuario y esté `APPROVED`; crea el pago e incrementa `currentBalance` y `totalEarned` en una
  transacción.
- **Solicitud de retiro** (`requestWithdrawal`): exige `currentBalance ≥ 5` y sin otra `PENDING`;
  crea la solicitud con `amount = currentBalance`. **No** toca el saldo.
- **Aprobar** (`approveWithdrawal`): `status=APPROVED`, `processedAt` y **decrementa**
  `currentBalance` (transacción).
- **Rechazar** (`rejectWithdrawal`): `status=REJECTED` + motivo (mín. 10 chars). El saldo **no**
  se toca (sigue disponible).

## UI

- **Usuario** — pestaña "Ingresos" del dashboard (`?tab=ingresos`): requiere teléfono Bizum (si
  no, estado vacío que lleva a Mi Cuenta). Muestra saldo + barra hacia €10, historial de ingresos
  y de retiros, y modal de solicitud. El teléfono se guarda en Mi Cuenta con
  `react-phone-number-input` (`PhoneBizumCard` → `updatePhone`).
- **Admin** — `/admin/ingresos/envios` (alta de envío con autocomplete de usuario + evento
  publicado) y `/admin/ingresos/retiros` (aprobar/rechazar). Saldo, histórico y teléfono también
  en `/admin/users/[id]`.

## Emails (Resend)

En `src/lib/mail.ts`: `sendRevenuePaymentReceived`, `sendWithdrawalRequestedUser`,
`sendWithdrawalRequestedAdmin`, `sendWithdrawalApproved`, `sendWithdrawalRejected`.

## Archivos clave

- Config: `src/lib/revenue-config.ts` · Acciones: `src/app/lib/revenue-actions.ts` (+ `updatePhone`
  en `src/app/lib/user-actions.ts`)
- UI usuario: `src/components/dashboard/{IngresosTab,PhoneBizumCard}.tsx`
- UI admin: `src/app/admin/ingresos/**`, `src/components/admin/{NewPaymentForm,NewPaymentToggle,WithdrawalActions}.tsx`

> Nota: el destino de las notificaciones al admin está fijado a `contacto@rayelus.com`
> (`ADMIN_NOTIFICATION_EMAIL` en `src/lib/mail.ts`); no usa variable de entorno.
