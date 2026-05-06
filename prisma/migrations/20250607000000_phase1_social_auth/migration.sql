-- Migration: Phase 1 - Social Auth Extensions
-- Purpose: Add social links, privacy toggle, refresh tokens, and sync log
-- This is safe to run on existing DB - all changes are additive

-- ============================================================
-- 1. Add social columns to users table
-- ============================================================
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" VARCHAR(20) DEFAULT 'user' NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "instagram" VARCHAR(100);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twitter" VARCHAR(100);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "facebook" VARCHAR(150);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "whatsapp" VARCHAR(20);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "discord" VARCHAR(100);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "konami_id" VARCHAR(50);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_public" BOOLEAN DEFAULT true NOT NULL;

-- ============================================================
-- 2. Add FK from inventario to users
-- ============================================================
ALTER TABLE "inventario" ADD COLUMN IF NOT EXISTS "user_id" INT REFERENCES "users"("id") ON DELETE CASCADE;

-- ============================================================
-- 3. Create refresh_tokens table
-- ============================================================
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token" TEXT NOT NULL UNIQUE,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "revoked" BOOLEAN DEFAULT false NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user_id" ON "refresh_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_token" ON "refresh_tokens"("token");

-- ============================================================
-- 4. Create sync_log table
-- ============================================================
CREATE TABLE IF NOT EXISTS "sync_log" (
    "id" SERIAL PRIMARY KEY,
    "synced_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "total_cards" INT,
    "cards_created" INT DEFAULT 0 NOT NULL,
    "cards_updated" INT DEFAULT 0 NOT NULL,
    "status" VARCHAR(20) DEFAULT 'success' NOT NULL,
    "error_message" TEXT,
    "duration_ms" INT
);

CREATE INDEX IF NOT EXISTS "idx_sync_log_synced_at" ON "sync_log"("synced_at" DESC);