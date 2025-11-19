# FOTY (Friend of the Year)

Plataforma de votación anónima y gestión de eventos para grupos, diseñada con una arquitectura lineal y control temporal de resultados.


https://github.com/user-attachments/assets/dbb8b9c7-f4cd-4e85-a1b7-07bb7a54937b


## Descripción General

FOTY es una aplicación web Full-Stack que permite la creación y gestión de certámenes de premios. A diferencia de las herramientas de encuestas convencionales, FOTY estructura la experiencia en fases temporales definidas (Votación y Gala), asegurando la integridad de los resultados hasta una fecha específica.

La aplicación prioriza la experiencia de usuario (UX) mediante un flujo de votación continuo y un diseño minimalista en modo oscuro, garantizando al mismo tiempo el anonimato técnico de los votantes sin requerir registro de usuarios.

## Arquitectura y Stack Tecnológico

El proyecto está construido sobre una arquitectura moderna orientada a Serverless y renderizado en servidor (SSR).

* **Framework:** Next.js 16 (App Router)
* **Lenguaje:** TypeScript
* **Base de Datos:** PostgreSQL
* **ORM:** Prisma
* **Estilos:** Tailwind CSS
* **Infraestructura:** Vercel (Soporte para Edge Middleware)

### Modelo de Datos

El sistema utiliza un modelo relacional que separa a los participantes de las encuestas, permitiendo la reutilización de entidades.

* **Participant:** Entidad recurrente (el individuo susceptible de ser votado).
* **Poll:** La categoría de votación.
* **Option:** Tabla de relación que vincula un `Participant` con una `Poll` específica.
* **Vote:** Registro de participación. Incluye un hash de identidad para prevenir duplicidad.

## Funcionalidades Principales

1.  **Votación Anónima Persistente:**
    Utiliza un sistema de identificación basado en cookies `HttpOnly` firmadas y hashes en base de datos (`voterHash`). Esto impide votos múltiples por dispositivo/sesión sin necesidad de autenticación tradicional (email/password).

2.  **Control Temporal (Anti-Spoiler):**
    Las rutas de resultados (`/results`) implementan una validación de fecha contra la variable global `GALA_DATE`. Si la fecha actual es anterior al evento, el servidor bloquea el acceso a los datos y muestra una cuenta regresiva.

3.  **Panel de Administración Seguro:**
    CMS integrado en la ruta `/admin`. El acceso está restringido a nivel de red mediante un Middleware que verifica la dirección IP del cliente contra una lista blanca (`ALLOWED_IP`).

4.  **Flujo Lineal:**
    La navegación guía al usuario secuencialmente desde la primera categoría hasta la finalización, maximizando la tasa de participación completa.

## Instalación y Configuración Local

Siga estos pasos para desplegar el entorno de desarrollo.

### Requisitos
* Node.js 18 o superior.
* Acceso a una instancia de PostgreSQL.

### Pasos

1.  **Clonar el repositorio:**
    ```bash
    git clone <url-del-repositorio>
    cd friend-of-the-year
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configuración de Entorno:**
    Cree un archivo `.env` en la raíz del proyecto basándose en el ejemplo provisto.
    ```env
    DATABASE_URL="postgresql://usuario:password@host:5432/database"
    ```

4.  **Inicialización de Base de Datos:**
    Ejecute las migraciones y el script de semilla (seed) para poblar la base de datos con datos iniciales.
    ```bash
    npx prisma migrate dev --name init
    ```

5.  **Ejecución:**
    ```bash
    npm run dev
    ```

## Configuración del Sistema

### Restricción de Acceso (Admin)
Para asegurar el panel de administración, debe configurar su dirección IP pública en el middleware de seguridad.

Edite el archivo `src/middleware.ts`:

```typescript
// Defina aquí su IP estática o pública actual
const ALLOWED_IP = '87.219.XXX.XXX';
```

### Configuración de la Gala

La fecha de revelación de resultados se controla globalmente.

Edite el archivo `src/lib/config.ts`:

```typescript
// Formato: Año, Mes (0-indexado), Día, Hora
export const GALA_DATE = new Date('2025-12-31T23:59:59');
```

## Guía de Despliegue (Producción)

Esta aplicación está optimizada para su despliegue en Vercel.

1.  Importe el repositorio en Vercel.
2.  Configure la variable de entorno `DATABASE_URL`.
3.  **Configuración de Build:** Es crítico sobrescribir el comando de construcción predeterminado para asegurar la generación del cliente Prisma antes de la compilación de Next.js.

**Build Command:**

```bash
npx prisma generate && npx prisma migrate deploy && next build
```

## Estructura del Proyecto

```text
src/
├── app/
│   ├── admin/           # Panel de control (protegido por IP)
│   ├── api/             # Endpoints REST (voto, resultados)
│   ├── polls/           # Vistas públicas de votación
│   └── results/         # Vistas de resultados (protegidas por fecha)
├── components/          # Componentes UI reutilizables
├── lib/                 # Lógica de negocio y configuración (Prisma, Config)
└── middleware.ts        # Lógica de seguridad y gestión de sesiones
```
