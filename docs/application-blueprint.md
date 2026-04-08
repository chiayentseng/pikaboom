# Application Blueprint

## Goal

This document translates the architecture decision into a practical implementation blueprint for future development.

## Project Layers

Recommended structure:

```text
app/
  (marketing)/
  (auth)/
  app/
    child/
    parent/
    settings/
  api/

components/
  child/
  parent/
  shared/

lib/
  auth/
  db/
  domain/
  repositories/
  services/
  validations/
```

## Responsibility By Layer

### `app/`

Contains:

- routes
- layouts
- server components
- server actions

Rules:

- keep page files focused on UI composition
- do not place reward calculation directly in page components

### `lib/auth/`

Contains:

- Supabase auth helpers
- current user lookup
- role and household guards

### `lib/db/`

Contains:

- Supabase client creation
- typed database access utilities
- local development fallback only while migration is incomplete

### `lib/repositories/`

Contains data access functions for tables such as:

- profiles
- households
- task templates
- daily task instances
- task logs
- reward logs
- child characters
- child world progress

### `lib/domain/`

Contains pure game logic such as:

- level calculation
- streak calculation
- unlock conditions
- reward generation

### `lib/services/`

Contains workflow orchestration such as:

- submit task
- approve task
- reject task
- claim reward
- generate daily tasks

This is where transactional integrity should live.

## Recommended Data Model

### Identity

- `profiles`
- `households`
- `household_members`
- `child_profiles`

### Task System

- `task_templates`
- `daily_task_instances`
- `task_logs`

### Progression

- `reward_logs`
- `characters`
- `child_characters`
- `worlds`
- `world_areas`
- `child_world_progress`

## Critical Workflow Shape

### Submit task

1. Child starts from child page
2. Server action validates access
3. A task log is created or updated
4. Status becomes `SUBMITTED` or `READY_TO_CLAIM`

### Approve task

1. Parent opens approval page
2. Server validates parent belongs to same household
3. Task log status becomes `READY_TO_CLAIM`

### Claim reward

1. Child claims reward
2. Server performs settlement transaction
3. Profile, streak, rewards, world progress, and character growth update together
4. Task log becomes `CLAIMED`

## Environment Strategy

### Local development

Use:

- `.env.local`
- local Next.js
- temporary local database or Supabase local stack

### Production

Use:

- Vercel environment variables
- Supabase hosted project

## Recommended Implementation Order

### Phase 1

- set up Supabase project
- add auth helpers
- create core schema
- wire parent login

### Phase 2

- migrate task templates
- migrate daily task flow
- migrate approval flow
- migrate reward settlement

### Phase 3

- migrate reports
- migrate characters and world progression
- add storage support for proof uploads

## Developer Guardrails

- never compute final rewards only in client code
- never let task template edits overwrite history
- never bypass household scoping
- prefer typed repository calls over ad hoc SQL in pages
- keep domain rules testable and isolated from framework code
