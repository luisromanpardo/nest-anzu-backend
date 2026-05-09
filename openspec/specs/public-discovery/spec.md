# Public Discovery Specification

## Purpose

Enable anonymous (unauthenticated) users to discover popular cards and find owners of specific cards through public endpoints.

## Requirements

### Requirement: Home Feed — Popular Cards

The system MUST expose GET /home returning the top 50 cards sorted by number of owners (inventario count). Only cards from PUBLIC inventories are counted.

**Scenarios:**

#### Scenario: Get popular cards feed

- GIVEN cards with various owner counts from public inventories
- WHEN anyone sends `GET /home`
- THEN the system returns 200 with top 50 cards
- AND results include card details + owner_count
- AND sorted by owner_count DESC

### Requirement: Card Detail with Owners

The system MUST expose GET /cards/:id/owners returning the card details plus a list of users who own it in their public inventory.

**Scenarios:**

#### Scenario: Get card owners

- GIVEN card with id=100 exists and is in 5 public inventories
- WHEN anyone sends `GET /cards/100/owners`
- THEN the system returns 200 with card details
- AND array of owners (username, cantidad, condicion) from public inventories only

#### Scenario: Card not found

- GIVEN card with id=999999 does not exist
- WHEN anyone sends `GET /cards/999999/owners`
- THEN the system returns 404 Not Found
