# Proposal: Sprint #2 — Social Links, Inventory & Discovery

## Intent

Completar las épicas 2–5 del PRD v2.0: módulo de seguimiento entre usuarios (social graph), CRUD completo del inventario personal con límite de 100 cartas, búsqueda de cartas en el catálogo local, sync con YGOProDeck API (manual + cron semanal), y endpoints públicos de descubrimiento (home feed + perfil público).

## Scope

### In Scope

- **SocialModule**: seguir/dejar de seguir usuarios, listar seguidores y siguiendo, feed de actividad
- **CardsModule**: búsqueda por nombre + filtro por arquetipo con paginado
- **SyncModule**: sync manual (POST /admin/sync) + cron semanal automático desde YGOProDeck API
- **InventoryModule**: CRUD completo (GET/POST/PATCH/DELETE /inventory), límite de 100 cartas distintas por usuario
- **HomeModule**: GET /home (cartas más populares entre inventarios públicos), GET /cards/:id/owners
- **PublicModule**: GET /u/:username (inventario público completo)
- DTOs de request/response con validación Swagger
- Guards de RBAC (admin para sync, user para inventory)
- Tests unitarios para servicios core

### Out of Scope

- OAuth Google (Release 2)
- Notifications o alertas por email/push
- Migración de imágenes a S3 (Release 3)
- Frontend (React/Next.js)
- Órdenes, carrito, store_products (ya existen en producción)

## Capabilities

### New Capabilities

- `user-follow`: Seguir y dejar de seguir a otros usuarios
- `social-graph`: Ver seguidores y lista de usuarios que sigo
- `card-catalog`: Búsqueda filtrada del catálogo local de 14.341 cartas
- `catalog-sync`: Sync incremental desde YGOProDeck API con logging
- `inventory-management`: CRUD del inventario personal con límite de 100 items
- `public-discovery`: Feed público y detalle de carta con owners
- `public-profile`: Inventario compartido por username

### Modified Capabilities

- None

## Approach

1. **Social primero**: Inventario necesita saber `user_id` → relationship ya existe en schema. Social graph es independiente, tabla `user_follows` nueva.
2. **CardsModule simple**: Solo lectura del catálogo local (no fetch externo), Prisma queries con filtros en `name` y `archetype`.
3. **SyncModule**: Consumo de YGOProDeck API v7, chunks de 100 cartas, upsert por `id`. Cron configurable con `@nestjs/schedule`.
4. **InventoryModule**: Validar límite de 100 items antes de INSERT. Transacción Prisma para consistency.
5. **Home/Public**: Queries agregadas con `_count` de inventario público + joins.

## Affected Areas

| Área                   | Impacto  | Descripción                                               |
| ---------------------- | -------- | --------------------------------------------------------- |
| `src/social/`          | New      | SocialModule completo (controller, service, DTOs, guards) |
| `src/cards/`           | New      | CardsModule (search con filtros, paginado)                |
| `src/sync/`            | New      | SyncModule (YGOProDeck consumer, cron job)                |
| `src/inventory/`       | New      | InventoryModule (CRUD con límite 100)                     |
| `src/home/`            | New      | HomeModule (feed público)                                 |
| `src/public/`          | New      | PublicModule (/u/:username)                               |
| `prisma/schema.prisma` | Modified | Agregar `UserFollow` model                                |
| `src/app.module.ts`    | Modified | Registrar nuevos módulos                                  |
| `src/auth/guards/`     | Modified | AdminGuard existente, crear RolesGuard si no existe       |

## Risks

| Riesgo                                    | Probabilidad | Mitigación                                                         |
| ----------------------------------------- | ------------ | ------------------------------------------------------------------ |
| YGOProDeck API rate limit o timeout       | Media        | Retry con exponential backoff, sync_log registra errores por carta |
| Límite 100 cartas generando fricción      | Baja         | Validación clara en DTO, mensaje descriptivo en 400                |
| Tabla `user_follows` nueva sin datos seed | Baja         | Migration aditiva, no afecta tablas existentes                     |
| Cron en servidor sin actividad            | Baja         | Health check endpoint, logs de ejecución                           |

## Rollback Plan

- Prisma migrations son reversibles con `prisma migrate dev --reset` en desarrollo
- `UserFollow` table es nueva y no tiene relaciones cascade criticas
- SyncModule: si falla, `sync_log` registra el error y cartas existentes siguen intactas
- InventoryModule: soft delete oarchivo lógico, no hay cascade peligrosa
- Si cron no ejecuta, endpoint manual `/admin/sync` sigue funcionando

## Dependencies

- PostgreSQL `anzu` en `31.97.92.73` (ya disponible)
- YGOProDeck API: `https://db.ygoprodeck.com/api/v7/cardinfo.php` (pública, sin auth)
- `@nestjs/schedule` (ya instalado según app.module.ts)
- `class-validator` + `class-transformer` (para DTOs)

## Success Criteria

- [ ] `POST /social/follow/:userId` y `DELETE /social/unfollow/:userId` funcionan
- [ ] `GET /social/followers` y `GET /social/following`devuelven lista paginada
- [ ] `GET /cards/search?q=dark&archetype=HERO` devuelve resultados filtrados y paginados
- [ ] `POST /admin/sync` triggerea sync y devuelve stats (created/updated/skipped)
- [ ] Cron semanal ejecuta sync automáticamente (verificar en logs)
- [ ] `POST /inventory` devuelve 400 al superar 100 cartas distintas
- [ ] `GET /inventory/me` devuelve solo las cartas del usuario autenticado
- [ ] `GET /home` devuelve las 50 cartas con más owners (inventarios públicos)
- [ ] `GET /u/:username` devuelve inventario completo sin auth
- [ ] `GET /cards/:id/owners` devuelve lista de usuarios que tienen esa carta
- [ ] Tests unitarios cubriendo servicios core con >80% coverage
