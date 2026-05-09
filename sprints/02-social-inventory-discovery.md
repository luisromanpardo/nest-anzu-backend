# Sprint #2 — Social, Inventario y Descubrimiento

**Período**: 2026-05-06 — 2026-05-08
**Épica**: Épicas 2–5 (Social Links, Cards + Sync, Inventory, Home + Public)
**Estado**: ✅ Completado

---

## User Stories

| ID    | User Story                     | Criterios de Aceptación                                                                 | Estado |
| ----- | ------------------------------ | --------------------------------------------------------------------------------------- | ------ |
| US-04 | Seguir/dejar de seguir usuario | POST /social/follow/:userId crea relación, DELETE la elimina, límite de self-follow     | ✅     |
| US-05 | Ver seguidores y siguiendo     | GET /social/followers/:userId y GET /social/following/:userId con paginado              | ✅     |
| US-06 | Buscar cartas del catálogo     | GET /cards/search?q=dark&archetype=HERO retorna resultados filtrados y paginados        | ✅     |
| US-07 | Sincronizar catálogo (admin)   | POST /admin/sync consume YGOProDeck API, upsert ~14k cartas, logs en sync_log           | ✅     |
| US-08 | Cron semanal automático        | Job @Cron('0 0 \* \* 0') ejecuta sync cada domingo a medianoche                         | ✅     |
| US-09 | CRUD inventario personal       | GET/POST/PATCH/DELETE /inventory/me con límite de 100 cartas distintas                  | ✅     |
| US-10 | Feed de cartas populares       | GET /home retorna top 50 cartas ordenadas por cantidad de owners (inventarios públicos) | ✅     |
| US-11 | Ver propietarios de una carta  | GET /cards/:id/owners retorna detalle de carta + lista de usuarios con esa carta        | ✅     |
| US-12 | Perfil público por username    | GET /u/:username retorna perfil e inventario completo sin auth                          | ✅     |

---

## Infraestructura de Soporte

| Tarea           | Descripción                                                             | Estado |
| --------------- | ----------------------------------------------------------------------- | ------ |
| Sprint 2 setup  | Crear 6 nuevos módulos: Social, Cards, Sync, Inventory, Home, Public    | ✅     |
| Schema          | Tabla `user_follows` para el social graph, `vendedor_id` con default(1) | ✅     |
| DB push         | Aplicar cambios de schema a PostgreSQL (31.97.92.73)                    | ✅     |
| Prisma generate | Regenerar client tras cambio de schema (Node 22 requerido)              | ✅     |
| Tests           | 37 unit tests cubriendo todos los servicios del sprint                  | ✅     |

---

## Endpoints Entregados

### Social (`/api/v1/social`)

| Método   | Endpoint                    | Auth | Descripción                  |
| -------- | --------------------------- | ---- | ---------------------------- |
| `POST`   | `/social/follow/:userId`    | JWT  | Seguir a un usuario          |
| `DELETE` | `/social/unfollow/:userId`  | JWT  | Dejar de seguir              |
| `GET`    | `/social/followers/:userId` | —    | Lista paginada de seguidores |
| `GET`    | `/social/following/:userId` | —    | Lista paginada de siguiendo  |
| `GET`    | `/social/followers/me`      | JWT  | Mis seguidores               |
| `GET`    | `/social/following/me`      | JWT  | Usuarios que sigo            |

### Cards (`/api/v1/cards`)

| Método | Endpoint        | Auth | Descripción                                         |
| ------ | --------------- | ---- | --------------------------------------------------- |
| `GET`  | `/cards/search` | —    | Buscar por nombre + filtrar por arquetipo, paginado |

### Admin (`/api/v1/admin`)

| Método | Endpoint             | Auth  | Descripción                               |
| ------ | -------------------- | ----- | ----------------------------------------- |
| `POST` | `/admin/sync`        | Admin | Trigger manual de sync con YGOProDeck API |
| `GET`  | `/admin/sync/status` | —     | Estado de la última sincronización        |

### Inventory (`/api/v1/inventory`)

| Método   | Endpoint         | Auth | Descripción                |
| -------- | ---------------- | ---- | -------------------------- |
| `GET`    | `/inventory/me`  | JWT  | Mi inventario completo     |
| `POST`   | `/inventory`     | JWT  | Agregar carta (límite 100) |
| `PATCH`  | `/inventory/:id` | JWT  | Editar cantidad/condición  |
| `DELETE` | `/inventory/:id` | JWT  | Eliminar carta             |

### Home (`/api/v1/home`)

| Método | Endpoint                 | Auth | Descripción                     |
| ------ | ------------------------ | ---- | ------------------------------- |
| `GET`  | `/home`                  | —    | Feed de cartas más populares    |
| `GET`  | `/home/cards/:id/owners` | —    | Detalle de carta + propietarios |

### Public (`/api/v1`)

| Método | Endpoint       | Auth | Descripción                      |
| ------ | -------------- | ---- | -------------------------------- |
| `GET`  | `/u/:username` | —    | Inventario público de un usuario |

---

## Decisiones Técnicas

### 1. Social Graph — `user_follows` en schema

Se creó una tabla de juntura `user_follows` con `follower_id` y `following_id` (unique constraint compuesto) y referencias a `users` via relaciones `UserFollower` y `UserFollowing`. Esto permite queries efficient de seguidores/siguiendo con include de los datos del usuario relacionado.

### 2. Card ID como BigInt

Todos los `card_id` en el schema son `BigInt` en PostgreSQL. En los services se usa `BigInt()` para convertir IDs coming from params en rutas.

### 3. Cron Semanal — Formato String

`@nestjs/schedule` no tiene `CronExpression.EVERY_WEEK_START`. Se usa el cron string `'0 0 * * 0'` (domingo a las 00:00) directamente sobre el decorator `@Cron()`.

### 4. inventario.vendedor_id con DB Default

El campo `vendedor_id` en la tabla `inventario` era requerido pero legacy (viene de la tabla `vendedores` original). Se agregó `default(1)` en el schema y se pasa explicit `vendedor_id: 1` en el create. Esto evita que cada inventario nuevo require un ID de vendor real.

### 5. Inventario — 100 Cartas Distintas

El límite es sobre `card_id` distintos (no cantidad total). Si el usuario ya tiene carta ID=5 en el inventario, agregar más unidades de esa misma carta sigue funcionando — solo se bloquea si quiere agregar una carta nueva distinta y ya tiene 100.

### 6. Sync — Chunked Processing

YGOProDeck devuelve ~14k cartas en un solo request. El sync las procesa en chunks de 100 usando `upsert` por `card.id`. Cada chunk se persiste independientemente. El `sync_log` registra stats al final: cards_created, cards_updated, total_cards, duration_ms.

---

## Archivos Cambiados / Creados

```
prisma/schema.prisma          (+ user_follows model, users relations, inventario.vendedor_id default)
prisma.config.ts              (URL de DB para Prisma 7)

src/app.module.ts             (+ SocialModule, CardsModule, SyncModule, InventoryModule, HomeModule, PublicModule)

src/social/
  social.module.ts
  social.controller.ts       (6 endpoints)
  social.service.ts           (follow/unfollow/getFollowers/getFollowing/getFollowCounts)

src/cards/
  cards.module.ts
  cards.controller.ts         (GET /search)
  cards.service.ts           (search con filtros + paginado)

src/sync/
  sync.module.ts             (HttpModule importado)
  sync.controller.ts         (POST /admin/sync, GET /admin/sync/status)
  sync.service.ts            (executeSync, handleCron, getLastSyncStatus)

src/inventory/
  inventory.module.ts
  inventory.controller.ts    (4 endpoints)
  inventory.service.ts        (getMyInventory, addCard, updateItem, deleteItem)
  dto/index.ts               (AddInventoryDto, UpdateInventoryDto)

src/home/
  home.module.ts
  home.controller.ts         (GET /home, GET /cards/:id/owners)
  home.service.ts            (getPopularCards, getCardOwners)

src/public/
  public.module.ts
  public.controller.ts       (GET /u/:username)
  public.service.ts         (getProfileByUsername)

openspec/
  changes/sprint-2-social-inventory-discovery/proposal.md
  specs/user-follow/spec.md
  specs/social-graph/spec.md
  specs/card-catalog/spec.md
  specs/catalog-sync/spec.md
  specs/inventory-management/spec.md
  specs/public-discovery/spec.md
  specs/public-profile/spec.md

src/social/social.service.spec.ts
src/cards/cards.service.spec.ts
src/inventory/inventory.service.spec.ts
src/home/home.service.spec.ts
src/public/public.service.spec.ts
src/sync/sync.service.spec.ts
```

---

## Lo Que Falta (Sprints Siguientes)

| Sprint | Épica         | Contenido                                                   |
| ------ | ------------- | ----------------------------------------------------------- |
| 3      | Comments      | Comentarios en perfiles públicos y cartas                   |
| 4      | OAuth Google  | Login con Google (Release 2)                                |
| 5      | Notifications | Alertas por email/push cuando alguien te sigue o interactúa |

---

## Cómo Testear Este Sprint

```bash
# Follow/unfollow
curl -X POST http://localhost:3000/api/v1/social/follow/2 \
  -H "Authorization: Bearer TOKEN"

curl -X DELETE http://localhost:3000/api/v1/social/unfollow/2 \
  -H "Authorization: Bearer TOKEN"

# Buscar cartas
curl "http://localhost:3000/api/v1/cards/search?q=dark%20magician&archetype=Dark"

# Agregar al inventario
curl -X POST http://localhost:3000/api/v1/inventory \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"card_id": 46986414, "condicion": "Near Mint", "idioma": "Inglés"}'

# Ver home feed
curl "http://localhost:3000/api/v1/home"

# Ver perfil público
curl "http://localhost:3000/api/v1/u/yugi123"
```

Swagger disponible en: `http://localhost:3000/api/docs`
