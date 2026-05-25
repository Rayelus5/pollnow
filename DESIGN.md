# Pollnow — Design System

> **Propósito**: Esta guía documenta el estilo visual **real y actual** de Pollnow. No es un rediseño: captura el lenguaje que ya existe en la web para que cualquier componente nuevo o cambio en el front se construya con la misma identidad. Si vas a crear algo nuevo, **cópialo de aquí**.

**Stack visual**: Next.js 16 · Tailwind CSS v4 · Framer Motion · lucide-react · fuente **Inter** (`next/font/google`).

---

## 1. Filosofía visual

Pollnow es una plataforma de **galas digitales** que quiere parecer "una producción de TV". El estilo es:

- **Oscuro y cinematográfico** — fondo casi negro, superficies translúcidas, profundidad por capas.
- **Premium y limpio** — mucho espacio en negro, tipografía grande y apretada (`tracking-tighter`), jerarquía clara.
- **Vivo** — animaciones de entrada con blur+desplazamiento, "blobs aurora" de fondo, micro-interacciones en hover/tap.
- **Acento azul-cielo** — el azul (`blue → sky`) es el color de marca para acciones e interacción; los CTA principales son **blancos sobre negro**.

Regla de oro: **superficie translúcida (`white/5`) + borde de 2px (`border-2 border-white/10`) + esquinas redondeadas generosas**. Ese trío aparece en casi todo.

---

## 2. Color

No usamos tokens custom: usamos la **paleta estándar de Tailwind** directamente. Estas son las convenciones reales.

### Fondos (de más oscuro a más claro)
| Uso | Clase |
|-----|-------|
| Fondo raíz de la app (`body`) | `bg-black` |
| Fondo de secciones / landing | `bg-neutral-950` |
| Superficie de tarjeta (sólida) | `bg-neutral-900/50`, `bg-neutral-900/40` |
| Superficie translúcida (glass) | `bg-white/5` |
| Superficie hover | `bg-white/10` |
| Caja interna / icon box | `bg-black/50` |

### Texto
| Uso | Clase |
|-----|-------|
| Texto principal / títulos | `text-white` |
| Texto fuerte secundario | `text-gray-200`, `text-gray-300` |
| Texto cuerpo / descripciones | `text-gray-400` |
| Texto apagado / labels / meta | `text-gray-500` |
| Texto muy apagado / placeholders | `text-gray-600` |

### Acento de marca (azul → cielo)
| Uso | Clase |
|-----|-------|
| Acento interactivo, foco, subrayados | `blue-500`, `blue-600` |
| Degradado de marca (botones/CTA) | `bg-gradient-to-r from-blue-600 to-sky-500` |
| Glow azul | `shadow-blue-900/30`, `shadow-blue-900/20` |
| Hover de borde | `hover:border-blue-500/40`, `hover:border-blue-500/50` |

### Acento Premium
Premium tiene su propio matiz **índigo con glow**:
```html
text-indigo-400 drop-shadow-[0_0_8px_rgba(150,100,200,0.8)]
```

### Colores semánticos (consistentes en toda la app)
| Significado | Color base | Patrón de uso |
|-------------|-----------|---------------|
| Éxito / voto positivo / público | `green` / `emerald` | `text-emerald-400`, badge `bg-green-900/30 text-green-400` |
| Error / destructivo / voto negativo | `red` | `text-red-400`, `border-red-500/20`, `bg-red-500/10` |
| Aviso / privado / "Finalizado" | `yellow` / `amber` | `text-yellow-400`, `bg-yellow-900/30`, badge ámbar |
| Likes | `rose` | `text-rose-400`, `fill-rose-400` |
| Trofeo / gala | `yellow-400` | iconos de premio |
| B2B / empresas (CTA especial) | `orange → amber` | `bg-gradient-to-r from-orange-500 to-amber-500` |

**Badge de estado (patrón reutilizable)**: `bg-{color}-900/30 text-{color}-400` con `rounded-full px-3 py-1 text-xs font-bold`.

---

## 3. Tipografía

Fuente única: **Inter** (`inter.className` aplicada en `<body>`). Sin fuentes display extra.

| Nivel | Clases |
|-------|--------|
| Hero (H1 landing) | `text-5xl md:text-8xl font-extrabold tracking-tighter text-white` |
| H2 sección grande | `text-4xl md:text-6xl font-bold tracking-tight` |
| H2 sección media | `text-3xl md:text-5xl font-bold tracking-tight` |
| Título de tarjeta | `text-2xl font-bold` / `text-xl font-bold` |
| Cuerpo destacado | `text-lg md:text-xl text-gray-400 leading-relaxed` |
| Cuerpo | `text-sm` / `text-base text-gray-400` |
| Meta / caption | `text-xs text-gray-500` |
| **Label de formulario** | `text-xs font-bold text-gray-500 uppercase tracking-widest` |
| Etiqueta mono / categoría | `text-xs font-mono uppercase tracking-[0.2em]` |

**Títulos con degradado** (recurso de marca):
```html
<h1 class="bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">…</h1>
```
Pesos habituales: `font-bold` y `font-extrabold`. El `tracking-tighter` / `tracking-tight` en titulares es una firma del estilo.

---

## 4. Bordes y radios

### Bordes — la firma de Pollnow: `border-2`
Pollnow usa **bordes de 2px** casi siempre (no `border` de 1px). Color por opacidad de blanco:
- Borde estándar: `border-2 border-white/10`
- Borde de tarjeta más marcado: `border-2 border-white/15` o `border-white/20`
- Borde sutil: `border-2 border-white/5`
- Hover: sube la opacidad o pasa a azul → `hover:border-white/20`, `hover:border-blue-500/40`

### Radios (border-radius)
| Radio | Uso |
|-------|-----|
| `rounded-full` | Botones, pills, badges, avatares, chips de filtro |
| `rounded-3xl` | Tarjetas grandes, contenedores principales, modales |
| `rounded-2xl` | Tarjetas de dashboard, icon-boxes, cajas medianas |
| `rounded-xl` | Inputs, items de menú móvil, botones de formulario |
| `rounded-lg` | Caja de logo, mensajes de error pequeños |

Regla: cuanto más grande/protagonista el elemento, mayor el radio. Los **inputs y botones de formulario** usan `rounded-xl`; los **CTA y pills** usan `rounded-full`.

---

## 5. Botones

### CTA primario (blanco) — la acción principal de cada pantalla
```html
<a class="group px-8 py-4 bg-white text-black rounded-full font-bold text-lg
          hover:bg-gray-200 transition-all
          shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]
          hover:scale-105 active:scale-95 flex items-center gap-2">
  <Sparkles size={18} /> Empezar Gratis
</a>
```

### CTA degradado (azul→cielo) — acción de conversión / submit destacado
```html
<a class="inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold text-xl text-white
          bg-gradient-to-r from-blue-600 to-sky-500
          shadow-lg shadow-blue-900/30 hover:scale-105 transition-transform group">
  Crear Cuenta Gratis <ArrowRight class="group-hover:translate-x-1 transition-transform" />
</a>
```

### Botón secundario / ghost
```html
<a class="px-8 py-4 bg-white/5 border-2 border-white/10 text-white rounded-full font-bold text-lg
          hover:bg-white/10 hover:border-white/20 transition-all">
  Explorar Eventos
</a>
```

### Submit de formulario
```html
<button class="w-full bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold py-4 rounded-xl
               shadow-lg shadow-blue-900/20
               hover:scale-[1.02] active:scale-[0.98] transition-all
               disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
  Iniciar Sesión
</button>
```

### Botón destructivo (icono)
```html
<button class="text-red-400 hover:text-red-300 p-3 border-2 border-red-500/20 rounded-full
               hover:bg-red-500/10 transition-colors cursor-pointer">
  <LogOut size={16} />
</button>
```

**Convenciones de botón**: `font-bold`, `cursor-pointer`, `transition-all`, micro-escala en hover/tap (`hover:scale-105 active:scale-95` o `[1.02]/[0.98]`), e iconos `lucide-react` a la izquierda o flecha que se desplaza a la derecha en hover.

---

## 6. Inputs y formularios

```html
<div class="space-y-2">
  <label class="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email</label>
  <input class="w-full p-4 rounded-xl bg-white/5 border-2 border-white/20 text-white
                placeholder-gray-600 transition-all
                focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
</div>
```
- Inputs siempre `bg-white/5 border-2 border-white/20`, `rounded-xl`, padding `p-4`.
- Foco: `focus:border-blue-500 focus:ring-1 focus:ring-blue-500` (sin outline nativo).
- Espaciado vertical del form: `space-y-6`; label+input agrupados con `space-y-2`.

### Mensaje de error
```html
<div class="p-3 bg-red-500/10 border-2 border-red-500/20 rounded-lg flex items-center gap-2
            text-red-400 text-sm animate-in fade-in slide-in-from-top-1">
  <svg>…icono alerta…</svg> <p>{mensaje}</p>
</div>
```

---

## 7. Tarjetas y superficies

### Tarjeta translúcida (landing / pública)
```html
<div class="p-8 rounded-3xl bg-white/5 border-2 border-white/5
            hover:border-blue-500/30 hover:bg-white/10 transition-colors duration-300 group">
  …
</div>
```

### Tarjeta de contenido (evento público)
```html
<div class="group relative flex flex-col h-full bg-neutral-900/40 border-2 border-white/15 rounded-3xl
            overflow-hidden hover:border-blue-500/40 transition-colors duration-500">
  <!-- glow de hover -->
  <div class="absolute inset-0 bg-gradient-to-br from-blue-600/0 via-transparent to-purple-600/0
              group-hover:from-blue-600/10 group-hover:to-sky-600/10 transition-all duration-500" />
  <div class="p-7 relative z-10">…</div>
</div>
```

### Tarjeta de dashboard
```html
<div class="bg-neutral-900/50 border-2 border-white/15 rounded-2xl p-6 transition-all
            hover:border-blue-500/50 hover:bg-neutral-900 cursor-pointer">…</div>
```
Variante "compartido/colaborador" → borde verde con glow: `border-green-500/40 hover:border-green-400/70 shadow-[0_0_20px_-8px_rgba(34,197,94,0.3)]`.

### Icon-box (dentro de tarjetas)
```html
<div class="p-4 bg-black/50 rounded-2xl w-fit border-2 border-white/5
            group-hover:border-white/20 transition-colors">
  <Trophy class="text-yellow-400" size={32} />
</div>
```

### Glass panel (utilidad existente en `globals.css`)
```css
.glass-panel { background: rgba(255,255,255,0.03); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.08); }
```

---

## 8. Badges, pills y chips

- **Badge de estado**: `inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium` + color semántico (`bg-{c}-900/30 text-{c}-400`).
- **Badge "live"** (con punto que late):
```html
<span class="relative flex h-2 w-2">
  <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
  <span class="relative rounded-full h-2 w-2 bg-green-500"></span>
</span>
```
- **Chip de filtro / pill**: `rounded-full px-3.5 py-2 text-xs font-semibold border-2`, activo `border-blue-500/60 bg-blue-500/15 text-blue-300`, inactivo `border-white/10 text-gray-500 hover:text-gray-300`.
- **Tag de etiqueta**: `text-[10px] bg-blue-500/8 text-blue-400/70 border-2 border-blue-500/20 px-2 py-0.5 rounded-full`.

---

## 9. Movimiento (Framer Motion)

El motion es parte central de la identidad. Patrones reutilizables:

### Entrada con stagger (contenedor + items)
```ts
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};
const itemVariants: Variants = {
  hidden: { y: 30, opacity: 0, filter: "blur(8px)" },
  visible: { y: 0, opacity: 1, filter: "blur(0px)", transition: { duration: 0.8, ease: "easeOut" } },
};
```
La firma de entrada de Pollnow es **`y: 30 + opacity: 0 + blur(8px)` → asentado**, con duración ~0.6–0.8s `easeOut`.

### Micro-interacciones
- Hover de tarjeta: `whileHover={{ y: -10 }}` o escala; en CSS `hover:scale-105`.
- Tap: `whileTap={{ scale: 0.95 }}`.
- Secciones que aparecen al hacer scroll: `whileInView="visible" viewport={{ once: true, margin: "-100px" }}`.

### Blobs "Aurora" de fondo (hero / pantallas destacadas)
Círculos grandes, muy difuminados (`blur-[100px]`–`blur-[120px]`), con animación lenta de `scale`/`opacity`/posición y opacidades bajas (0.05–0.2). Colores que cambian según el contexto. Siempre `pointer-events-none` y detrás del contenido (`-z-10`).

### Shimmer de texto
Barra de gradiente blanco que cruza el texto (`bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-12`, animando `x` de `-100%` a `200%`).

### Accesibilidad de motion
Respetar `prefers-reduced-motion` cuando se añadan nuevas animaciones (reducir duraciones / desactivar bucles infinitos).

---

## 10. Efectos y profundidad

- **Blur de fondo (navbar/overlays)**: `backdrop-blur-xl`, `backdrop-blur-sm`.
- **Glow shadows**: `shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]` (blanco), `shadow-blue-900/30` (azul). El glow tintado refuerza el color del elemento.
- **Overlays de carga**: `absolute inset-0 z-20 bg-black/50 backdrop-blur-[5px]` + spinner (`ldrs`: DotPulse, LineSpinner, Bouncy — color `white`).
- **Separadores**: línea de 1px con degradado `bg-gradient-to-r from-transparent via-white/10 to-transparent`, o `border-t-2 border-white/15` (footer).
- **Confeti** en momentos de gala/celebración.

---

## 11. Navegación y layout

- **Navbar fija**: `fixed top-0 z-50 bg-black/80 backdrop-blur-xl border-b-2 border-white/20`, altura `h-16`. Se desplaza si hay announcement bar (`[.has-announcement_&]:top-9`).
- **NavLink** con subrayado animado azul: `bg-blue-500` que crece de `w-0` a `w-full` (activo = `w-full`, texto `text-white`; inactivo = `text-gray-400 hover:text-white`).
- **Footer**: `py-8 text-center text-sm text-gray-300 border-t-2 border-white/15`, enlaces `hover:text-white`.
- **Contenedor de página**: `max-w-7xl mx-auto px-6`. Padding superior por navbar: `pt-16` (o `pt-32`+ en páginas con hero).
- **Grids**: `grid md:grid-cols-2 lg:grid-cols-3 gap-6` / `gap-8`.

---

## 12. Iconografía

- Librería única: **lucide-react** (imports nombrados).
- Tamaños habituales: `16` (inline/botones pequeños), `18` (botones), `24` (navbar/acciones), `32` (features).
- Los iconos toman color semántico (`text-yellow-400` trofeo, `text-green-400` candado, `text-purple-400` paleta, etc.).

---

## 13. Espaciado

- Padding de tarjeta: `p-6` (dashboard), `p-7`, `p-8` (landing/destacadas).
- Padding de botón: `px-8 py-4` (CTA), `px-10 py-5` (CTA grande), `py-4` (submit full-width).
- Gaps: `gap-2`/`gap-3` (inline), `gap-4` (grupos de botones), `gap-6`/`gap-8` (grids/secciones).
- Ritmo vertical de formularios: `space-y-2` (campo), `space-y-6` (formulario).
- Secciones de página: `py-10` a `py-40` según protagonismo (hero/CTA usan mucho aire).

---

## 14. Checklist para componentes nuevos

Antes de dar por terminado un componente, comprueba:

- [ ] Fondo coherente: `bg-black` / `bg-neutral-950` (página) o `bg-white/5` / `bg-neutral-900/50` (superficie).
- [ ] Bordes **`border-2`** con opacidad de blanco (`border-white/10–20`), no `border` de 1px.
- [ ] Radio adecuado: `rounded-full` (pills/botones), `rounded-3xl`/`2xl` (tarjetas), `rounded-xl` (inputs).
- [ ] Texto en la escala de grises correcta (`white` → `gray-600`), nunca negro puro sobre fondo oscuro.
- [ ] Acento azul (`blue-500`/`from-blue-600 to-sky-500`) para interacción; semánticos para estado.
- [ ] Hover/tap con transición (`transition-colors`/`transition-all`) y micro-escala donde aplique.
- [ ] Tipografía Inter, titulares con `tracking-tight`/`tighter` y peso `bold`/`extrabold`.
- [ ] Iconos de lucide-react con tamaño y color coherentes.
- [ ] Motion de entrada con el preset `y+opacity+blur` si el componente es protagonista.
- [ ] `cursor-pointer` en elementos clicables; estados `disabled` con `opacity-50`.

---

## 15. Notificaciones (Toasts)

Feedback global de las mutaciones (crear/editar/borrar, ajustes, retiros…). `ToastProvider`
(`src/components/ui/ToastProvider.tsx`) se monta en `layout.tsx` y se consume con el hook
`useToast()` → `{ success, error, info }`. Pautas:

- Una sola línea, concisa y en español. No sustituye a la validación inline de formularios.
- Color semántico según tipo (`green` éxito, `red` error, `sky`/`blue` info), sobre superficie
  translúcida con `border-2` y `rounded-2xl`, coherente con el resto.
- Preferir toasts a estados de éxito/error dispersos en la página.

---

## 16. Drag-and-drop

El proyecto usa **dos** librerías según la complejidad del layout (no mezclar en un mismo
componente):

| Caso | Librería | Por qué |
|------|----------|---------|
| Listas verticales de un eje (`TierlistManager`, `PollList`, `QuestionManager`) | `@hello-pangea/dnd` | Simple y suficiente para reordenar en columna. |
| **Grids multi-columna** (`ParticipantList`) y **multi-contenedor** (`TierlistVotingClient`) | `@dnd-kit` | `@hello-pangea/dnd` no visualiza huecos ni soporta bien grids con `flex-wrap`. |

Convenciones con `@dnd-kit`:

- `SortableContext` con `rectSortingStrategy` para grids; `DragOverlay` para la tarjeta que sigue
  al cursor (la original queda `opacity-30`).
- `PointerSensor` con `activationConstraint: { distance: 5 }` para no romper los clics
  (p. ej. abrir el lightbox de una card).
- Pasar un **`id` estable** a cada `DndContext` (`"nominados"`, `"tierlist-voting"`) para evitar
  el error de hidratación del `aria-describedby` autogenerado.
- Multi-contenedor (tablero): detección de colisión personalizada
  (`pointerWithin`→`rectIntersection`, narrowing a `closestCenter` dentro del contenedor), refs
  `lastOverId`/`recentlyMovedToNewContainer` y `measuring: { droppable: Always }`.

---

## 17. Anuncios laterales (side-rail)

Banners de patrocinio mostrados según plan (`free`/`premium` los ven; PLUS+ no).
`SideRailAds.tsx` los renderiza como **overlay `fixed`** a partir de `2xl` (no reservan layout →
sin bordes negros, consistente entre páginas). `CustomAdBannerVertical.tsx` rota sponsors con
fade. No deben empujar ni recortar el contenido principal.

---

## 18. Qué evitar

- ❌ Bordes de 1px (`border` sin `-2`) — rompe la consistencia.
- ❌ Colores fuera de la paleta Tailwind estándar o tonos planos sin opacidad.
- ❌ Fondos claros / temas light — Pollnow es dark-only (`html.dark`, `body.bg-black`).
- ❌ Esquinas rectas (`rounded-none`) en tarjetas o botones.
- ❌ Animaciones bruscas o sin `ease`; respeta el blur+slide suave característico.
- ❌ Mezclar acentos sin razón (el azul es de marca; índigo es solo Premium; orange/amber solo B2B).

---

*Este documento describe el estado actual del diseño. Cuando el estilo evolucione, actualízalo para que siga siendo la fuente de verdad.*
