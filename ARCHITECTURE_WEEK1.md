# Dynamo Solutions – Reingeniería SaaS (Semana 1)

## Objetivo de Semana 1
- Definir arquitectura base SaaS multiempresa (multi-tenant).
- Modelar base de datos inicial.
- Dejar backend funcional y preparado para autenticación y módulos de negocio.

## Decisiones de arquitectura

### Modelo multi-tenant
- Estrategia: **row-level multi-tenant**.
- Regla: toda entidad de negocio incluye `tenantId`.
- Beneficio: operación más simple en VPS, menor costo inicial, escalabilidad práctica.

### Resolución del tenant
- Modo actual (dev / mientras DNS no está listo): header `x-tenant-slug`.
- Modo futuro (producción recomendado): subdominio `tenantSlug.dominio.com`.
- Implementación: `TenantMiddleware`.

### Backend
- Framework: NestJS (TypeScript).
- ORM: Prisma.
- DB: PostgreSQL.
- Cache/colas (futuro): Redis.

## Módulos base
- Configuración global: `@nestjs/config`.
- Persistencia: `PrismaModule` (global).
- Healthcheck: `GET /health`.
- Tenant: `TenantMiddleware` (prepara el request con contexto de tenant).

## Modelo de datos (mínimo)
- `Tenant`: empresa (tenant).
- `Branch`: sucursales por empresa.
- `User`: usuario por tenant.
- `Role`, `Permission`, `UserRole`, `RolePermission`: RBAC dinámico.
- `Session`: tokens/refresh (almacenamiento por hash).
- `AuditLog`: auditoría por tenant.

## Entorno local
- `docker-compose.yml` (raíz): PostgreSQL + Redis.
- Variables backend: `backend/.env` y `backend/.env.example`.

## Próximos pasos (Semana 2)
- Registro de tenant + usuario admin.
- Login multiempresa con JWT + refresh tokens.
- Roles/permissions iniciales (seeds).
- Middleware/guard para inyectar `tenantId` en consultas.
