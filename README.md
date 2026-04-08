# PikaBoom

PikaBoom is a web game for families that turns real-world effort into visible progress, character growth, and world-building.

Instead of behaving like a plain checklist, it aims to help a child feel:

> I am getting stronger, unlocking things, and growing my adventure world.

## What It Does

- gives children a playful mission flow for daily tasks
- lets parents create, review, and manage those tasks
- records progress in a real database-backed flow
- converts completed tasks into EXP, streaks, stars, and unlock progress
- builds toward a parent-child gameplay loop instead of a plain habit tracker

## Current MVP

### Child Side

- adventure home
- today tasks
- character growth
- map progress
- collection page
- achievements page

### Parent Side

- dashboard
- task management
- task approval
- reports view
- first-run cloud setup page

### Core System

- Next.js App Router frontend
- SQLite local persistence for development fallback
- Supabase Auth + repository migration path for production architecture
- server actions for submit / approve / reject / claim flows
- seeded single-family local data model

## Screenshots

### Home

![PikaBoom home](./public/screenshots/home.png)

### Child tasks

![PikaBoom child tasks](./public/screenshots/child-tasks.png)

### Parent task management

![PikaBoom parent tasks](./public/screenshots/parent-tasks.png)

## Tech Stack

- Next.js 16
- React 19
- Tailwind CSS
- TypeScript
- SQLite
- Supabase client libraries

## Local Development

```bash
npm install
npm run dev
```

Then open:

- `http://127.0.0.1:3000`
- `http://127.0.0.1:3000/child`
- `http://127.0.0.1:3000/parent`
- `http://127.0.0.1:3000/login`
- `http://127.0.0.1:3000/setup`

## Environment Variables

Copy `.env.example` to `.env.local` and fill values when moving toward cloud mode.

Current behavior:

- `PIKABOOM_APP_MODE=local`: local session + SQLite flow
- `PIKABOOM_APP_MODE=supabase`: Supabase auth/session enabled and game data will use Supabase when household/profile records are ready
- `SUPABASE_SERVICE_ROLE_KEY`: required for first-run cloud setup because the current schema still needs a managed child identity

## Build Check

```bash
npm run build
```

## Data Storage

- Local database: `data/pikaboom.db`
- Managed cloud target: Supabase Postgres
- Current migration strategy: hybrid runtime fallback while cloud setup is incomplete

## Roadmap

1. Full RLS policies and production data isolation
2. Post-signup onboarding polish and setup automation
3. Photo proof for tasks
4. Weekly challenges and achievement events
5. Richer reward animations and progression feedback

## Architecture Docs

- [Docs index](./docs/README.md)
- [Architecture decision](./docs/architecture-decision.md)
- [Application blueprint](./docs/application-blueprint.md)
- [Auth and access plan](./docs/auth-and-access-plan.md)
- [Supabase schema SQL](./docs/supabase-schema.sql)
- [Supabase bootstrap SQL](./docs/supabase-bootstrap.sql)
- [Supabase migration status](./docs/supabase-migration-status.md)
