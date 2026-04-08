# Pollnow | v2.4
> https://www.pollnow.es/

<!-- ![Next](https://img.shields.io/badge/-Next.js-20232a?logo=nextdotjs&logoColor=white) -->
![React](https://img.shields.io/badge/-React-20232a?logo=react&logoColor=61dafb)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178c6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/-Prisma-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Stripe](https://img.shields.io/badge/-Stripe-635bff?logo=stripe&logoColor=white)

---

<img width="1194" height="744" alt="canvas" src="https://github.com/user-attachments/assets/be3269ce-fd39-4e25-94c8-9d7b5a512435" />

---

## 📝 Project Description

POLLNOW is a full-stack awards & voting platform built on top of **Next.js (App Router)**, designed for creating, managing, and analyzing structured events with multi-category voting.

The application combines:

- A **public-facing voting experience** (anonymous, device-bound, anti-duplicate),
- A **multi-tenant user dashboard** for event owners,
- A **real-time collaborative event editing system** with granular permission control,
- A **moderation-oriented admin panel**,
- A **subscription system** based on Stripe, and
- Supporting modules for **support tickets**, **notifications** (in-app + email), **analytics**, and **AI-powered features**.

The goal of this project is not just to "make something work", but to explore how a modern SaaS-style system can be built with:

- **React Server Components + Server Actions**
- **Prisma with a non-trivial relational schema**
- **NextAuth with custom flows (email verification, Google, password reset)**
- **Stripe billing & webhooks**
- **Production-oriented patterns** (middleware, modular server actions, strict validation, API rate limiting).

---

## 🔑 Core Concepts & Domain Model

The application revolves around **events** (award ceremonies, competitions, polls) and their **voting lifecycle**.

### Main Entities

- **User**
  - Owns events
  - Has a subscription status (free / premium tiers)
  - Can authenticate via credentials or Google
  - Receives notifications and support messages
  - Can like and vote on public events
  - Holds two email-preference flags (`emailNotifications`, `emailCollaborations`) that gate transactional email delivery and support one-click unsubscribe

- **Event**
  - Represents a specific awards ceremony / poll session
  - Controls:
    - Visibility (public list vs direct link access)
    - Voting mode (anonymous vs identified)
    - Gala date and result visibility
    - Status (`DRAFT`, `PENDING`, `APPROVED`, `DENIED`)
    - Tags (searchable, normalized to lowercase, pill-based input with autocomplete)
  - Tracks community engagement via **likes** (`EventLike`) and **ratings** (`EventVote`, upvote/downvote)

- **Participant**
  - A nominee / candidate that can be reused across polls in the same event

- **Poll**
  - A category inside an event (e.g. "Best Movie", "Best Streamer")
  - Associated with:
    - Order (for linear voting flow)
    - Options
    - Optional max options / selection rules
    - Minimum 2 nominees required before a category can be saved

- **Option**
  - Link between a `Participant` and a `Poll`
  - Defines which participant is part of which category
  - Maintains its own order inside a poll

- **Vote**
  - A vote for a specific `Option` in a `Poll`
  - Contains:
    - Timestamps
    - Optional `userId` when the voter's identity is known
    - An associated **voter hash** for anonymous / device-bound tracking

- **EventLike**
  - Heart/like reaction tied to a `User` and an `Event`
  - Unique per user per event (toggle behaviour)

- **EventVote**
  - Community rating tied to a `User` and an `Event`
  - `value` field: `1` (upvote) or `-1` (downvote)
  - Unique per user per event; same value toggles it off

- **SupportChat / SupportMessage**
  - Used for in-app support ticketing between users and admins

- **Notification**
  - Server-side generated events rendered in the dashboard

- **Billing / Tokens**
  - Subscription & Stripe metadata
  - Verification tokens
  - Password reset tokens

All of this is expressed in `prisma/schema.prisma` and evolved via many migrations under `prisma/migrations`.

---

## 🧱 Architecture & Runtime Model

POLLNOW is structured around **Next.js App Router** and uses a combination of:

- **Server Components** for data-fetching routes,
- **Client Components** for interactive UI,
- **Server Actions** for mutations and business logic,
- **API Routes** for Stripe webhooks, voting, and engagement endpoints.

High-level view:

```text
Client (React/Tailwind)  ➡️  Next.js App Router
                         ➡️  Server Components & Actions
                         ➡️  Prisma (PostgreSQL)
                         ➡️  Pusher (real-time WebSocket layer)
                         ➡️  External services (Stripe, Resend, Gemini AI, Pollinations AI)
```

### Key Architectural Choices

* **Server Actions** in `src/app/lib/*-actions.ts` (e.g. `dashboard-actions`, `event-actions`, `stats-actions`) encapsulate business logic instead of pushing everything into API routes.
* **NextAuth** is configured in `src/auth.config.ts` and `src/auth.ts`, using Prisma as the adapter and Postgres as the storage.
* **Stripe** integration is handled via:

  * Server-side actions in `stripe-actions.ts`
  * Webhook route in `app/api/webhooks/stripe/route.ts`
* **Middleware** (`src/middleware.ts`) is used to:

  * Protect admin routes
  * Enforce auth in certain sections
  * Assign a `voter_id` cookie to every visitor for anonymous vote tracking
* **Rate Limiting** (`src/lib/rate-limit.ts`) is applied to all API routes using a sliding-window in-memory strategy (see §10 below).

---

## 🧩 Major Subsystems

### 1. Authentication & User Lifecycle

Located mainly in:

* `src/auth.config.ts`
* `src/auth.ts`
* `src/app/lib/auth-actions.ts`
* `src/app/api/auth/[...nextauth]/route.ts`

Capabilities:

* Email/password login with bcrypt-hashed passwords.
* Google OAuth login (`authenticateGoogle`).
* Email verification flow:

  * Verification tokens (`lib/tokens.ts`)
  * Verification page under `app/auth/new-verification/page.tsx`.
* Password reset support via tokens (`reset-password.ts`, tokens model).
* Session-based role handling (`USER`, `MODERATOR`, `ADMIN`).

Authentication is consumed in server components via `auth()` calls and used to gate entire routes (`dashboard`, `admin`, etc.).

---

### 2. Event Management & Dashboard

Key paths & modules:

* `src/app/dashboard/page.tsx`
* `src/app/dashboard/event/[id]/page.tsx`
* `src/app/lib/dashboard-actions.ts`
* `src/app/lib/event-actions.ts`
* `src/components/dashboard/*`

The dashboard provides:

* **Events tab**

  * Create event (`CreateEventButton` + `dashboard-actions.ts`)
    * Tag input uses the pill-based `TagsInput` component with live autocomplete from the API
  * List events (`DashboardEventCard`)
  * Per-event link into `/dashboard/event/[id]`

* **Event detail page**

  * `EventTabs` wraps:

    * `EventSettings` — configuration, gala date, visibility, anonymous voting, and **editable tags** via `TagsInput`
    * `ParticipantList` — add/edit/remove participants
    * `PollList` — categories with:
      * Drag & drop reordering
      * Paginated participant selector (10 per page)
      * "Select All" / "Remove All" across all pages
      * Minimum 2 nominees enforced before saving
    * `EventStatistics` — aggregated stats, breakdown by category, premium gating, and **engagement KPIs** (likes, upvotes/downvotes, net score)

* **Notifications & Support**

  * `DashboardTabs` also exposes:

    * Notifications tab (`NotificationsTab`, `user-notification-actions.ts`)
    * Support tab (`SupportTab`, support ticket list + `CreateTicketButton`)

All writes are performed via server actions invoked from forms and interactive clients.

---

### 3. Public Voting Flow

Public event access is organized under:

* `src/app/e/[slug]/page.tsx`        → Voting entry for a specific event
* `src/app/e/[slug]/completed/page.tsx` → Post-voting "thank you" page
* `src/app/e/[slug]/results/page.tsx`   → Results page (time-gated, shows likes/votes in header)
* `src/app/polls/*`                     → Public explore & listing pages
* `src/app/api/polls/*`                 → Voting & result APIs

Voting UX:

1. User lands on `/e/[slug]` (public events are freely accessible; private events require a `?key=` param).
2. A **linear voting flow** guides them through each poll (category) in order.
3. Votes are validated and stored via:

   * `public-actions.ts`
   * `event-actions.ts`
   * `stats-actions.ts`
4. When finished, the user is redirected to a completion page.
5. Results may be:

   * Hidden until a gala date,
   * Partially visible (e.g. aggregated only),
   * Or fully visible if configuration & time allow.
6. The **"Volver al Lobby"** button on the results page correctly preserves the `?key=` parameter for private events.

---

### 4. Anonymous Voting Engine

Core implementation lives in:

* Prisma models (`Vote`, `Event`, etc.)
* `stats-actions.ts`
* `public-actions.ts` & `polls` API routes

Mechanisms:

* Each anonymous visitor is assigned a **voter hash**:

  * Derived from device/session information.
  * Stored in the DB to prevent re-votes per poll/event.
* **HttpOnly cookies** + **hashes** are used to:

  * Avoid exposing identifiers to the client.
  * Distinguish "already voted" states.
* If a user is authenticated, their `userId` may be attached to the vote (depending on event configuration).
* Events have an `isAnonymousVoting` flag:

  * When `true`, identities are hidden even from premium analytics.
  * When `false`, premium tiers (or admins) can see who voted for what (when allowed).
* Unauthenticated users can vote on **public events** — their votes are stored and shown as "Anónimos" in statistics.

---

### 5. Statistics & Analytics

`src/app/lib/stats-actions.ts` exposes a high-level `getEventStats(eventId)` function that:

* Fetches polls, options, and votes for the event.
* Computes:

  * `totalVotes`
  * `totalPolls`
  * `votesByPoll` (for bar charts)
  * Per-poll breakdown:

    * Options with their `votesCount`
    * List of voters (if allowed)
* Builds an `activityTimeline` from recent votes grouped by date.
* Reads `event.isAnonymousVoting` to ensure privacy is respected in the UI.
* Fetches **community engagement data**: `likeCount`, `upvotes`, `downvotes`, `voteScore`.

The client-side visualization is handled by:

* `src/components/dashboard/EventStatistics.tsx`

Features include:

* **Voting KPIs**: total votes, active categories, participation status.
* **Engagement KPIs** (second row): likes received, upvotes/downvotes breakdown, net score (colour-coded green/red/grey).
* Progress-bar style charts for vote distribution.
* Scrollable list of polls with per-category modals.
* Conditional UI:

  * Free plan: blurred/gated UI + mock stats (with realistic mock engagement data).
  * Premium: real numbers.
  * Premium+ or Admin: voter identities (if event is not anonymous).

---

### 6. Public Explore Page (`/polls`)

`src/app/polls/page.tsx` and its client components provide a fully-featured public event discovery experience:

* **Search bar** — debounced full-text search across titles and descriptions.
* **Sort filters** (chip buttons):
  * Recientes, Populares (likes), Mejor valorados, Peor valorados, Más antiguos.
* **Random event button** — fetches a random approved public event via `/api/events/random` and navigates to it instantly, with a dice icon and spin animation while loading.
* **Clickable tags** — each tag pill on an event card navigates to `?tag=TAG` to filter by that tag.
* **Active tag chip** — shows the current tag filter with an × to clear it.
* **Pagination** — 6 events per page with smart ellipsis page numbers, Previous/Next controls, and auto-scroll to top on page change.
* **Per-card engagement actions** (authenticated users):
  * ❤️ **Like** button with live count and optimistic update.
  * 👍 **Upvote** / 👎 **Downvote** buttons with coloured net score (`+N` green, `-N` red).
  * All actions use `stopPropagation` so they don't trigger card navigation.
* **Animated transitions** — `AnimatePresence` with `mode="wait"` ensures correct entry/exit animations when switching between result set and empty state.

---

### 7. Tag System

Tags on events are standardized across the platform:

* Always stored as **lowercase**, diacritics removed (slug-safe).
* Maximum **5 tags** per event, each up to **20 characters**.
* Input uses `src/components/ui/TagsInput.tsx`:
  * Pill display with animated add/remove.
  * Live autocomplete popup from `/api/tags?q=` showing usage counts.
  * Enter, comma, or Backspace to add/remove.
  * Single hidden `<input name="tags">` for form compatibility.
* Tags are editable both at **event creation** (`CreateEventButton`) and in **event settings** (`EventSettings`).
* `/api/tags` only returns tags from public events, rate-limited to 60 req/min.

---

### 8. Admin Panel

Admin routes are located under:

* `src/app/admin/*`

Modules:

* `admin/page.tsx` – Admin dashboard root.
* `admin/events` – Event list & review.
* `admin/reviews` – Content moderation for event reviews.
* `admin/users` – User list and user detail view.
* `admin/notifications` – Admin notifications UI.
* `admin/chats` – Support chats view.

Supporting business logic:

* `src/app/lib/admin-actions.ts` – Approvals, rejections, user updates, etc.
* `src/app/api/admin/events/batch/route.ts` – Bulk event status updates / deletions (ADMIN + MODERATOR only, rate-limited).
* `src/app/api/admin/users/batch/route.ts` – Bulk user role / ban / plan changes (ADMIN only, rate-limited).

Admins have elevated visibility and control:

* Can inspect any event and its stats.
* May override limitations imposed on regular users.
* Serve as moderators for reports and abuse.

---

### 9. Real-Time Team Collaboration

Event owners can invite collaborators and manage their access with granular, real-time permissions.

Key files:

* `src/app/api/collaborators/[eventId]/route.ts` — GET (fetch team), PATCH (update permissions), DELETE (remove collaborator)
* `src/app/api/collaborators/invite/route.ts` — Send collaboration invitation
* `src/app/api/collaborators/respond/route.ts` — Accept / reject invitation
* `src/components/dashboard/TeamTab.tsx` — Owner-side team management panel
* `src/components/dashboard/CollaboratorCard.tsx` — Per-collaborator permission editor
* `src/lib/pusher.ts` — WebSocket channel definitions and event names

#### Collaboration model

* Each event can have multiple `EventCollaborator` records (plan-limited: Premium=1, Plus=5, Unlimited=15).
* Each collaborator entry holds **6 nullable boolean** permission fields:
  * `canEditSettings` — Edit event name, description, date, privacy
  * `canRegenerateKey` — Rotate the private access key
  * `canDeleteEvent` — Permanently delete the event
  * `canManageNominees` — Create and edit participants
  * `canManagePolls` — Create and edit voting categories
  * `canViewStats` — View event statistics and results
* `null` = **inherit from event defaults** (set separately per event).
* Event defaults ship with `canManageNominees`, `canManagePolls`, and `canViewStats` enabled by default.

#### Permission inheritance

Effective permission = individual override ?? event-level default:

```
null (inherit) → resolves to event default
true / false   → explicit override (wins over default)
```

When an owner toggles a permission back to the value that matches the event default, it automatically resets to `null` (inherit), keeping the model clean.

#### Real-time sync (Pusher)

All permission and membership changes broadcast over the private `private-event-{id}` channel:

| Pusher Event | Trigger |
|---|---|
| `invitation-sent` | A new invitation is created |
| `collaborator-joined` | A user accepts an invitation |
| `collaborator-left` | A collaborator is removed |
| `permissions-updated` | Global defaults or individual overrides change |
| `data-changed` | Participants, polls, or event settings change |

* **Owner side** (`TeamTab`): updates collaborator list and permission toggles in real time without a full page reload.
* **Collaborator side** (`EventTabs`): listens for `permissions-updated` and calls `router.refresh()` — Next.js re-fetches the server component with updated permissions, instantly showing or hiding action buttons, forms, and entire sections.

#### Invitation flow

1. Owner sends invitation → `CollaboratorInvitation` record created, notification stored, **collaboration invite email sent** via Resend (styled amber/gold template, only if the recipient has `emailCollaborations = true`), Pusher event fires.
2. Invited user sees the pending invitation in their dashboard notifications tab.
3. On accept → `EventCollaborator` created with all permissions `null` (inheriting event defaults); Pusher fires `collaborator-joined`.
4. On reject → invitation marked `REJECTED`; owner can re-invite later.
5. If a collaborator is later **removed** (DELETE), the `EventCollaborator` record is deleted but the `CollaboratorInvitation` remains. The invite route checks the actual collaborator table before blocking re-invites, so removed users can be re-invited without conflict.

#### Access control

* Owners and admins always have full access to an event page.
* Non-collaborators hitting `/dashboard/event/[id]` receive a styled **"Sin acceso a este evento"** page instead of a generic 404.

---

### 10. Support & Notifications

**Support system**:

* `src/app/dashboard/support/*`
* `src/app/admin/chats/*`
* `src/app/lib/support-actions.ts`
* `src/app/api/support/messages/[chatId]/route.ts`

Users can open support chats; admins reply via the admin interface.

**Notifications**:

* `src/app/lib/user-notification-actions.ts`
* Rendered in the dashboard `Notifications` tab.
* Allow marking single notifications as read or all at once.
* Two types: `SYSTEM` (event approvals/rejections) and `COLLABORATION` (invitations).

**Email notifications** (`src/lib/mail.ts`):

In addition to in-app notifications, users receive transactional emails via Resend for:

| Trigger | Template | Gated by preference |
|---|---|---|
| Account registration | Verification link (indigo theme) | No — always sent |
| Password reset | Reset link (neutral dark theme) | No — always sent |
| Event approved by admin | System notification (indigo theme) | `emailNotifications` |
| Event rejected by admin | System notification with rejection reason | `emailNotifications` |
| Collaboration invitation received | Special amber/gold template with event name | `emailCollaborations` |

All notification emails are dispatched fire-and-forget (`.catch()`) so a delivery failure never interrupts the main flow.

**Deliverability hardening:**

Every email includes a `text` plain-text alternative (HTML-only emails are penalised by spam filters). Non-auth emails carry a `List-Unsubscribe` / `List-Unsubscribe-Post` header pointing to a signed unsubscribe URL, and use specific subject lines derived from the event title to avoid generic spam triggers.

**Email preferences & unsubscribe** (`src/lib/unsubscribe.ts`, `src/app/unsubscribe/page.tsx`):

* Users control both toggles from `/dashboard?tab=profile` → **Notificaciones por correo** section.
* Every notification/collaboration email includes an **"Unsubscribe"** footer link.
* The link encodes a signed, stateless token: `base64url(userId:type:HMAC-SHA256)` using `NEXTAUTH_SECRET`. No extra DB table required.
* `GET /unsubscribe?token=...` verifies the token, sets the relevant preference to `false`, and renders a confirmation page with a link back to the profile to re-enable.

---

### 11. API Rate Limiting

All API routes are protected by a **sliding-window in-memory rate limiter** (`src/lib/rate-limit.ts`). The store is cleaned automatically every 5 minutes to prevent unbounded growth.

| Route | Limit | Key |
|---|---|---|
| `POST /api/polls` | 10 / min | IP |
| `GET /api/polls/[id]` | 60 / min | IP |
| `GET /api/polls/[id]/results` | 60 / min | IP |
| `POST /api/polls/[id]/vote` | 15 / min | IP |
| `POST /api/events/[id]/like` | 15 / min | userId |
| `POST /api/events/[id]/vote` | 20 / min | userId |
| `GET /api/events/random` | 30 / min | IP |
| `GET /api/tags` | 60 / min | IP |
| `POST /api/generate-image` | 5 / min (auth) · 2 / min (anon) | userId / IP |
| `POST /api/chat` | 15 / min | IP |
| `GET /api/support/messages/[chatId]` | 30 / min | userId |
| `POST /api/admin/events/batch` | 30 / min | userId |
| `POST /api/admin/users/batch` | 30 / min | userId |
| `POST /api/webhooks/stripe` | — | Stripe signature (exempt) |
| `GET /api/collaborators/[eventId]` | 60 / min | IP |
| `PATCH /api/collaborators/[eventId]` | 30 / min | IP |
| `DELETE /api/collaborators/[eventId]` | 20 / min | IP |
| `POST /api/collaborators/invite` | 10 / min | IP |

All rate-limited endpoints return `429 Too Many Requests` with a `Retry-After` header on violation.

> **Note:** This implementation is in-memory and works well for single-instance deployments. For multi-instance or edge deployments (Vercel, etc.), replacing with `@upstash/ratelimit` + Redis is recommended.

---

### 12. Billing & Subscription Plans

Billing logic is spread across:

* `src/app/lib/plans.ts` – Plan metadata (slug, features, pricing tiers).
* `src/app/lib/stripe-actions.ts` – Checkout, portal, and subscription-related actions.
* `src/app/api/webhooks/stripe/route.ts` – Stripe webhook handler.
* `src/app/premium/page.tsx` – Pricing / upsell page.
* `src/components/premium/*` – `PricingSection`, `CheckoutButton`, `ManageButton`.

User subscription data is persisted in the `User` model:

* `subscriptionStatus`
* `stripeCustomerId`
* `stripeSubscriptionId`
* `stripePriceId`
* `subscriptionEndDate`
* `cancelAtPeriodEnd`

The dashboard and event statistics use these fields to conditionally enable premium features.

---

## 🛠️ Tech Stack

Core stack:

* **Framework:** Next.js (App Router, RSC, Server Actions)
* **Language:** TypeScript
* **Frontend:** React, Tailwind CSS, Framer Motion
* **Backend:** Node.js (via Next.js runtime)
* **ORM:** Prisma
* **Database:** PostgreSQL
* **Auth:** NextAuth + @auth/prisma-adapter
* **Payments:** Stripe
* **Mail:** Resend (email verification, transactional emails, notification emails)
* **Real-time:** Pusher (WebSocket channels for collaborative editing, permission sync)
* **AI (Chat):** Google Gemini (`gemini-2.5-flash-lite`) via `@google/generative-ai`
* **AI (Images):** Pollinations AI (parallel free models: klein · flux · zimage, fallback to p-image)
* **Guided tours:** Shepherd.js (step-by-step interactive onboarding)
* **3D / Visuals:** `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`
* **Validation:** Zod
* **Utilities:** date-fns, clsx, use-debounce, canvas-confetti, bcryptjs, ldrs

---

## 📦 Selected Dependencies

Some key packages used throughout the project:

```txt
@auth/prisma-adapter
@google/generative-ai
@hello-pangea/dnd
@pmndrs/assets
@pmndrs/branding
@prisma/client
@react-spring/web
@react-three/drei
@react-three/fiber
@react-three/postprocessing
bcryptjs
canvas-confetti
clsx
date-fns
framer-motion
ldrs
lucide-react
resend
use-debounce
zod
```

---

## 📜 Tooling & NPM Scripts

The project defines a set of scripts for development, database workflows, and quality checks (from `package.json`):

* `dev` – Development server
* `prodev` – Development with production-like settings
* `build` – Next.js production build
* `start` – Start the production server
* `lint` – Run ESLint

Database-related scripts:

* `db:reset` – Reset and reseed the database
* `db:push` – `prisma db push`
* `db:seed` – Execute `prisma/seed.ts`
* `db:studio` – Launch Prisma Studio
* `db:migrate` – Apply migrations

These scripts are used throughout the development workflow to iterate on both schema and application behavior.

---

## 📁 Project Structure (High-Level)

```text
.
├── prisma/
│   ├── migrations/          # Full migration history
│   ├── schema.prisma        # Main Prisma schema
│   └── seed.ts              # Seed script
├── public/                  # Static assets
├── src/
│   ├── app/
│   │   ├── admin/           # Admin dashboard
│   │   ├── api/             # API routes (auth, polls, events, support, webhooks, AI)
│   │   ├── auth/            # Email verification flow
│   │   ├── dashboard/       # User dashboard & event management
│   │   ├── unsubscribe/     # Email unsubscribe confirmation page
│   │   ├── e/[slug]/        # Public voting flow for events
│   │   ├── polls/           # Public poll discovery & results (with filters + pagination)
│   │   ├── login/           # Login page
│   │   ├── logout/          # Logged-in guard explanation page
│   │   ├── register/        # Registration page
│   │   ├── premium/         # Pricing / subscriptions
│   │   ├── legal/           # Legal pages (terms, privacy, cookies)
│   │   ├── about/           # About page
│   │   ├── maintenance/     # Maintenance / holding page
│   │   └── page.tsx         # Landing page
│   ├── components/
│   │   ├── dashboard/       # Dashboard components (tabs, forms, stats, lists)
│   │   ├── admin/           # Admin-only UI
│   │   ├── polls/           # Public poll UI (cards, filters, explore)
│   │   ├── premium/         # Billing & pricing components
│   │   ├── home/            # Landing, hero, 3D award mockup
│   │   ├── ui/              # Shared UI primitives (TagsInput, etc.)
│   │   └── shared UI        # Navbar, forms, confetti, etc.
│   ├── lib/
│   │   ├── prisma.ts        # Prisma client singleton
│   │   ├── config.ts        # App configuration
│   │   ├── plans.ts         # Plan definitions
│   │   ├── tokens.ts        # Token generation helpers
│   │   ├── mail.ts          # Email sending helpers (all transactional templates)
│   │   ├── unsubscribe.ts   # HMAC-signed unsubscribe token generation & verification
│   │   ├── pusher.ts        # Pusher server/client + channel helpers + event names
│   │   ├── validations.ts   # Zod schemas
│   │   ├── countResults.ts  # Result aggregation helpers
│   │   ├── rate-limit.ts    # Sliding-window in-memory rate limiter
│   │   ├── *_actions.ts     # Server Actions for each domain area
│   │   └── stripe-actions.ts# Stripe integration helpers
│   ├── middleware.ts        # Route guarding, voter_id cookie, cross-cutting concerns
│   └── types/next-auth.d.ts # NextAuth type augmentation
└── reset-password.ts        # Standalone entry for password reset
```

---

## ✅ Testing & Quality

* `src/__test__/results.test.ts` covers result aggregation logic.
* ESLint is configured via `eslint.config.mjs`.
* TypeScript is used across the entire codebase (`strict`-oriented setup).
* The codebase is organized to keep **UI**, **server actions**, and **business logic** cleanly separated, making it easier to extend or refactor.

---

## 🎓 Learning Focus

This project served as a deep-dive into:

* Designing a **non-trivial relational schema** (with many migrations and iterative improvements).
* Structuring a large **Next.js App Router** application with:

  * Multiple segments (public, dashboard, admin)
  * Mixed Server/Client components
  * Server Actions as the main mutation layer.
* Implementing **secure anonymous voting** with:

  * Cookie-based identity
  * Hashing
  * Duplicate prevention.
* Adding **real subscription tiers** using Stripe and handling webhooks safely.
* Building a real-world level **admin panel**, **support system**, and **notification layer**.
* Integrating **AI features**: Gemini-powered chat assistant and Pollinations AI image generation with multi-model fallback.
* Designing a **community engagement layer**: event likes, upvote/downvote ratings, tag-based discovery, and sort/filter exploration.
* Protecting a public API surface with **rate limiting** across all endpoints.
* Building a **real-time collaborative editing system** with Pusher: granular permission inheritance, bidirectional live sync between event owner and collaborators, and instant UI updates without page reloads.
* Designing a **transactional email system** with per-user opt-out preferences, stateless HMAC-signed unsubscribe tokens, and deliverability hardening (plain-text alternatives, specific subject lines, `List-Unsubscribe` headers).
* Polishing UX with motion, dark theme, and consistent component patterns.

This repository is intended as a **complete, production-style reference** for a modern SaaS-like voting platform, showcasing how all these pieces can work together coherently in a single codebase.

---

Last update: 8/4/2026 — v2.4 (admin promotions system, welcome bonus, subscription expiry cron, raffles, announcement bar, /empresas B2B page)

### v2.3 — 8/4/2026

#### Help & Onboarding system

A floating **help button** (bottom-right, authenticated users only) provides three entry points:

* **Tour por la web** — 7-step Shepherd.js walkthrough of the main dashboard sections (tabs, events, notifications, profile). Works whether the user is already on `/dashboard` or navigating from elsewhere, using a custom browser event (`pollnow:tour`) to avoid soft-navigation issues.
* **Tutorial visual** (`/help/create-event`) — static step-by-step guide with a videogame-themed example event ("Premios Videojuegos del Año"), visual mockups for each creation step, and 6 real-world event type ideas.
* **Tour guiado** — interactive Shepherd.js walkthrough that walks the user through the create-event form in real time (opens modal, highlights name/description/submit). Locked if the user has reached their event quota.

Implementation details:

* `HelpButtonWrapper` (server component) checks auth + plan quota; passes `canCreateMore` to the client `HelpButton`.
* `DashboardGuidedTour` (headless client component inside `DashboardTabs`) handles both URL-param (`?tour=web/create`) and custom-event triggers.
* All tour target elements are decorated with `tour-*` CSS classes and `data-tour-tab` attributes.

#### AI image generation acceleration

Free models (`klein`, `flux`, `zimage`) now run **in parallel** via a custom `Promise`-based race (not `Promise.race`, to handle the "all failed" case). The first successful response wins; `p-image` is used as a paid fallback only if all free models fail. Generation loading animation replaced with animated gradient blobs.

#### Legal pages rewrite (Spanish/EU law)

`/legal/terms`, `/legal/privacy`, and `/legal/cookies` fully rewritten to comply with **LSSI-CE**, **LOPDGDD**, and **GDPR**:

* Terms: 15 sections covering AI policy, age minimum 14, force majeure, ODR link.
* Privacy: subprocessors table (Neon, Vercel, Pusher, Resend, Stripe, Pollinations), 72h breach notification, AEPD complaint section, data retention periods.
* Cookies: complete cookie tables with all fields, browser-specific management links.

#### Admin broadcast emails (`/admin/emails`)

New ADMIN-only section in the admin panel:

* Rich email composer with 5 visual templates (indigo, amber, emerald, rose, slate).
* Live HTML preview in an iframe using the same `buildBroadcastEmailHtml()` function used server-side.
* Recipient filters: all users, premium only, free only, or custom user search with autocomplete.
* Confirmation modal before sending; results banner with sent/failed counts.
* Sends in chunks of 100 via `resend.batch.send()`; logs to `ModerationLog` with `actionType: "BROADCAST_EMAIL"`.
* Rate-limited to 5 req/min.

#### Prisma migration fix (Neon advisory lock)

`prisma.config.ts` updated to use `DATABASE_URL_UNPOOLED` for the `datasource` block. Neon's pooled connection (PgBouncer) does not support `pg_advisory_lock`, which caused `prisma migrate deploy` to time out. The direct connection bypasses the pooler and resolves the issue.

---

### v2.4 — 8/4/2026

#### Admin Promotions system (`/admin/promotions`)

New ADMIN-only section in the admin panel with three independent tools:

**Welcome bonus**

* Toggle to enable/disable a global welcome bonus applied to every new user at registration.
* Configurable plan (`premium`, `plus`, `unlimited`) and duration (days).
* Applied automatically in `auth-actions.ts` after `prisma.user.create` — checks `PromotionConfig` singleton and calls `applyWelcomeBonus()` if active.
* Sets `subscriptionEndDate`, `subscriptionStatus: "active"`, `welcomeBonusApplied: true` on the new user row.

**Subscription expiry cron**

* New API route `GET /api/cron/expire-subscriptions` authenticated via `Authorization: Bearer CRON_SECRET`.
* Runs **daily at 04:00 UTC** via Vercel Cron Jobs (`vercel.json` `"crons"` array).
* Bulk-updates users where `stripeSubscriptionId` is null, `subscriptionStatus = "active"`, and `subscriptionEndDate < now()` → resets them to free tier.
* `getPlanFromUser` in `src/lib/plans.ts` also checks expiry **in real time** (no DB call — uses the already-loaded user object) so plan downgrades are instant even between cron runs.

**Raffles**

* Full CRUD for raffles: title, description, deadline, participation condition (`all_users` / `registered_before_deadline`), optional max participants, optional counter display.
* Status lifecycle: `ACTIVE` → `WINNER_SELECTED` → `CLOSED`.
* Winner selection: random pick from eligible users or manual override from the eligible-users list.
* Each raffle can optionally show a custom message in the global announcement bar.

**New `CRON_SECRET` env var required in Vercel** to authenticate cron requests.

#### Global Announcement Bar

* Singleton `AnnouncementBar` DB record (id `"global"`), managed from the promotions panel.
* Configurable text (up to 300 chars), optional link + link label, active/inactive toggle.
* Rendered via `AnnouncementBarWrapper` (server component, ISR cached 60 s with tag `"announcement"`) above the Navbar in the root layout.
* `AnnouncementBarClient` shows a red scrolling marquee; users can dismiss it (stored in `localStorage` keyed by record ID). Cache invalidated instantly via `revalidateTag("announcement")` on any admin update.

#### /empresas B2B page

New public marketing page targeting corporate clients:

* **Hero** section with orange/red gradient, tagline, and two CTAs (contact + live demo).
* **UseCases** — 6 illustrated business scenarios (team awards, hackathons, employee recognition, etc.).
* **HowItWorks** — 3-step visual guide.
* **WhatsIncluded** — feature checklist with Lucide icons.
* **Pricing** — single 499 € one-time corporate licence card with mailto CTA.
* **PrivateNegotiation** — prompt for large orgs to reach out for custom pricing.
* **FAQ** — animated accordion with common enterprise questions.
* All CTAs use `mailto:contacto@pollnow.es` with pre-filled subject/body.

**New `NEXT_PUBLIC_DEMO_EVENT_URL` env var** points the demo CTA to a live event URL.

#### Icon polish

All literal `←` arrow characters across the codebase replaced with the Lucide `<ArrowLeft />` icon for consistent sizing and hover animations (`/login`, `/register`, `/logout`, `ResultsClient`, `ProfileForm`).

> Made with ♥️ by Rayelus
> <br>
> <a href="https://pollnow.es">Pollnow</a> © 2026 by <a href="https://dev.rayelus.com">Raimundo Palma</a> is licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a><img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/sa.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">
