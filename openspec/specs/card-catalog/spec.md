# Card Catalog Specification

## Purpose

Provide search and filtering capabilities over the local card database (14,341 cards). Users need to find specific cards by name and/or archetype before adding them to their inventory.

## Requirements

### Requirement: Search Cards by Name

The system MUST allow any user (authenticated or not) to search cards by partial name match. Search MUST be case-insensitive.

**Scenarios:**

#### Scenario: Search by partial name

- GIVEN card "Dark Magician" exists in catalog
- WHEN user sends `GET /cards/search?q=dark mag`
- THEN the system returns 200 with matching cards
- AND results are sorted by relevance (name startsWith > contains)

#### Scenario: Search returns empty for no matches

- GIVEN no cards match "xyz123"
- WHEN user sends `GET /cards/search?q=xyz123`
- THEN the system returns 200 with empty array

### Requirement: Filter by Archetype

The system MUST allow filtering search results by archetype in addition to name search.

**Scenarios:**

#### Scenario: Search with archetype filter

- GIVEN cards with archetype "HERO" exist
- WHEN user sends `GET /cards/search?q=dark&archetype=HERO`
- THEN the system returns only cards matching BOTH name contains "dark" AND archetype = "HERO"

### Requirement: Pagination

The system MUST return paginated results with metadata (total, page, limit, totalPages).

**Scenarios:**

#### Scenario: Default pagination

- GIVEN more than 20 cards match the search
- WHEN user sends `GET /cards/search?q=dark`
- THEN the system returns first 20 results with pagination metadata
- AND total = total matching cards

#### Scenario: Custom pagination

- GIVEN more than 50 cards match the search
- WHEN user sends `GET /cards/search?q=dark&page=2&limit=50`
- THEN the system returns results 51-100 with page: 2, limit: 50

### Requirement: Card Response Shape

Each card in search results MUST include: id, name, type, archetype, frame_type, attribute, atk, def, level, and at least one image URL.

**Scenarios:**

#### Scenario: Card object structure

- GIVEN card "Dark Magician" in database
- WHEN this card appears in search results
- THEN it includes all core fields: id, name, type, archetype, frame_type, attribute, atk, def, level, card_images[0].image_url
