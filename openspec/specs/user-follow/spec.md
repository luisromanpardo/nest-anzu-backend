# User Follow Specification

## Purpose

Allow users to follow/unfollow other users to build a social graph. Following enables users to see activity from accounts they care about.

## Requirements

### Requirement: Follow a User

The system MUST allow an authenticated user to follow another user by providing the target user's ID. The system SHALL NOT allow a user to follow themselves. A user MUST NOT be able to follow the same user twice.

**Scenarios:**

#### Scenario: Successful follow

- GIVEN authenticated user A and existing user B
- WHEN user A sends `POST /social/follow/:userId` with user B's ID
- THEN the system creates a follow relationship and returns 201 with the follow data
- AND user B's follower_count increments

#### Scenario: Cannot follow self

- GIVEN authenticated user A
- WHEN user A sends `POST /social/follow/:userId` with their own userId
- THEN the system returns 400 Bad Request

#### Scenario: Cannot follow same user twice

- GIVEN authenticated user A already following user B
- WHEN user A sends `POST /social/follow/:userId` with user B's ID again
- THEN the system returns 409 Conflict

#### Scenario: Follow non-existent user

- GIVEN authenticated user A
- WHEN user A sends `POST /social/follow/:userId` with a userId that does not exist
- THEN the system returns 404 Not Found

### Requirement: Unfollow a User

The system MUST allow an authenticated user to unfollow a user they are currently following.

**Scenarios:**

#### Scenario: Successful unfollow

- GIVEN authenticated user A following user B
- WHEN user A sends `DELETE /social/unfollow/:userId` with user B's ID
- THEN the system removes the follow relationship and returns 204 No Content
- AND user B's follower_count decrements

#### Scenario: Unfollow when not following

- GIVEN authenticated user A not following user B
- WHEN user A sends `DELETE /social/unfollow/:userId` with user B's ID
- THEN the system returns 404 Not Found
