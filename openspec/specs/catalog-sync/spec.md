# Catalog Sync Specification

## Purpose

Keep the local card catalog synchronized with the YGOProDeck upstream API. Sync can be triggered manually by admins or run automatically via weekly cron job.

## Requirements

### Requirement: Manual Sync via Admin Endpoint

The system MUST allow admin users to trigger a full catalog sync via POST /admin/sync. The sync MUST fetch all cards from YGOProDeck API and upsert into the local database.

**Scenarios:**

#### Scenario: Admin triggers successful sync

- GIVEN authenticated admin user
- WHEN admin sends `POST /admin/sync`
- THEN the system fetches all cards from YGOProDeck API
- AND upserts cards (create new, update existing)
- AND returns 200 with sync stats: cards_created, cards_updated, total_cards, duration_ms

#### Scenario: Non-admin cannot trigger sync

- GIVEN authenticated regular user (role=user)
- WHEN user sends `POST /admin/sync`
- THEN the system returns 403 Forbidden

### Requirement: Sync Logs

The system MUST record every sync execution in sync_log table with timestamp, stats, and error details.

**Scenarios:**

#### Scenario: Sync logged on success

- GIVEN admin triggers sync
- WHEN sync completes successfully
- THEN the system creates sync_log entry with status: "success", cards_created, cards_updated, duration_ms

#### Scenario: Sync logged on failure

- GIVEN admin triggers sync
- WHEN sync fails mid-execution
- THEN the system creates sync_log entry with status: "failed", error_message, partial stats if available

### Requirement: Sync Status Endpoint

The system MUST expose GET /admin/sync/status returning the last sync execution.

**Scenarios:**

#### Scenario: Get last sync status

- GIVEN previous sync logged with stats
- WHEN admin sends `GET /admin/sync/status`
- THEN the system returns 200 with last sync_log entry (synced_at, cards_created, cards_updated, status, error_message, duration_ms)

### Requirement: Weekly Cron Job

The system MUST run catalog sync automatically once per week using @nestjs/schedule.

**Scenarios:**

#### Scenario: Cron triggers sync on schedule

- GIVEN it is the configured weekly time
- WHEN the cron job fires
- THEN the system executes the same sync logic as manual trigger
- AND logs "Cron sync completed" with stats

### Requirement: Chunked Processing

The system MUST process YGOProDeck API response in chunks of 100 cards to avoid memory issues.

**Scenarios:**

#### Scenario: Process in chunks of 100

- GIVEN YGOProDeck returns ~14,000 cards
- WHEN sync processes the response
- THEN cards are processed in batches of 100 via upsertMany
- AND each chunk commits independently
