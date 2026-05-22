# Preparación para la defensa — POLLNOW

> Banco de preguntas previsibles que el tribunal podría hacerte durante la ronda de preguntas, junto con una guía corta de qué mencionar para que la respuesta suene sólida y técnica. Está pensado como **chuleta mental**, no como un guion que memorizar.

---

## 1. Arquitectura general y stack

### 1. ¿Qué tecnologías has usado y por qué elegiste cada una?
Stack principal: **Next.js 15 (App Router)** con **React** y **TypeScript** en el frontend, **Node.js (runtime de Next.js)** en el backend, **PostgreSQL** como base de datos relacional con **Prisma** como ORM, **NextAuth** para autenticación, **Stripe** para pagos, **Pusher** para WebSockets, **Resend** para correos y **Gemini + Pollinations** para IA. Elegí Next.js porque me permitía tener frontend y backend en un mismo proyecto usando **Server Components** y **Server Actions** sin montar una API REST separada; TypeScript por la seguridad de tipos; Prisma porque me da modelo + migraciones + cliente tipado.

### 2. ¿Dónde tienes el frontend y dónde el backend?
No están en proyectos separados. Es una arquitectura **monorepo full-stack** con Next.js: el **frontend vive en `src/app/**/page.tsx` y `src/components/`** (React + Tailwind), y el **backend vive en `src/app/api/**/route.ts`** (rutas API) y en `src/app/lib/*-actions.ts` (Server Actions). Los **Server Components** se ejecutan en el servidor y los **Client Components** en el navegador (`"use client"`).

### 3. ¿Qué es el App Router de Next.js?
Es el sistema de enrutado de Next.js basado en carpetas dentro de `src/app/`: cada carpeta es una ruta y cada `page.tsx` es la página. Soporta **layouts anidados**, **loading.tsx**, **error.tsx**, y por defecto cada componente es **Server Component**, salvo que pongas `"use client"`. Las mutaciones se hacen con **Server Actions** (funciones marcadas con `"use server"`).

### 4. ¿Qué diferencia hay entre Server Components y Client Components?
Los **Server Components** se renderizan en el servidor, no envían su JS al cliente, pueden hacer queries a la BD directamente, y son ideales para cargar datos. Los **Client Components** se hidratan en el navegador, pueden usar `useState`, `useEffect` y eventos. En el proyecto, las páginas del dashboard cargan datos en el server y delegan la parte interactiva (forms, tabs, modales) a componentes cliente.

### 5. ¿Qué son las Server Actions y por qué las usas en vez de una API tradicional?
Son funciones que se ejecutan en el servidor y se pueden llamar directamente desde un formulario o un componente cliente como si fueran una función JS, sin definir un endpoint REST. Las uso para **mutaciones internas** (crear evento, actualizar perfil, votar, gestionar colaboradores) porque eliminan boilerplate de fetch + JSON + status codes. Las **rutas API tradicionales** las reservo para casos donde necesito un endpoint público con rate limit, webhooks externos (Stripe), o respuestas no-JSON (como el endpoint de imágenes IA que devuelve un buffer binario).

---

## 2. Base de datos y Prisma

### 6. ¿Qué base de datos usas y por qué?
**PostgreSQL** alojada en **Neon** (serverless Postgres). Elegí Postgres porque el modelo es claramente **relacional**: usuarios → eventos → polls → opciones → votos, con muchas relaciones de uno-a-muchos y muchos-a-muchos. Neon en concreto porque me da una **conexión pooled (PgBouncer)** para queries en runtime y una **conexión directa** para migraciones, y escala bien sin que tenga que gestionar el servidor.

### 7. ¿Qué es Prisma y por qué lo elegiste?
Prisma es un **ORM** moderno para Node/TypeScript. Define el esquema en un archivo declarativo (`schema.prisma`), genera un **cliente tipado** automáticamente y gestiona las **migraciones**. Lo elegí en lugar de escribir SQL puro porque me da **autocompletado**, **type-safety** (si una columna se llama mal, el build falla), y porque sus migraciones versionan el esquema en git.

### 8. ¿Qué es un ORM?
Un **Object-Relational Mapper** es una capa entre la aplicación y la BD que traduce **objetos/clases** en filas SQL y viceversa. En vez de escribir `SELECT * FROM users WHERE id = '...'`, escribes `prisma.user.findUnique({ where: { id } })`. Ventajas: tipado, abstracción del dialecto SQL, prevención de SQL injection. Desventaja: rendimiento ligeramente peor en queries muy complejas (que se puede resolver usando `prisma.$queryRaw`).

### 9. ¿Cómo está estructurado tu modelo de datos?
La entidad central es **User**, que posee **Events**. Cada Event tiene varios **Polls** (categorías), y cada Poll tiene **Options**, que son relaciones N a N entre Polls y **Participants** (nominados, reutilizables dentro del mismo evento). Los **Votes** apuntan a una Option, opcionalmente a un User y siempre llevan un **voterHash** para el caso anónimo. Aparte: **EventLike**, **EventVote** (upvote/downvote), **EventCollaborator**, **CollaboratorInvitation**, **SupportChat/SupportMessage**, **Notification**, **PromotionConfig**, **Raffle**, **AnnouncementBar**.

### 10. ¿Dónde están tus migraciones y cómo manejas los cambios de esquema?
En `prisma/migrations/`. Cada migración es un SQL versionado con timestamp. En desarrollo uso `prisma migrate dev` (genera y aplica), y en producción `prisma migrate deploy` (solo aplica las que falten). Hubo un problema con Neon: el `prisma migrate deploy` se colgaba porque la conexión pooled (PgBouncer) no soporta `pg_advisory_lock`. Lo resolví configurando `directUrl = DATABASE_URL_UNPOOLED` en `prisma.config.ts` para que las migraciones usen la conexión directa.

### 11. ¿Cómo evitas tener varias instancias del cliente de Prisma en desarrollo?
Con un **singleton** en `src/lib/prisma.ts`: en producción se instancia normalmente, pero en desarrollo lo guardo en `globalThis.prisma` para que el hot-reload de Next.js no cree decenas de conexiones nuevas a la BD.

---

## 3. Autenticación y sesiones

### 12. ¿Cómo manejas las sesiones de los usuarios?
Con **NextAuth (Auth.js)** configurado en `src/auth.ts` y `src/auth.config.ts`, usando el **adaptador de Prisma**. Las sesiones son **JWT firmados** (estrategia `jwt`), no guardadas en BD. Cuando el usuario hace login, NextAuth emite un JWT que se guarda en una **cookie HttpOnly y Secure**, y en cada petición la valido en el servidor con `auth()`. En el token incluyo `id`, `role` y datos mínimos para que el middleware pueda decidir sin tocar la BD.

### 13. ¿Cómo chequeas si el inicio de sesión es correcto?
En el provider de credenciales: recibo email y password, busco al usuario en la BD con `prisma.user.findUnique`, y comparo el password contra el `passwordHash` guardado usando **`bcrypt.compare`**. Si coincide y el email está verificado, NextAuth firma el JWT y crea la sesión. Si el usuario existe pero no tiene `passwordHash` (cuenta de Google), devuelvo un error explicando que use Google.

### 14. ¿Qué validaciones tienes en el formulario de registro?
Doble validación: **en cliente** con HTML5 (`required`, `type="email"`) para feedback inmediato, y **en servidor** con **Zod** (`registerSchema` en `auth-actions.ts`). El esquema exige nombre de 3–15 caracteres en minúsculas sin espacios (`/^[a-z]+$/`), email válido, y password mínimo 6 caracteres. Además, antes de crear el usuario compruebo que el email no exista, hago `bcrypt.hash(password, 10)` y genero un `username` único concatenando un sufijo aleatorio.

### 15. ¿Cómo funciona el inicio de sesión con Google?
Uso el **provider de Google** de NextAuth con OAuth 2.0. El usuario pulsa el botón, va a la pantalla de consentimiento de Google, este redirige a `/api/auth/callback/google` con un token de autorización, NextAuth lo intercambia por un access token, obtiene el perfil (email, name, picture), y el **adaptador de Prisma** crea o vincula el usuario en la tabla `User` y `Account`. Si es la primera vez, el usuario queda con `emailVerified` ya marcado y `passwordHash = null`.

### 16. ¿Cómo gestionas las contraseñas? ¿Se guardan en texto plano?
No. Se guardan **hasheadas con bcrypt** (10 rondas de salt). bcrypt es un algoritmo adaptativo lento por diseño: aunque alguien robara la BD, no puede revertir el hash a la contraseña original ni hacer fuerza bruta rápidamente. En la BD el campo se llama `passwordHash` para dejar claro que no es la contraseña en plano.

### 17. ¿Cómo manejas el reseteo de contraseña?
Cuando el usuario lo pide, genero un **token aleatorio** con expiración guardado en la tabla `PasswordResetToken`, le envío un email con un enlace que incluye ese token, y al hacer clic verifico que el token sea válido y no haya expirado antes de permitirle introducir la nueva contraseña. Después de usarlo, el token se invalida.

### 18. ¿Cómo se verifica el email tras el registro?
Tras `prisma.user.create` llamo a `generateVerificationToken(email)` y mando un correo con Resend que contiene un enlace a `/auth/new-verification?token=...`. Cuando el usuario abre el enlace, el server action `newVerification` marca `emailVerified = new Date()` en la BD y borra el token.

### 19. ¿Cómo asignas una foto de perfil por defecto a los usuarios nuevos?
En el registro por credenciales, en el `prisma.user.create` pongo `image: \`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}\``. **DiceBear** es un servicio que genera avatares SVG deterministas a partir de un seed, así cada usuario tiene un avatar único y consistente sin que yo tenga que alojar imágenes. En el caso de Google, la `image` se rellena con la foto de Google automáticamente.

### 20. ¿Cómo manejas los roles de los usuarios?
Hay tres roles en un enum de Prisma: `USER`, `MODERATOR`, `ADMIN`. El rol se guarda en `User.role` y se inyecta en el **JWT de la sesión** mediante callbacks de NextAuth, así puedo leerlo sin consultar la BD. La protección se hace a tres niveles:
1. **Middleware** (`src/middleware.ts`) bloquea `/admin/*` si el rol no es ADMIN o MODERATOR.
2. **Server Actions** comprueban `session.user.role` antes de ejecutar.
3. **UI** condiciona los botones a la sesión, pero esto es solo cosmético.

### 21. ¿Cómo proteges las rutas privadas?
Con el archivo `src/middleware.ts`. Next.js ejecuta el middleware en cada petición, antes del renderizado. Allí:
- Si está en modo mantenimiento, redirijo todo a `/maintenance` salvo ADMIN.
- Si la ruta empieza por `/admin/`, exijo sesión iniciada y rol ADMIN o MODERATOR.
- Si no hay sesión y la ruta es del dashboard, redirijo a `/login` con `callbackUrl`.
- Asigno una cookie `voter_id` a cada visitante para tracking de votos anónimos.

---

## 4. Validaciones

### 22. ¿Dónde tienes validaciones y con qué librería?
Uso **Zod** como librería de validación, centralizada en `src/lib/validations.ts` y en cada server action. Valido:
- **Formularios de auth** (registro, login, reset).
- **Creación/edición de evento** (título, descripción, fecha, tags, slug).
- **Polls y participantes** (longitudes máximas, mínimo de 2 nominados antes de guardar).
- **Importación CSV** (cada fila se valida individualmente).
- **Body de rutas API** públicas antes de tocar la BD.

Regla de oro: la validación de cliente es para UX, **la verdad está en el servidor**. Si alguien hace bypass del frontend, el server action o la API rechazan la petición igual.

### 23. ¿Por qué Zod y no otra librería?
Porque tiene **inferencia de tipos automática**: defino el esquema una vez y obtengo el tipo TypeScript con `z.infer<typeof Schema>`. Eso elimina la duplicidad de mantener un schema y un type por separado. Además, los errores vienen con campo + mensaje, perfectos para mostrar en formularios.

---

## 5. Sistema de votación

### 24. ¿Cómo funciona el sistema de votación anónima?
Cada visitante recibe una cookie **`voter_id`** (asignada por el middleware si no existe). Cuando vota, se genera un **`voterHash`** derivado de la cookie + identificadores del dispositivo, y se guarda junto al voto en la tabla `Vote`. La unicidad se controla a nivel de poll: una misma `(voterHash, pollId)` no puede repetir voto. Si el usuario está autenticado, además se guarda su `userId` (salvo que el evento sea anónimo, en cuyo caso se omite).

### 25. ¿Cómo evitas que la misma persona vote varias veces?
Tres capas:
1. **Cookie HttpOnly** `voter_id` persistente.
2. **Hash** del voterHash en BD, que sigue al usuario aunque limpie cookies parcialmente.
3. **Restricción única** en BD: una combinación `(voterHash, pollId)` solo puede existir una vez (índice único en Prisma).
No es infalible (alguien con dos dispositivos podría votar dos veces), pero para un sistema sin login obligatorio es un buen equilibrio entre fricción y prevención.

### 26. ¿Qué pasa si el evento es privado?
Lleva un `accessKey` aleatorio. El usuario solo puede entrar a `/e/[slug]?key=XXX`. Si la key no coincide con la guardada en `Event.accessKey`, se le muestra una pantalla de "Invalid Access Key". El owner puede regenerar la key en cualquier momento desde los ajustes.

### 27. ¿Cómo manejas los modos de votación de cada categoría (poll)?
Hay tres tipos en un enum: `SINGLE` (un solo voto por usuario), `MULTIPLE` (puede votar a varios), `LIMITED_MULTIPLE` (varios pero hasta un máximo definido en `maxOptions`). En el front, el formulario cambia entre radio buttons y checkboxes según el tipo, y en el server se valida que el número de opciones marcadas respete el modo.

---

## 6. Pagos y suscripciones

### 28. ¿Cómo usas Stripe?
Stripe gestiona toda la facturación de planes Premium, Plus y Unlimited. El flujo:
1. El usuario pulsa "Suscribirse" → `createCheckoutSession` (server action) crea una **Checkout Session** en Stripe y lo redirige a la página de pago.
2. Tras pagar, Stripe redirige al usuario de vuelta y, **en paralelo, manda un webhook** a `/api/webhooks/stripe`.
3. Mi webhook verifica la firma con `stripe.webhooks.constructEvent` y actualiza el usuario en BD: `subscriptionStatus`, `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`, `subscriptionEndDate`.
4. El **Customer Portal** de Stripe (botón "Gestionar") permite cancelar o cambiar de plan; los cambios llegan también por webhook.

Nunca toco la BD del usuario en el endpoint de "success" del navegador: el webhook es la fuente de verdad porque puede llegar incluso si el usuario cierra la pestaña.

### 29. ¿Cómo verificas que un webhook viene realmente de Stripe?
Stripe firma cada webhook con un secreto compartido. En el endpoint leo el header `stripe-signature`, paso el body **crudo** (raw) y el secreto a `stripe.webhooks.constructEvent`, y si la firma no coincide rechazo con 400. Por eso ese endpoint **no aplica rate limit** y leo el body como texto sin parsear, distinto del resto.

### 30. ¿Qué planes tienes y cómo se aplican los límites?
Cinco: Free, Premium (2,99€), Plus (8,99€), Unlimited (12,99€) y **Enterprise** (manual). Cada uno define límites de eventos, categorías por evento, nominados por evento y colaboradores. Los límites se definen una sola vez en `src/lib/plans.ts` y se consultan vía `getPlanFromUser(user)`. Antes de cada creación (evento, poll, participante), compruebo el límite y devuelvo error si se supera.

### 31. ¿Qué es el plan Enterprise y cómo se diferencia?
Es un plan **no gestionado por Stripe**, asignado manualmente por un admin desde el panel. Tiene dos modos: **vitalicio** (sin fecha de fin) o **fijo** (con `subscriptionEndDate`). Cuando llega la fecha, un **cron diario** en `/api/cron/expire-subscriptions` (configurado en `vercel.json`) lo degrada a Free. Además `getPlanFromUser` comprueba la expiración en tiempo real sin esperar al cron.

---

## 7. Tiempo real con Pusher

### 32. ¿Cómo haces que el chat de soporte muestre los mensajes en tiempo real? ¿WebSockets / Pusher?
Sí, uso **Pusher** como capa de WebSockets gestionada. Cada chat tiene un **canal privado** `private-chat-{chatId}`. Cuando alguien envía un mensaje:
1. El server action `sendSupportMessage` guarda el mensaje en BD.
2. Inmediatamente dispara `pusherServer.trigger(chatChannel, "new-message", payload)`.
3. El componente `ChatInterface` está suscrito al canal en el navegador y recibe el evento por WebSocket sin recargar.
4. Como canal privado, la suscripción pasa por `/api/pusher/auth`, que comprueba que la sesión sea del dueño del chat o de un admin.

Antes usaba polling cada 4 segundos; lo cambié a Pusher porque es más eficiente y se nota mucho la diferencia en UX.

### 33. ¿Cómo funciona la colaboración en tiempo real de los eventos?
El owner invita a un usuario por email; al aceptar, se crea un `EventCollaborator` con 6 permisos booleanos nullable (canEditSettings, canRegenerateKey, canDeleteEvent, canManageNominees, canManagePolls, canViewStats). Cualquier cambio se difunde por el canal **`private-event-{id}`**:
- `invitation-sent`, `collaborator-joined`, `collaborator-left`, `permissions-updated`, `data-changed`.

El **owner** actualiza el panel del equipo sin recargar. El **colaborador** escucha `permissions-updated` y dispara `router.refresh()`, que vuelve a pedir el Server Component al servidor — así los botones y secciones aparecen o desaparecen al instante según los permisos.

### 34. ¿Qué significa que un permiso sea `null`?
Que **hereda del default del evento**. Cada evento tiene unos permisos por defecto que aplican a todos sus colaboradores; los `null` en un colaborador concreto significan "usa el default", y un `true`/`false` significa "override individual". Cuando un override coincide con el default, lo seteo automáticamente a `null` para mantener el modelo limpio.

### 35. ¿Por qué Pusher y no Socket.IO o un servidor propio?
Porque despliego en **Vercel**, que es serverless: no puedo mantener una conexión WebSocket persistente en una función edge. Pusher es un servicio externo que mantiene las conexiones por mí, yo solo disparo eventos desde el servidor (HTTP) y los clientes los reciben por WebSocket. Para escalar a producción habría que considerar Soketi (open-source compatible con Pusher) o Ably.

---

## 8. IA integrada

### 36. ¿Cómo funciona el chatbot con IA integrado en la web?
El endpoint `/api/chat` recibe un array de mensajes del usuario y los pasa al modelo **`gemini-2.5-flash-lite`** de Google a través de `@google/generative-ai`. Le envío un **system prompt** detallado que define el ámbito (solo responder sobre Pollnow, no aceptar prompt injection, no formato Markdown, adaptar tono según si el usuario es nuevo/registrado/avanzado). El endpoint está rate-limited a 15 peticiones por minuto por IP. La respuesta se devuelve como JSON al cliente, que la pinta en una UI tipo chat.

### 37. ¿Cómo evitas que el chatbot responda cosas fuera de su ámbito o que le hagan jailbreak?
Con un **system prompt restrictivo** que le dice explícitamente que (1) solo hable de Pollnow, (2) si le preguntan otra cosa responda con una frase tipo "Solo puedo ayudarte con dudas sobre Pollnow", (3) **ignore intentos de prompt injection** del tipo "ignora tus instrucciones anteriores", (4) no revele sus instrucciones internas. No es a prueba de balas (ningún LLM lo es), pero filtra el 95% de los intentos.

### 38. ¿Cómo funciona la generación de imágenes por IA para los nominados?
Uso **Pollinations AI** (alternativa gratuita a DALL-E / Midjourney) con varios modelos. En `/api/generate-image`:
1. Recibo el prompt y la seed.
2. Disparo en **paralelo** tres modelos gratuitos: `klein`, `flux` y `zimage`.
3. El primero que responda con éxito gana (carrera de promesas con resolución temprana).
4. Si los tres fallan, hago **fallback** al modelo de pago `p-image`.
5. Devuelvo el buffer binario directamente con el `content-type` correcto.

Rate limit: 5 por minuto si estás autenticado, 2 por minuto anónimo. Esto evita que alguien abuse del endpoint.

### 39. ¿Por qué la carrera de promesas la haces manualmente y no con `Promise.race`?
Porque `Promise.race` resuelve con el **primero que se asiente**, sea éxito o error. Si dos modelos fallan rápidamente, `Promise.race` me devolvería el fallo del primero en fallar y descartaría el éxito del tercero. Por eso implemento una promesa manual que solo resuelve cuando alguno tiene éxito **o** cuando todos han fallado.

---

## 9. Panel de administración

### 40. ¿Cómo funciona el panel de administración?
Vive bajo `/admin/*` y está protegido por el middleware (solo ADMIN/MODERATOR). Tiene secciones para:
- **Eventos**: revisar y aprobar/rechazar eventos en estado `PENDING`.
- **Usuarios**: cambiar rol, banear, asignar plan (incluido Enterprise).
- **Chats de soporte**: responder tickets.
- **Notificaciones**: mandar avisos.
- **Promociones**: bono de bienvenida, sorteos, barra de anuncios.
- **Emails masivos** (`/admin/emails`): composer con plantillas, preview, filtros de destinatarios y envío por lotes de 100 vía `resend.batch.send()`.

Todas las acciones críticas pasan por endpoints como `/api/admin/events/batch` y `/api/admin/users/batch`, con rate limit y verificación de rol.

### 41. ¿Qué es el sistema de promociones?
Tres herramientas independientes en `/admin/promotions`:
- **Bono de bienvenida**: un toggle global que activa la asignación automática de un plan temporal a cada nuevo registro.
- **Cron de expiración**: actualiza diariamente los usuarios cuya suscripción no-Stripe ha caducado.
- **Sorteos**: CRUD completo con selección aleatoria o manual de ganador.

### 42. ¿Cómo funciona la barra de anuncios global?
Hay un registro singleton en `AnnouncementBar` (id `"global"`). La página raíz carga un Server Component cachéado con ISR (`revalidate=60s` y tag `"announcement"`). Cuando un admin la edita, llamo a `revalidateTag("announcement")` y el cache se invalida al instante. El usuario puede descartarla, y la dismissal se guarda en `localStorage` con la id del registro como clave, así si el admin la actualiza vuelve a aparecer.

---

## 10. Rate limiting y seguridad

### 43. ¿Cómo proteges tu API de abusos?
Con un **rate limiter sliding-window in-memory** en `src/lib/rate-limit.ts`. Cada endpoint público define su límite (peticiones por minuto) y una clave de identificación (IP, userId, o Stripe signature). Si se supera, devuelvo `429 Too Many Requests` con header `Retry-After`. El store se limpia automáticamente cada 5 minutos.

Limitaciones: solo funciona con **una instancia** del servidor. Para Vercel/multi-edge habría que migrar a `@upstash/ratelimit` con Redis, que es la nota que dejé en el README.

### 44. ¿Cómo evitas SQL injection?
**Prisma** parametriza todas las queries automáticamente; nunca concateno strings de SQL. En el único punto donde uso `$queryRaw`, uso template literals etiquetados que también parametrizan. Además todos los inputs pasan por Zod antes de llegar a la BD.

### 45. ¿Y XSS?
React **escapa por defecto** cualquier string que se renderiza, así que un input malicioso como `<script>` se imprime como texto, no como HTML. Solo `dangerouslySetInnerHTML` permite inyectar HTML crudo, y solo lo uso en sitios controlados (plantillas de email server-side). Las imágenes de avatar van con `next/image` con `remotePatterns` whitelisteados en `next.config.ts`.

### 46. ¿Cómo manejas el banneo de usuarios?
El modelo `User` tiene un campo `ipBan` (booleano). Cuando un admin lo activa, el siguiente login del usuario falla aunque las credenciales sean correctas, porque el provider de NextAuth lo comprueba. También se podría aplicar a nivel de middleware si quisiera bloquear acceso incluso anónimo, aunque actualmente solo bloquea login.

---

## 11. Emails y notificaciones

### 47. ¿Cómo mandas emails y cuáles mandas?
Con **Resend**, en `src/lib/mail.ts`. Mando: verificación de email, reseteo de contraseña, aprobación/rechazo de eventos, invitaciones a colaborar, y broadcasts del admin. Todos los emails llevan:
- Una versión **HTML** y una versión **texto plano** (mejora la deliverability — los emails solo-HTML caen más en spam).
- Header `List-Unsubscribe` y `List-Unsubscribe-Post` con URL firmada (en los que no son de auth).
- Asuntos específicos derivados del contenido (no genéricos tipo "Notificación").

Los envíos son **fire-and-forget** (`.catch()` silencioso) para que un fallo de Resend no rompa el flujo principal.

### 48. ¿Cómo funciona el unsubscribe sin tabla extra en BD?
Genero un **token firmado con HMAC-SHA256** usando `NEXTAUTH_SECRET` como clave: el token es `base64url(userId:type:HMAC)`. Cuando el usuario abre el link de unsubscribe, verifico la firma (sin consultar BD para validar el token, solo para aplicar el cambio), pongo a `false` el flag correspondiente (`emailNotifications` o `emailCollaborations`) y muestro confirmación. Stateless y sin tabla de tokens adicional.

### 49. ¿Cómo gestionas las preferencias de email del usuario?
Dos toggles en el modelo `User`: `emailNotifications` (notificaciones del sistema) y `emailCollaborations` (invitaciones de colaboración). El usuario los controla desde `/dashboard?tab=profile`. Antes de mandar un email, compruebo el flag relevante; si está en false, no se envía.

### 50. ¿Y las notificaciones in-app?
Hay un modelo `Notification` con tipo (`SYSTEM` o `COLLABORATION`) y referencia al usuario. Se crean desde el server cuando ocurre algo (evento aprobado, invitación recibida) y aparecen en la pestaña "Notificaciones" del dashboard. El usuario puede marcarlas como leídas individualmente o todas a la vez.

---

## 12. Funcionalidades especiales

### 51. ¿Cómo funciona la importación masiva por CSV?
Disponible solo para planes Unlimited y Enterprise (botón "CSV" en `ParticipantList` y `PollList`). El modal tiene tres fases:
1. **Selección de archivo**: muestra el formato, permite descargar un ejemplo, y acepta solo `.csv`.
2. **Validación y preview**: parseo el CSV en el cliente, paso fila por fila por Zod y muestro válidas vs. inválidas con motivo.
3. **Resultado**: tras enviar, muestro cuántas se crearon y cuáles fallaron a nivel servidor (por límite de plan, etc.).

Los server actions `bulkCreateParticipants` y `bulkCreatePolls` hacen las inserciones, llaman a `revalidatePath` y disparan Pusher **una sola vez al final**, no por cada fila.

### 52. ¿Cómo funciona el sistema de tags?
Los tags se almacenan **siempre en minúsculas y sin diacríticos** (slug-safe). Máximo 5 por evento, 20 caracteres cada uno. El componente `TagsInput` muestra píldoras con animación, autocompleta desde `/api/tags?q=...` mostrando contadores de uso, y permite añadir con Enter o coma. El endpoint `/api/tags` solo lista tags de eventos públicos y aprobados, rate-limited a 60 req/min.

### 53. ¿Cómo funciona el descubrimiento de eventos en `/polls`?
- **Búsqueda** con debounce de 300ms sobre título y descripción.
- **Filtros de orden**: recientes, populares (likes), mejor valorados, peor valorados, más antiguos.
- **Botón "Aleatorio"** llama a `/api/events/random` y redirige a un evento al azar.
- **Tags clicables** que filtran por `?tag=xxx`.
- **Paginación** de 6 eventos por página con elipsis (1 ... 5 6 7 ... 20).
- **Likes y upvotes/downvotes inline** con actualización optimista, sin recargar.

### 54. ¿Qué es el sistema de onboarding / tours guiados?
Uso **Shepherd.js** para tours interactivos. Hay tres entradas en el botón flotante de ayuda:
- **Tour por la web**: 7 pasos por las secciones del dashboard.
- **Tutorial visual** estático con mockups de un evento de ejemplo.
- **Tour guiado para crear evento**: abre el modal y resalta nombre, descripción y submit en tiempo real.

Cada elemento del DOM relevante lleva una clase `tour-*` para que Shepherd lo encuentre. Para soportar tanto "ya estás en el dashboard" como "vienes de fuera", uso un evento de navegador custom `pollnow:tour` que sobrevive a las soft-navigations de Next.js.

### 55. ¿Por qué hiciste una página /empresas separada?
Para el caso B2B: el plan Enterprise no se vende online, se cierra por contacto directo. La página tiene hero, casos de uso, "cómo funciona", pricing de licencia corporativa (399€ one-time), y CTAs con `mailto:contacto@pollnow.es`. La landing principal redirige aquí con el botón "Soluciones para Empresas".

---

## 13. Despliegue y operaciones

### 56. ¿Dónde está desplegado el proyecto?
En **Vercel**. La BD PostgreSQL está en **Neon** (también serverless). Los emails los manda **Resend**. Los WebSockets los gestiona **Pusher**. Stripe y Google OAuth son terceros. El dominio es `pollnow.es`. Vercel se encarga del build y de servir las rutas, con SSR/ISR según el caso.

### 57. ¿Qué variables de entorno necesitas?
Las críticas: `DATABASE_URL` (pooled) y `DATABASE_URL_UNPOOLED` (directa), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID/SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `PUSHER_APP_ID/KEY/SECRET/CLUSTER`, `NEXT_PUBLIC_PUSHER_KEY/CLUSTER`, `GEMINI_API_KEY`, `POLLINATIONS_API_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_DEMO_EVENT_URL`. Todas en el panel de Vercel, nunca commiteadas.

### 58. ¿Qué hace el cron job?
Configurado en `vercel.json` (`crons` array), pega a `/api/cron/expire-subscriptions` **cada día a las 04:00 UTC**. El endpoint comprueba el header `Authorization: Bearer ${CRON_SECRET}` para validar que la llamada viene de Vercel y no del exterior, y actualiza en bulk los usuarios cuya `subscriptionEndDate` haya pasado, degradándolos a Free.

### 59. ¿Cómo manejas el modo mantenimiento?
Hay una constante `MAINTENANCE_MODE` en `src/lib/config.ts`. Si está en `true`, el middleware redirige todo a `/maintenance` salvo recursos estáticos, `_next` y los admins logueados (para poder seguir trabajando). Es un cambio de constante + deploy, simple pero efectivo.

---

## 14. Decisiones técnicas y razonamiento

### 60. ¿Por qué Next.js y no React puro o un Vite + Express?
Porque necesitaba **SSR** (los eventos públicos deben indexar bien en Google), **Server Actions** (mutaciones sin API REST), **ISR/cache** (la página de polls públicos se beneficia), y **un único codebase** frontend+backend. Hacerlo con Vite + Express me habría obligado a montar dos servidores, una capa de comunicación HTTP y duplicar tipos. Next.js me da todo eso de fábrica.

### 61. ¿Por qué Server Actions y no rutas API para todo?
Las Server Actions son ideales para **mutaciones internas** llamadas desde mi propio frontend: tipado end-to-end, sin definir endpoints, integración nativa con `<form>`. Las rutas API las uso cuando el cliente no es solo mi frontend: webhooks de Stripe (lo manda Stripe), endpoints públicos consumibles desde fuera (`/api/polls`), o respuestas no-JSON (como el endpoint de imágenes IA).

### 62. ¿Por qué Tailwind y no CSS Modules o styled-components?
Por **velocidad de iteración** y porque elimina el problema del "naming". En vez de inventar nombres de clases y mantener archivos CSS separados, escribo utilidades directamente en el JSX. Para componentes muy repetidos, extraigo a un componente React. El bundle final solo incluye las clases usadas gracias al tree-shaking de Tailwind.

### 63. ¿Por qué Framer Motion?
Porque las animaciones de páginas (entrada/salida de cards, modales, hovers) son una gran parte de la sensación de "app moderna". Framer Motion permite animar montaje/desmontaje con `AnimatePresence`, valores spring físicamente realistas y transiciones declarativas sin escribir keyframes a mano.

### 64. ¿Qué cosas refactorizarías si tuvieras más tiempo?
- Migrar el **rate limiter en memoria** a Upstash + Redis para soportar multi-instancia.
- Añadir **tests E2E** con Playwright (ahora solo tengo tests unitarios del agregador de resultados).
- Separar las **estadísticas pesadas** a una **vista materializada** o cache, hoy se calculan en cada request.
- Añadir **observabilidad** (Sentry, OpenTelemetry).
- Internacionalizar (i18n) — ahora todo el copy está en español hardcodeado.

### 65. ¿Qué ha sido lo más difícil del proyecto?
Tres cosas:
1. **El sistema de colaboración en tiempo real**: pensar la herencia de permisos (`null = default`, `bool = override`), invalidar la UI a ambos lados (owner y colaborador) sin recargar y resolver el reto de que `router.refresh()` re-pidiera el server component con los permisos nuevos.
2. **El timezone bug de la fecha de gala**: el `datetime-local` enviaba el string crudo y el servidor lo interpretaba como UTC, descuadrando 2h. Lo resolví forzando `Date.toISOString()` en cliente antes de enviar.
3. **Hacer que Prisma migrate funcionara con Neon**: el pooler PgBouncer no soporta `pg_advisory_lock` y bloqueaba las migraciones. Lo arreglé apuntando `directUrl` a la conexión sin pooler.

---

## 15. Preguntas “trampa” / de evaluación

### 66. ¿Qué pasaría si Stripe deja de funcionar?
Los pagos nuevos no entrarían, pero las cuentas ya activas seguirían funcionando porque la fuente de verdad sobre el plan es **mi BD**, no Stripe. Los webhooks fallidos los reintenta Stripe automáticamente durante días, así que cuando vuelva, los cambios se sincronizarían. El usuario tampoco ve la pantalla de Stripe colgada porque mostraría un error en la propia página de checkout antes de redirigir.

### 67. ¿Y si Pusher se cae?
La aplicación sigue funcionando, solo se pierde el tiempo real: los chats y la colaboración pasarían a depender de recargas manuales. Como el `data-changed` solo es un trigger de UI y no la fuente de verdad (la BD lo es), no hay riesgo de pérdida de datos.

### 68. ¿Qué harías para escalar a 100.000 usuarios?
- **Rate limiter** a Redis (Upstash) para que funcione entre instancias.
- **Cache** de queries pesadas (listado de polls, ranking, stats) con `revalidate` o Redis.
- **Lectura desde réplicas** de la BD para queries de solo lectura.
- **CDN** para imágenes generadas (ahora se sirven desde Pollinations cada vez; podría subirlas a R2/S3 una vez generadas).
- **Cola de envío de emails** (BullMQ o similar) en lugar de fire-and-forget.
- Mover el cron a una herramienta dedicada (Inngest, Trigger.dev) si se complican los jobs.

### 69. Si te dijera que tu sistema de votación anónima no es realmente anónimo, ¿qué dirías?
Que en parte tiene razón: el `voterHash` permite saber que el mismo dispositivo votó dos veces, lo cual técnicamente es un identificador. Lo que **sí garantizo** es que el voto no se asocia con `userId` cuando el evento es anónimo, y que el hash no es reversible a una IP o a un usuario sin metadata adicional. Si quisiera anonimato fuerte real, tendría que romper completamente el vínculo entre identidad y voto, y aceptar perder la prevención de duplicados (o usar técnicas como **blind signatures** o **zero-knowledge proofs**, que están fuera del alcance del proyecto).

### 70. ¿Qué medidas legales/GDPR aplica tu app?
Las páginas legales (`/legal/terms`, `/privacy`, `/cookies`) cumplen con **LSSI-CE**, **LOPDGDD** y **GDPR**: tabla de subprocesadores (Neon, Vercel, Pusher, Resend, Stripe, Pollinations), tiempos de retención, notificación de brechas en 72h, derechos ARSULIPO, link a la AEPD, edad mínima 14, política de IA. Tengo banner de cookies (`CookieConsent`) y todos los emails llevan link de unsubscribe firmado. El usuario puede borrar su cuenta desde el dashboard (RGPD art. 17 — derecho al olvido).

### 71. Si te pregunto cuál es el cuello de botella actual de tu app, ¿qué dirías?
La función `getEventStats()` en eventos con muchos votos: hace varias queries y agrega en JS. Para un evento con 10.000 votos sigue siendo aceptable, pero a partir de cierto volumen habría que pre-agregar (trigger en BD o vista materializada) o cachear. El segundo punto sería el rate limiter en memoria si llegáramos a multi-instancia.

### 72. ¿Por qué no usaste un framework de UI tipo Material UI o Chakra?
Porque quería **control absoluto** sobre el diseño y la sensación de la app, y un framework de UI te impone estilos y estructura. Tailwind me permite construir componentes desde cero con la apariencia exacta que quiero (efectos glassmorphism, gradientes, oscuro consistente) sin tener que sobrescribir estilos predefinidos. Para componentes complejos que sí me daba palo construir (drag&drop, animaciones), uso paquetes específicos (`@hello-pangea/dnd`, `framer-motion`).

### 73. ¿Has hecho tests? ¿Por qué tan pocos?
Tengo un test unitario en `src/__test__/results.test.ts` que cubre la lógica de agregación de resultados, que es la parte más sensible matemáticamente (cómo se cuentan los votos y se decide el ganador con ties). Para el resto me apoyé en TypeScript estricto + Zod (que detectan muchos errores antes de runtime) y testing manual del happy path. Si retomara el proyecto, añadiría **Playwright** para flujos críticos: registro, voto anónimo, checkout de Stripe (con test mode).

---

## 16. Preguntas “de tribunal” no técnicas

### 74. ¿Por qué elegiste este proyecto y no otro más sencillo?
Porque quería un proyecto que tocara **muchas áreas** distintas de desarrollo web moderno: auth real, base de datos relacional no trivial, pagos, tiempo real, IA, panel admin y aspectos legales. Una app de votaciones tiene una entidad central clara (`Event → Poll → Vote`) pero deja sitio para crecer en todas direcciones. Además es un dominio donde podría tener usuarios reales si quisiera publicarlo.

### 75. ¿Cuánto tiempo te ha llevado?
Más de 6 meses de desarrollo iterativo, con versiones desde v1.0 hasta v2.6. El esquema de Prisma tiene decenas de migraciones que cuentan esa historia.

### 76. ¿Trabajaste solo? ¿Cómo organizaste el desarrollo?
Sí, en solitario. Llevé el control con git (commits descriptivos en cada iteración), un README que crecía con el proyecto, y un sistema de versiones (v2.3, v2.4, v2.5, v2.6) donde cada una añadía un bloque coherente de funcionalidad. La memoria del proyecto documenta la justificación técnica de cada decisión.

### 77. ¿Qué aprendiste con este proyecto?
Lo más importante no es ningún framework concreto, es que un sistema real tiene **muchas capas que tienen que encajar**: validación cliente + servidor, persistencia, autorización, rate limiting, observabilidad, emails, webhooks, real time, legal. Aprendí a pensar en términos de **flujos completos** (qué pasa si el webhook llega antes que la redirección, qué pasa si dos colaboradores editan a la vez, qué pasa si Pusher se desconecta) y no en features aisladas.

### 78. Si tuvieras que volver a empezar, ¿qué cambiarías?
- Empezar por escribir **los tipos del dominio primero** (Zod schemas y modelos Prisma) y construir desde ahí.
- Configurar **Sentry** y logging estructurado desde el día 1.
- No usar emoji en código ni mensajes de UX hasta tener la base sólida (perdí tiempo iterando estética antes de tiempo).
- Hacer el sistema de permisos de colaboración con tabla pivote dedicada en lugar de columnas booleanas — escala mejor si quisiera añadir más permisos.

### 79. ¿Es producción real o solo demo?
Está desplegado en **pollnow.es**. El sistema de pagos con Stripe está en modo **test** por defecto durante la presentación, pero técnicamente está preparado para producción (solo es cambiar las claves API).

### 80. Si tuvieses que vender este proyecto en una frase…
**Pollnow es una plataforma SaaS de premios y votaciones con tiempo real, IA integrada y planes de suscripción, construida full-stack sobre Next.js para demostrar cómo todas las piezas de una aplicación moderna pueden coexistir en un solo proyecto coherente.**

---

> Recuerda: si te preguntan algo que no sabes contestar al detalle, **no inventes**. Di "esa parte la implementé hace meses, déjame un segundo para situarla" o "no recuerdo el detalle exacto, pero la idea general es…". Mostrar honestidad y razonamiento es mejor que una respuesta inventada que el tribunal puede destrozar con una repregunta.

¡Mucha suerte mañana! 🏆
