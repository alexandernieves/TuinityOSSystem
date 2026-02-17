# TuinityOSSystem - Documentación Técnica y Estructural

Este documento detalla la estructura actual, tecnologías y componentes del sistema **TuinityOSSystem**.

## 1. Visión General del Proyecto

TuinityOSSystem es una plataforma Full Stack moderna diseñada con una arquitectura de **Monorepo**, separando claramente el Frontend y el Backend en directorios dedicados. El sistema integra funcionalidades avanzadas de **Punto de Venta (POS)**, **Gestión de Inquilinos (Tenant)** y **Gestión de Sucursales**, todo respaldado por una infraestructura sólida basada en Docker.

---

## 2. Estructura de Directorios Principal

La raíz del proyecto contiene la orquestación de servicios y los directorios principales de código:

```
/
├── backend/            # Lógica del servidor, API y Base de Datos
├── frontend/           # Interfaz de usuario (Cliente)
├── docker-compose.yml  # Configuración de servicios (PostgreSQL, Redis)
└── ...archivos de configuración
```

---

## 3. Backend (NestJS)

El backend está construido con **NestJS** (v11), un framework progresivo para Node.js, optimizado para escalabilidad y mantenibilidad.

### Tecnologías Clave:
-   **Framework**: NestJS (`@nestjs/core`, `@nestjs/common`)
-   **Lenguaje**: TypeScript (v5.7)
-   **Base de Datos**: PostgreSQL (vía Docker y Prisma ORM)
-   **ORM**: Prisma v7.3.0 (`@prisma/client`)
-   **Autenticación**:
    -   Passport (`@nestjs/passport`)
    -   JWT (`@nestjs/jwt`)
    -   BcryptJS (Hashing de contraseñas)
-   **Validación de Datos**: Zod
-   **Rate Limiting**: `@nestjs/throttler`

### Módulos Principales Detectados:
La arquitectura modular de NestJS organiza el código en dominios lógicos:
-   **`auth/`**: Gestión de autenticación y seguridad.
-   **`users/`**: Lógica de usuarios y perfiles.
-   **`tenant/`**: Middleware y servicios para soporte Multi-tenant (posiblemente separación lógica de datos por cliente).
-   **`pos/`**: Módulo de Punto de Venta, incluyendo gestión de **Facturas (`invoices`)**.
-   **`branches/`**: Gestión de sucursales físicas o lógicas.
-   **`health/`**: Endpoints para verificar el estado del sistema.
-   **`common/`**: Utilidades y configuraciones compartidas.

### Base de Datos y Migraciones:
-   Ubicación: `backend/prisma/`
-   **Schema**: `schema.prisma` (Define los modelos de datos).
-   **Seeding**: Scripts robustos para poblar la base de datos con datos iniciales (`seed-pos-data.ts`, `seed-initial.ts`).
-   **Migraciones**: Sistema de control de versiones de base de datos.

---

## 4. Frontend (Next.js)

El frontend utiliza **Next.js 16** con **App Router**, aprovechando las últimas características de React 19 para una experiencia de usuario fluida y reactiva.

### Tecnologías Clave:
-   **Framework**: Next.js 16.1.6
-   **Lenguaje**: TypeScript (v5.9)
-   **Estilos y Diseño**:
    -   **Tailwind CSS v4**: Framework de utilidades CSS.
    -   PostCSS
    -   `tailwindcss-animate` & `clsx`
-   **Gestión de Estado**: React Hooks nativos.
-   **Temas**: `next-themes` (Soporte para modo oscuro/claro).

### Librerías de UI y Componentes:
Una rica colección de librerías para una interfaz moderna:
-   **Componentes Base**:
    -   `@heroui/react`
    -   `@headlessui/react`
    -   `@radix-ui/react-dropdown-menu`
-   **Visualización de Datos**: `@tremor/react` (Gráficos para Dashboards).
-   **Iconografía**:
    -   `lucide-react`
    -   `@remixicon/react`
-   **Animaciones**:
    -   `framer-motion` (Animaciones complejas)
    -   `animejs`
    -   `@formkit/auto-animate` (Animaciones automáticas de listas)
-   **Notificaciones**: `sonner` (Toasts elegantes).

### Estructura de Rutas (App Router):
-   `/dashboard`: Panel principal de administración.
-   `/login`: Pantalla de inicio de sesión.
-   `/register`: Registro de nuevos usuarios.
-   `layout.tsx`: Layout raíz de la aplicación.
-   `globals.css`: Estilos globales y configuración de Tailwind.
-   `providers.tsx`: Configuración de contextos (temas, estado global).

---

## 5. Infraestructura y Servicios (Docker)

El proyecto utiliza **Docker Compose** para levantar servicios auxiliares necesarios para el desarrollo local:

1.  **PostgreSQL (Base de Datos)**
    -   Imagen: `postgres:16-alpine`
    -   Puerto Externo: **5433** (Mapeado al interno 5432 para evitar conflictos locales).
    -   Credenciales por defecto: Usuario/DB `dynamo`.
    -   Volumen persistente: `postgres_data`.

2.  **Redis (Caché y Mensajería)**
    -   Imagen: `redis:7-alpine`
    -   Puerto Externo: **6380** (Mapeado al interno 6379).
    -   Volumen persistente: `redis_data`.

---

## 6. Scripts de Desarrollo

### En Backend (`/backend`):
-   `npm run start:dev`: Inicia el servidor NestJS en modo desarrollo (watch).
-   `npm run prisma:migrate`: Aplica cambios del esquema a la base de datos.
-   `npm run prisma:generate`: Genera el cliente de Prisma actualizado.
-   `npm run prisma:seed`: Ejecuta los scripts de datos semilla.
-   `npm run test`: Ejecuta pruebas unitarias con Jest.

### En Frontend (`/frontend`):
-   `npm run dev`: Inicia el servidor de desarrollo de Next.js (Puerto 3000).
    -   *Nota*: Configurado para conectar a la API local en `http://localhost:8000`.
-   `npm run build`: Compila la aplicación para producción.
-   `npm run lint`: Analiza el código en busca de errores.
