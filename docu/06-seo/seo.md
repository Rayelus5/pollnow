---
title: SEO técnico
updated: 2026-05-22
---

# SEO técnico

URL base canónica: **`https://pollnow.es`** (definida en `metadataBase` del layout).

## Metadata por página

- **Layout** (`app/layout.tsx`): metadata global (title template, OG por defecto) +
  JSON-LD `Organization` y `WebSite` (con `SearchAction` → `/polls?q=`).
- **`/`**: `metadata` estática + canonical.
- **`/polls`**: `generateMetadata` dinámica (varía por `?tag=` / `?q=`) + canonical.
- **`/e/[slug]`**: `generateMetadata` dinámica (título, descripción, OG, Twitter, canonical
  sin `?key=`). **noindex** si el evento no es público o no está aprobado.
- **`/premium`**: `metadata` estática + canonical.
- **`/empresas`**: `metadata` propia. **`/about`** es client component → hereda los defaults
  del layout.

## JSON-LD

- `Organization` + `WebSite` (`SearchAction`) — en el layout.
- `Event` — en `/e/[slug]` (solo públicos aprobados). Valida en Rich Results Test.

## OG images dinámicas

- `app/opengraph-image.tsx` — genérica (wordmark + tagline), 1200×630.
- `app/e/[slug]/opengraph-image.tsx` — por evento (título + organizador, solo públicos
  aprobados). Generadas con `next/og` (`ImageResponse`).

## Sitemap y robots

- `app/sitemap.ts` → `/sitemap.xml`: rutas estáticas + eventos `isPublic && APPROVED`
  (`lastModified`, prioridades). Revalida cada 1h. Límite 5000 eventos
  (fragmentar con sitemap index si se supera).
- `app/robots.ts` → `/robots.txt`: allow público; disallow `/dashboard`, `/admin`, `/api`,
  `/maintenance`, `/logout`; enlaza el sitemap.

## Pendiente (v3.1)

- `BreadcrumbList` y `FAQPage` JSON-LD (rich results menores).
- Fuentes custom en OG images (ahora usan sans del sistema).
