# Architecture Decision

## Decision Summary

The recommended production architecture for PikaBoom is:

- Frontend and app runtime: `Next.js App Router`
- Deployment platform: `Vercel`
- Database: `Supabase Postgres`
- Authentication: `Supabase Auth`
- File storage: `Supabase Storage`

This is the preferred option because it is the easiest to manage over time while still giving the project a strong long-term foundation.

## Why This Is The Best Managed Option

For this product, "easy to manage" means:

- minimal infrastructure decisions during early development
- strong compatibility with Next.js
- relational database support for complex product logic
- built-in authentication and storage without creating separate systems
- clear upgrade path from MVP to production

PikaBoom is not just a content site or a simple checklist app. It needs:

- parent and child roles
- task templates and daily task instances
- approval workflows
- reward and settlement logic
- reports and progress statistics
- future support for uploads such as task proof photos

These requirements fit a relational data model much better than a document-first model.

## Why Not The Other Options

### Firebase

Firebase is strong for:

- quick auth setup
- real-time sync
- mobile-first projects

But PikaBoom needs relational workflows and reporting. Firestore can support this, but the data model becomes harder to maintain once the product includes:

- approvals
- historical task snapshots
- settlement logs
- parent reporting
- unlock conditions and progression rules

For this project, Postgres is easier to reason about than Firestore.

### Cloudflare + Supabase

This is technically valid, but it is not the easiest option to manage.

It adds more integration complexity because:

- Next.js support is strongest on Vercel
- deployment behavior is simpler to predict on Vercel
- server actions, previews, and App Router workflows are more straightforward there

If the team later has a strong Cloudflare-specific reason, this can be revisited. It is not the best default.

### Cloudflare + D1

This is attractive for cost and edge distribution, but it is not the best fit for the current phase.

The tradeoff is more platform-specific architecture earlier than necessary. For PikaBoom, that would create more complexity before product-market learning is complete.

## Recommended Responsibilities By Platform

### Vercel

Use Vercel for:

- hosting the Next.js app
- preview deployments
- environment variables
- App Router pages
- route handlers
- server actions

### Supabase

Use Supabase for:

- Postgres database
- authentication
- storage
- row-level security

## Core Engineering Principles

1. Product rules must execute on the server, not in the browser.
2. Task templates and daily task instances must remain separate.
3. Rewards, approvals, and progression must be recorded as durable events.
4. Parent and child access must be constrained by household ownership.
5. The codebase should support local development mode and cloud mode without changing product behavior.

## Deployment Shape

```text
Browser
  -> Vercel-hosted Next.js app
      -> Supabase Auth
      -> Supabase Postgres
      -> Supabase Storage
```

## Current Local MVP vs Target Production

### Current

- local Next.js app
- local SQLite file
- no real login
- single-family local mode

### Target

- deployed Next.js app on Vercel
- Supabase Postgres
- Supabase Auth for parent login
- child mode selected from authenticated parent session
- optional future child PIN mode

## Authentication Recommendation

For the first production version:

- parent: email + password using Supabase Auth
- child: no separate full auth account yet
- child access: parent switches into child mode after login

This keeps identity management much simpler and fits the product's real-world ownership model.

## Revisit Conditions

The architecture should be revisited only if one of these becomes true:

- the product needs a native-mobile-first sync model
- the team has a strong Cloudflare operational preference
- the app grows into multi-tenant or partner distribution needs beyond the current family model
