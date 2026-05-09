# Social Graph Specification

## Purpose

Expose the social connections between users — followers and following lists. The social graph drives discovery and community features.

## Requirements

### Requirement: List Followers

The system MUST return a paginated list of users following a specific user. The list MUST include user metadata (username, avatar, created_at).

**Scenarios:**

#### Scenario: Get followers paginated

- GIVEN public user A with followers B and C
- WHEN anyone sends `GET /social/followers/:userId?page=1&limit=20`
- THEN the system returns 200 with array of follower users
- AND pagination metadata (total, page, limit)

#### Scenario: Get own followers (authenticated)

- GIVEN authenticated user A with followers B and C
- WHEN user A sends `GET /social/followers/me`
- THEN the system returns 200 with the same follower data

### Requirement: List Following

The system MUST return a paginated list of users that a specific user follows.

**Scenarios:**

#### Scenario: Get following paginated

- GIVEN public user A following users B and C
- WHEN anyone sends `GET /social/following/:userId?page=1&limit=20`
- THEN the system returns 200 with array of following users

#### Scenario: Get own following (authenticated)

- GIVEN authenticated user A following users B and C
- WHEN user A sends `GET /social/following/me`
- THEN the system returns 200 with the same following data

### Requirement: Follower and Following Counts

The system MUST expose follower_count and following_count on user profiles.

**Scenarios:**

#### Scenario: Counts on public profile

- GIVEN user A follows 15 users and has 42 followers
- WHEN anyone fetches `GET /users/:username`
- THEN the response includes follower_count: 42 and following_count: 15
