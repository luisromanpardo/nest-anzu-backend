# Sprint #1 — Autenticación

**Período**: Fase inicial
**Épica**: Épica 1 — Autenticación (US-01, US-02, US-03)
**Estado**: ✅ Completado

---

## User Stories

| ID | User Story | Criterios de Aceptación | Estado |
|----|-----------|-------------------------|--------|
| US-01 | Registro con usuario y contraseña | Email único, password hasheado con bcrypt, JWT devuelto | ✅ |
| US-02 | Inicio de sesión con JWT | Access token (15min) + refresh token (7d) con rotación, redirección post-login | ✅ |
| US-03 | Cierre de sesión | Invalidación de todos los refresh tokens del usuario | ✅ |

---

## Infraestructura de Soporte

Estas tareas no son User Stories pero fueron necesarias para habilitar el sprint:

| Tarea | Descripción | Estado |
|-------|-------------|--------|
| Phase 0 | Setup de dependencias: Prisma 7, @nestjs/jwt, passport, bcrypt, class-validator, swagger, schedule | ✅ |
| Phase 0 | Prisma db pull + db push para sincronizar schema existente con 14.341 cartas | ✅ |
| Phase 1 | Migración DB: columnas sociales en `users`, tabla `refresh_tokens`, tabla `sync_log` | ✅ |
| Phase 1 | Prisma schema actualizado con nuevos modelos y relaciones | ✅ |

---

## Endpoints Entregados

### Auth (`/api/v1/auth`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | — | Registra usuario, devuelve access + refresh token |
| `POST` | `/auth/login` | — | Login con email/password, devuelve tokens |
| `POST` | `/auth/refresh` | Refresh JWT | Rota access + refresh token |
| `POST` | `/auth/logout` | JWT | Revoca todos los refresh tokens del usuario |

### Users (`/api/v1/users`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/users/me` | JWT | Mi perfil completo + conteo de cartas |
| `PATCH` | `/users/me` | JWT | Actualizar perfil y redes sociales |
| `GET` | `/users/:username` | — | Perfil público de un usuario |

---

## Decisiones Técnicas

### 1. Prisma 7 + pg Adapter
Prisma 7 cambió su arquitectura de engine. Ya no acepta `url` en el schema.prisma. La URL de la DB va en `prisma.config.ts` y el constructor de `PrismaClient` requiere un `adapter` explícito de tipo `PrismaPg`.

```typescript
// src/prisma/prisma.service.ts
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
super({ adapter });
```

### 2. Refresh Token Rotation
Cada vez que se usa un refresh token, se revoca inmediatamente y se genera uno nuevo. Esto evita replay attacks. Los tokens se almacenan en la tabla `refresh_tokens` con campos `revoked` y `expires_at`.

### 3. DNI Temporal en Registro
El schema de `users` tiene `dni` como campo requerido (`unique`). Para el MVP se genera un dni temporal (`tmp_<timestamp>_<random>`) por usuario. En un futuro se puede hacer la migración de `vendedores` → `users` para poblar los dnis reales.

### 4. Password Temporal
El password se valida con bcrypt (12 rounds). El campo existente `password_hash` en la DB se reutiliza sin cambios.

---

## Archivos Cambiados

```
package.json                       (+ deps: prisma, @nestjs/jwt, passport, bcrypt, etc.)
.env                               (DATABASE_URL, JWT secrets, config)
.env.example                       (template de vars de entorno)
prisma/schema.prisma              (+ refresh_tokens, sync_log, campos en users)
prisma.config.ts                  (datasource URL para Prisma 7)

src/main.ts                        (ValidationPipe, CORS, Swagger, GlobalPrefix /api/v1)
src/app.module.ts                  (+ UsersModule, PrismaModule, AuthModule, ScheduleModule)

src/prisma/prisma.service.ts       (PrismaService con pg adapter)
src/prisma/prisma.module.ts        (Global PrismaModule)

src/auth/
  auth.module.ts
  auth.controller.ts
  auth.service.ts
  dto/register.dto.ts
  dto/login.dto.ts
  dto/refresh-token.dto.ts
  strategies/jwt.strategy.ts
  strategies/jwt-refresh.strategy.ts
  guards/jwt-auth.guard.ts
  guards/jwt-refresh.guard.ts
  guards/roles.guard.ts
  decorators/roles.decorator.ts
  decorators/current-user.decorator.ts
  enums/role.enum.ts
  exceptions/auth.exceptions.ts

src/users/
  users.module.ts
  users.controller.ts
  users.service.ts
  dto/update-profile.dto.ts
```

---

## Lo Que Falta (Sprints Siguientes)

| Sprint | Épica | Contenido |
|--------|-------|-----------|
| 2 | Cards + Admin/Sync | Búsqueda de cartas por nombre + arquetipo, sync semanal desde YGOProDeck API |
| 3 | Inventory | CRUD inventario personal con límite de 100 cartas distintas |
| 4 | Home+Discovery | Feed público, detalle de carta con propietarios |
| 5 | Perfil+Redes | Toggle privacidad, perfil público compartido |

---

## Cómo Testear Este Sprint

```bash
# Registro
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"yugi123","email":"yugi@email.com","password":"Password123"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"yugi@email.com","password":"Password123"}'

# logout (reemplazar TOKEN con el access token devuelto)
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer TOKEN"
```

Swagger disponible en: `http://localhost:3000/api/docs`