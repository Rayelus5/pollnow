# Pollnow

> Plataforma de **eventos de votación interactiva** en tiempo real. Crea galas tipo "Game Awards", tierlists, formularios o concursos de dibujo, invita a tu comunidad y revela los resultados en directo.

**Versión:** 3.0 · **Stack:** Next.js 16 · React 19 · Prisma + PostgreSQL (Neon) · Tailwind v4

---

## ✨ Funcionalidades

- 🎭 **4 modos de evento** — **Gala** (premios por categorías), **Tierlist** (ordenar nominados en tiers), **Preguntas** (formulario tipo test) y **Dibujo** (estilo Gartic Phone). Ver [event-modes](./docu/04-subsystems/event-modes.md).
- 🏆 **Modo Gala** — resultados sellados hasta la fecha del evento, revelados con confeti.
- 🔒 **Voto anónimo** — un voto por persona vía huella digital, sin registro forzoso.
- 🎨 **Modo Dibujo** — lienzo HTML5 propio, votación por lotes a escala, almacenamiento en Vercel Blob.
- 🖼️ **Imágenes de nominados** — manual, por URL, generadas con IA o **buscadas en internet** (Pexels + Wikimedia).
- 👥 **Colaboración en equipo** — invita colaboradores con permisos granulares.
- 📊 **Estadísticas por modo** — resultados, timeline de actividad, votantes.
- 🌐 **Explorador público** — directorio de eventos con búsqueda, etiquetas, likes y votos.
- 💳 **Planes de suscripción** — Free → Premium / Plus / Unlimited / Enterprise (Stripe), gestionables desde admin.
- 🛡️ **Panel admin** — moderación, usuarios, soporte, promociones y **gestión de planes**.
- ⚡ **Rate limiting distribuido**, caché por capas y SEO técnico (sitemap, OG, JSON-LD).

## 🧱 Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router, RSC, Server Actions) |
| UI | React 19, Tailwind CSS v4, Framer Motion, lucide-react |
| Base de datos | PostgreSQL (Neon) vía Prisma |
| Auth | Auth.js (NextAuth) |
| Pagos | Stripe |
| Rate limiting / caché | Upstash Redis |
| Tiempo real | Pusher |
| Hosting | Vercel |

## 🚀 Empezar en 5 minutos

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno (ver docu/07-infrastructure/environments.md)
cp .env.example .env   # y rellena los valores

# 3. Sincronizar el esquema con la base de datos
npx prisma db push     # ⚠️ usamos db push, NO migrate (ver nota abajo)
npx prisma generate

# 4. Arrancar en desarrollo
npm run dev            # http://localhost:3000
```

> **Nota sobre la BD:** este proyecto usa **`prisma db push`** (no `migrate dev/deploy`).
> La base de datos tiene drift histórico respecto al historial de migraciones, así que
> `migrate` intentaría resetearla. Ver `docu/07-infrastructure/environments.md`.

> Comandos de Prisma siempre con `npx` (p.ej. `npx prisma studio`).

## 📚 Documentación

La documentación completa vive en [`/docu`](./docu/INDEX.md):

- [Visión general y modelo de dominio](./docu/01-overview/README.md)
- [Puesta en marcha](./docu/02-getting-started/setup.md)
- [Arquitectura y runtime](./docu/03-architecture/overview.md)
- [Modos de evento (Gala, Tierlist, Preguntas, Dibujo)](./docu/04-subsystems/event-modes.md)
- [Planes y facturación](./docu/04-subsystems/billing-plans.md)
- [Rate limiting](./docu/05-api/rate-limiting.md)
- [Redis (Upstash)](./docu/07-infrastructure/redis-upstash.md)
- [Variables de entorno](./docu/07-infrastructure/environments.md)
- [SEO técnico](./docu/06-seo/seo.md)
- [Changelog](./docu/10-changelog/CHANGELOG.md)
- [Referencia completa heredada (README v2.5)](./docu/01-overview/full-reference.md)
- [Guía de diseño](./DESIGN.md)

## 🧪 Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Servidor de producción |
| `npx prisma studio` | Explorador visual de la BD |
| `npx prisma db push` | Sincroniza el esquema con la BD |

---

© Pollnow — Creado por Rayelus.
