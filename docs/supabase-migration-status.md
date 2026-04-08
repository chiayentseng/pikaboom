# Supabase Migration Status

## Current State

The app now supports a managed migration path instead of a hard cutover.

Runtime behavior:

- `PIKABOOM_APP_MODE=local`
  - uses local cookie auth
  - uses SQLite repository for all game data
- `PIKABOOM_APP_MODE=supabase`
  - uses Supabase Auth session
  - resolves parent profile, household, and default child profile from Supabase
  - uses the Supabase repository only when the required household/profile context exists
  - falls back to SQLite when cloud setup is still incomplete

This keeps development usable while production infrastructure is being wired.

## Implemented In Code

### Session Resolution

Implemented:

- read authenticated parent from Supabase Auth
- resolve `profiles`
- resolve `household_members`
- resolve first available `child_profiles` record
- support child mode through `acting_child_id` cookie

Files:

- `lib/auth/session.ts`
- `app/auth-actions.ts`

### Repository Switching

Implemented:

- service layer chooses repository at runtime
- SQLite remains the safe fallback
- Supabase repository can now serve the first production-facing flows

Files:

- `lib/services/game-service.ts`
- `lib/repositories/sqlite-game-repository.ts`
- `lib/repositories/supabase-game-repository.ts`

### Supabase-Backed Flows

Implemented in the current Supabase repository:

- profile summary
- task template list
- create task template
- toggle task template active state
- generate today task instances from active templates
- submit task
- approve task
- reject task
- claim reward
- parent pending review list
- child stats, world progress, and character progress derived from Supabase data

## Tables Expected

The current code expects these tables to exist in Supabase:

- `profiles`
- `households`
- `household_members`
- `child_profiles`
- `task_templates`
- `daily_task_instances`
- `task_logs`
- `reward_logs`

Reference schema:

- `docs/supabase-schema.sql`

## Setup Requirement Before Full Cloud Use

Before switching real environments to `PIKABOOM_APP_MODE=supabase`, make sure:

1. Supabase schema has been applied.
2. At least one parent user exists in `auth.users`.
3. Matching `profiles` row exists for that parent.
4. A `households` row exists.
5. A `household_members` row links the parent to the household.
6. At least one `child_profiles` row exists in that household.

Without these records, the app will authenticate correctly but intentionally stay on local data fallback.

## Recommended Next Steps

1. Add a bootstrap SQL seed for one demo household and one child.
2. Add onboarding screens to create household and child records after first sign-in.
3. Add RLS policies for all household-scoped tables.
4. Add integration checks for local mode and Supabase mode.
5. Move remaining legacy helper files out of the active path once migration is complete.
