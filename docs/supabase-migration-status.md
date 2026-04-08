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
  - routes incomplete cloud accounts into `/setup`
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
- expose onboarding state flags so protected areas can redirect into setup

Files:

- `lib/auth/session.ts`
- `app/auth-actions.ts`
- `app/setup/page.tsx`
- `app/setup-actions.ts`

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

### First-Time Cloud Onboarding

Implemented:

- setup page for the first parent account
- create / upsert parent profile row
- create household and parent membership
- create a managed child identity for MVP compatibility with the current schema
- create child profile and optional starter task templates

Important note:

- the current schema still requires `child_profiles.profile_id -> profiles.id -> auth.users.id`
- because of that, onboarding currently creates a hidden managed auth identity for the child
- this works for MVP, but can be simplified later by decoupling child profiles from auth users

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
- `docs/supabase-bootstrap.sql`

## Setup Requirement Before Full Cloud Use

Before switching real environments to `PIKABOOM_APP_MODE=supabase`, make sure:

1. Supabase schema has been applied.
2. A parent user can sign in through Supabase Auth.
3. `SUPABASE_SERVICE_ROLE_KEY` is available server-side so setup can create the first household and child profile.
4. The first signed-in parent completes `/setup` once.

After that, the parent console and child mode can stay on Supabase-backed data.

## Recommended Next Steps

1. Add RLS policies for all household-scoped tables.
2. Add a post-signup onboarding check so setup opens automatically after auth callback.
3. Decide whether child profiles should remain managed auth identities or become standalone domain records.
4. Add integration checks for local mode and Supabase mode.
5. Move remaining legacy helper files out of the active path once migration is complete.
