---
title: Documentación de Pollnow
updated: 2026-05-24
---

# 📚 Documentación de Pollnow

Pollnow es un SaaS de **galas digitales y votaciones interactivas** en Next.js 16. Esta es
la documentación técnica del proyecto (v3.0).

## TL;DR

Crea eventos de premios, comparte un enlace, recibe votos (anónimos o autenticados) y revela
los resultados en directo. Backend optimizado, rate limiting distribuido, caché por capas,
planes gestionables desde admin y SEO técnico completo.

## Empezar por aquí

- 🆕 **Nuevo en el proyecto** → [Visión general](./01-overview/README.md) → [Puesta en marcha](./02-getting-started/setup.md)
- 🏗️ **Entender cómo funciona** → [Arquitectura](./03-architecture/overview.md)
- 🚢 **Desplegar / configurar** → [Variables de entorno](./07-infrastructure/environments.md)

## Índice

### 01 · Overview
- [Visión general y modelo de dominio](./01-overview/README.md)
- [Referencia completa heredada (README v2.5, 900+ líneas)](./01-overview/full-reference.md)

### 02 · Getting started
- [Puesta en marcha](./02-getting-started/setup.md)

### 03 · Arquitectura
- [Modelo de runtime, rendering y caché](./03-architecture/overview.md)

### 04 · Subsistemas
- [Modos de evento (Gala, Tierlist, Preguntas, Dibujo)](./04-subsystems/event-modes.md)
- [Planes y facturación (SubscriptionPlan en BD + Stripe)](./04-subsystems/billing-plans.md)
- [Bug Bounty (reportes de bugs + panel admin)](./04-subsystems/bug-bounty.md)
- [Sistema de Ingresos (pagos, saldo y retiros Bizum)](./04-subsystems/ingresos.md)

### 05 · API
- [Rate limiting (Upstash)](./05-api/rate-limiting.md)

### 06 · SEO
- [SEO técnico (sitemap, robots, JSON-LD, OG images)](./06-seo/seo.md)

### 07 · Infraestructura
- [Variables de entorno](./07-infrastructure/environments.md)
- [Redis (Upstash): rate limiting + contadores](./07-infrastructure/redis-upstash.md)

### 10 · Changelog
- [Changelog](./10-changelog/CHANGELOG.md)
- [v3.0 — Performance, SEO, Rate limiting & Planes en BD](./10-changelog/v3.0.md)

## Otros recursos

- [DESIGN.md](../DESIGN.md) — guía de estilo visual (capturada del diseño actual).
- [MIGRATION_GUIDE_v3.0.md](../MIGRATION_GUIDE_v3.0.md) — pasos de migración a v3.0.
- [PREGUNTAS.md](../PREGUNTAS.md) — 80 preguntas/respuestas de referencia.
