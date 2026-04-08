# Auth And Access Plan

## Recommended Authentication Model

For the first production version:

- Parents authenticate with `Supabase Auth` using email and password.
- Children do not get independent email-based accounts in MVP.
- A parent session can switch into child mode inside the app.
- A child PIN-based quick entry flow can be added later if needed.

This is the lowest-friction approach that still matches the product's ownership model.

## Why This Model Is Better

- a parent is the real account owner
- a child should not need email in early versions
- family setup remains simple
- support burden stays lower
- permissions are much easier to reason about

## Roles

### Parent

Can:

- sign in
- manage household setup
- create and edit task templates
- approve or reject submitted tasks
- view reports
- switch into child mode

### Child

Can:

- view child pages
- submit or progress tasks
- claim rewards
- view characters, map, collection, and achievements

Cannot:

- edit templates
- see parent reporting
- manage household settings

## Household Model

Every authenticated parent belongs to a household.

Each child profile also belongs to a household.

All task, reward, character, and progress data must be scoped by household.

## Session Model

### Parent session

- powered by Supabase Auth cookie session
- used for all protected routes

### Child mode session

The app stores which child is currently active for the parent session.

Recommended implementation:

- keep the real authenticated user as the parent
- store `acting_child_id` in a signed server-side session or secure cookie
- guard all child operations by checking:
  - parent is authenticated
  - parent belongs to the same household
  - acting child belongs to that household
