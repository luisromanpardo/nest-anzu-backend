# Public Profile Specification

## Purpose

Expose a user's public inventory via a vanity URL (username-based) for sharing and discovery without authentication.

## Requirements

### Requirement: Public Inventory by Username

The system MUST expose GET /u/:username returning the user's public profile and their inventory of public cards.

**Scenarios:**

#### Scenario: Get public profile and inventory

- GIVEN user "johndoe" with 15 public inventory items
- WHEN anyone sends `GET /u/johndoe`
- THEN the system returns 200 with:
  - username, role, created_at
  - social links (instagram, twitter, whatsapp, discord, konami_id) if set
  - card_count: 15
  - inventory array: each item with card details (name, type, archetype, image) + cantidad, condicion, idioma

#### Scenario: User not found

- GIVEN no user with username "nonexistent"
- WHEN anyone sends `GET /u/nonexistent`
- THEN the system returns 404 Not Found

### Requirement: Private User Profile

The system MUST return 404 for users with is_public=false regardless of inventory contents.

**Scenarios:**

#### Scenario: Private user is not found

- GIVEN user "privateuser" has is_public=false
- WHEN anyone sends `GET /u/privateuser`
- THEN the system returns 404 Not Found
- AND does not reveal that the user exists
