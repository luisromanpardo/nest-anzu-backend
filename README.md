# Anzu — TCG Shared Card Inventory API

**Anzu** es una API REST para coleccionistas de cartas TCG (Trading Card Games) que permite gestionar inventarios personales, descubrir qué cartas tienen otros coleccionistas y coordinar intercambios o ventas entre usuarios.

---

## Stack

- **Backend**: NestJS 11 + TypeScript
- **ORM**: Prisma 7 con PostgreSQL
- **Auth**: JWT con refresh token rotation
- **API Docs**: Swagger en `/api/docs`

---

## Project Setup

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores correspondientes

# Generar Prisma Client (luego de modificar el schema)
npx prisma generate

# Aplicar migraciones a la DB
npx prisma migrate dev

# Levantar en desarrollo
npm run start:dev
```

---

## Compile and Run

```bash
# Desarrollo (watch mode)
npm run start:dev

# Producción
npm run start:prod
```

---

## API Endpoints

### Auth `/api/v1/auth`

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | — | Registro de nuevo usuario |
| `POST` | `/auth/login` | — | Inicio de sesión |
| `POST` | `/auth/refresh` | Refresh JWT | Renovar access token |
| `POST` | `/auth/logout` | JWT | Cerrar sesión |

### Users `/api/v1/users`

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/users/me` | JWT | Mi perfil completo |
| `PATCH` | `/users/me` | JWT | Actualizar perfil y redes sociales |
| `GET` | `/users/:username` | — | Perfil público de un usuario |

### Cards `/api/v1/cards`

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/cards/search` | — | Buscar cartas por nombre y/o arquetipo |

### Admin `/api/v1/admin`

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `POST` | `/admin/sync` | Admin | Sincronizar catálogo desde YGOProDeck |
| `GET` | `/admin/sync/status` | Admin | Estado de la última sincronización |

### Inventory `/api/v1/inventory`

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/inventory/me` | JWT | Mi inventario (limitado a 100 cartas) |
| `POST` | `/inventory` | JWT | Agregar carta al inventario |
| `PATCH` | `/inventory/:id` | JWT | Editar cantidad/condición |
| `DELETE` | `/inventory/:id` | JWT | Eliminar carta del inventario |

### Home `/api/v1/home`

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/home` | — | Feed de cartas con más dueños |
| `GET` | `/cards/:id/owners` | — | Detalle de carta + propietarios |

### Public `/api/v1`

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/u/:username` | — | Inventario público compartido |

---

## Tests

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Coverage
npm run test:cov
```

---

## Documentación

- Swagger UI: `http://localhost:3000/api/docs`
- SprinDocs en `sprints/`

---

## Licencia

MIT