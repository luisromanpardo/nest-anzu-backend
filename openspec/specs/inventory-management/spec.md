# Inventory Management Specification

## Purpose

Allow authenticated users to manage their personal card inventory with Create, Read, Update, and Delete operations. Each user is limited to 100 distinct cards in their inventory.

## Requirements

### Requirement: Add Card to Inventory

The system MUST allow authenticated users to add a card to their inventory. The system MUST reject additions that would exceed 100 distinct cards.

**Scenarios:**

#### Scenario: Add card successfully (under limit)

- GIVEN authenticated user with 50 cards in inventory
- WHEN user sends `POST /inventory` with card_id, cantidad, condicion, idioma, edicion
- THEN the system creates inventario entry linked to user
- AND returns 201 with the created inventory item

#### Scenario: Reject when at 100 cards

- GIVEN authenticated user with 100 distinct cards in inventory
- WHEN user sends `POST /inventory` with a new card_id
- THEN the system returns 400 Bad Request with message "Inventory limit reached (100 cards)"

#### Scenario: Add duplicate card increases quantity

- GIVEN authenticated user already has card_id=5 in inventory with cantidad=1
- WHEN user sends `POST /inventory` with card_id=5, cantidad=2
- THEN the system updates existing inventory item cantidad=3
- AND returns 200 (not 201)

### Requirement: List Own Inventory

The system MUST allow authenticated users to view their complete inventory with card details.

**Scenarios:**

#### Scenario: Get own inventory

- GIVEN authenticated user with inventory items
- WHEN user sends `GET /inventory/me`
- THEN the system returns 200 with array of inventory items
- AND each item includes card details (name, type, archetype, images)

### Requirement: Update Inventory Item

The system MUST allow authenticated users to update cantidad, condicion, idioma, edicion, or notas of their own inventory items.

**Scenarios:**

#### Scenario: Update cantidad

- GIVEN authenticated user owns inventory item with cantidad=1
- WHEN user sends `PATCH /inventory/:id` with cantidad=5
- THEN the system updates cantidad to 5
- AND returns 200 with updated item

#### Scenario: Cannot update other user's inventory

- GIVEN user A owns inventory item X, user B is authenticated
- WHEN user B sends `PATCH /inventory/:id` with item X's id
- THEN the system returns 403 Forbidden

### Requirement: Delete Inventory Item

The system MUST allow authenticated users to delete items from their inventory.

**Scenarios:**

#### Scenario: Delete own inventory item

- GIVEN authenticated user owns inventory item with id=10
- WHEN user sends `DELETE /inventory/:id` with id=10
- THEN the system removes the inventory entry
- AND returns 204 No Content

#### Scenario: Cannot delete other user's inventory

- GIVEN user A owns inventory item X, user B is authenticated
- WHEN user B sends `DELETE /inventory/:id` with item X's id
- THEN the system returns 403 Forbidden

### Requirement: Inventory Count Validation

The system MUST count distinct card_ids in inventory (not total quantity) when enforcing the 100 card limit.

**Scenarios:**

#### Scenario: 100 different cards counted separately

- GIVEN authenticated user has exactly 100 distinct cards (each cantidad could be >1)
- WHEN user tries to add a 101st distinct card
- THEN the system returns 400 (limit reached)
- AND adding more of an existing card (e.g., cantidad 2→3) still works
