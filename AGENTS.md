# Anzu Backend — Agent Instructions

## Stack
- NestJS 11 + TypeScript (`module: nodenext`, `moduleResolution: nodenext`)
- Prisma 7 + PostgreSQL
- JWT with refresh token rotation
- Swagger at `/api/docs`, API prefix `/api/v1`

## Required Workflow

```bash
# After ANY schema change
npx prisma generate   # regenerate Prisma client
npx prisma migrate dev # apply migration

# Start dev
npm run start:dev
```

## Verification Order (CI pipeline)

```
npx prisma generate → npx tsc --noEmit → npm test
```

Lint and typecheck are not in CI — only typecheck (`tsc --noEmit`).

## Dev Server
- Runs on `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/docs`
- CORS allows `localhost:5173` (Vite frontend) and `localhost:3001`

## Module Structure (src/)
- `auth/` — JWT strategy, refresh tokens, guards, decorators, DTOs
- `users/` — profiles, social links
- `cards/` — card search
- `inventory/` — user card inventory
- `home/` — feed of cards with most owners
- `public/` — public user inventories
- `sync/` — YGOProDeck catalog sync (admin only)
- `admin/` — sync status
- `prisma/` — Prisma service wrapper
- `health/` — health check

## Key Prisma Notes
- `BigInt` for card IDs (YGOProDeck uses 64-bit IDs)
- `inventario` model links cards to users with condition/price/language fields
- `store_products` model for e-commerce (Phase 2)
- Several models have check constraints requiring extra migration setup

## Auth
- JWT access tokens + refresh token rotation
- `RefreshJwtStrategy` in `src/auth/strategies/`
- Roles: `user` (default), `admin`

## Docker
- Push to `master` triggers Docker build + push to GHCR
- Image tag `latest` only on `master`