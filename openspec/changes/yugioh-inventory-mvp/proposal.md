# Proposal: Yu-Gi-Oh! Shared Card Inventory — MVP Backend

## Intent

Construir el backend completo del MVP para una plataforma de inventarios compartidos de cartas Yu-Gi-Oh!.
El sistema actual tiene un schema de DB parcialmente útil (14.341 cartas importadas, schema de cards sólido) pero con dos sistemas de usuario paralelos (`users` + `vendedores`) y un inventario desconectado del auth. Necesitamos unificar, extender y construir todos los módulos NestJS para cumplir las Épicas 1–6 del PRD v2.0.

## Scope

### In Scope
- Setup de Prisma con introspección + migraciones sobre DB existente
- Instalación y configuración de todas las dependencias necesarias
- Migración del schema: unificar `users`+`vendedores`, reconectar `inventario` a `users`
- Nuevas tablas: `refresh_tokens`, `sync_log`
- **AuthModule**: registro, login, logout, refresh token rotation (JWT)
- **UsersModule**: perfil público, redes sociales, toggle de privacidad
- **CardsModule**: búsqueda por nombre + filtro por arquetipo (paginado)
- **AdminModule + SyncModule**: sync manual + cron semanal desde YGOProDeck API
- **InventoryModule**: CRUD con límite de 100 cartas distintas por usuario
- **HomeModule**: feed público de cartas con contadores de dueños
- **PublicModule**: endpoint `/u/:username` para inventario público

### Out of Scope
- OAuth Google (Release 2)
- Toggle de privacidad por inventario con UI (Release 2)
- Migración de imágenes a S3 (Release 3)
- Frontend (React/Next.js)
- Cart, orders, store_products (flujo e-commerce existente — no tocar)

## Capabilities

### New Capabilities
- `auth`: Registro, login, logout y refresh token rotation con JWT
- `user-profile`: Perfil público con redes sociales y toggle de privacidad
- `card-catalog`: Búsqueda y filtrado de cartas del catálogo local
- `catalog-sync`: Sincronización manual y programada desde YGOProDeck API
- `inventory-management`: CRUD del inventario personal con límite de 100 cartas
- `public-discovery`: Home feed y detalle de carta con listado de propietarios
- `public-profile`: Vista pública del inventario por URL `/u/:username`

### Modified Capabilities
- None

## Approach

1. **Prisma-first**: `prisma db pull` para introspección del schema existente, luego migraciones aditivas con `prisma migrate dev`
2. **No romper lo existente**: `cart`, `orders`, `store_products` no se tocan — están en producción
3. **Unificación de usuarios**: migrar datos de `vendedores` → `users` y deprecar la tabla `vendedores` post-migración
4. **Sync en chunks**: YGOProDeck devuelve ~14k cartas en un solo request; se procesan en batches de 100 con upsert por `card.id`
5. **Roles inline**: el campo `user_type` en `users` pasa a ser `role` (admin | user), eliminando la dependencia de `user_roles`

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `src/` | New | Todos los módulos NestJS desde cero |
| `prisma/schema.prisma` | New | Schema generado por introspección + extensiones |
| `DB: users` | Modified | Agregar columnas sociales, `is_public`, unificar con vendedores |
| `DB: inventario` | Modified | Agregar `user_id`, mantener `vendedor_id` temporal |
| `DB: refresh_tokens` | New | Tabla de refresh tokens |
| `DB: sync_log` | New | Historial de sincronizaciones |

## Risks

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Migración `vendedores`→`users` rompe referencias existentes | Baja | inventario vacío (0 rows), solo 1 vendedor; migración manual controlada |
| YGOProDeck API cambia su schema | Media | Sync service con validación defensiva; sync_log registra errores por carta |
| `user_roles` tabla usada por código externo no identificado | Baja | Mantener tabla `user_roles` intacta, agregar `role` column a `users` |

## Rollback Plan

- Las migraciones de Prisma son reversibles con `prisma migrate dev --reset` en desarrollo
- Las columnas nuevas en `users` son todas nullable — no rompen registros existentes
- Si sync falla, `sync_log` registra el error y las cartas existentes siguen intactas
- `vendedores` no se dropea hasta confirmar que la migración es estable

## Dependencies

- PostgreSQL `anzu` en `31.97.92.73` (ya disponible, 14.341 cartas importadas)
- YGOProDeck API: `https://db.ygoprodeck.com/api/v7/cardinfo.php` (pública, sin auth)
- Node.js 20+, NestJS 11.x (ya instalado)

## Success Criteria

- [ ] `POST /auth/register` y `POST /auth/login` devuelven JWT válido
- [ ] `POST /admin/sync` actualiza cartas y registra en `sync_log`
- [ ] `POST /inventory` rechaza con 400 al superar 100 cartas distintas
- [ ] `GET /home` devuelve cartas con conteo de dueños (solo inventarios públicos)
- [ ] `GET /u/:username` devuelve inventario completo sin autenticación
- [ ] `GET /cards/search?q=dark&archetype=HERO` devuelve resultados paginados
- [ ] Cron semanal registrado y ejecutable manualmente vía endpoint admin
