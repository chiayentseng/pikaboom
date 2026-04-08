-- PikaBoom production schema for Vercel + Supabase
-- This file is intended as the reference starting point for future migrations.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('parent', 'child')),
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_profile_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null check (member_role in ('parent', 'child')),
  created_at timestamptz not null default now(),
  unique (household_id, profile_id)
);

create table public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  level integer not null default 1,
  exp integer not null default 0,
  streak_days integer not null default 0,
  star_currency integer not null default 0,
  current_world_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_templates (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  parent_profile_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  category text not null,
  icon_key text not null,
  description text,
  measurement_type text not null,
  target_value numeric not null,
  unit text not null,
  repeat_type text not null,
  repeat_days_json jsonb,
  reward_exp integer not null,
  reward_energy_type text not null,
  reward_energy_value integer not null,
  reward_currency integer not null default 0,
  requires_parent_approval boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_task_instances (
  id uuid primary key default gen_random_uuid(),
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  task_template_id uuid not null references public.task_templates(id) on delete restrict,
  task_date date not null,
  title_snapshot text not null,
  category_snapshot text not null,
  target_value_snapshot numeric not null,
  unit_snapshot text not null,
  reward_exp_snapshot integer not null,
  reward_energy_type_snapshot text not null,
  reward_energy_value_snapshot integer not null,
  requires_parent_approval_snapshot boolean not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_profile_id, task_template_id, task_date)
);

create table public.task_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  daily_task_instance_id uuid not null references public.daily_task_instances(id) on delete cascade,
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  started_at timestamptz,
  ended_at timestamptz,
  progress_value numeric not null default 0,
  status text not null,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by_profile_id uuid references public.profiles(id),
  rejection_reason text,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reward_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  reward_type text not null,
  reward_subtype text,
  amount integer not null,
  metadata_json jsonb,
  created_at timestamptz not null default now()
);

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  element_type text not null,
  rarity text not null,
  evolution_stage integer not null,
  growth_rule_json jsonb not null,
  unlock_rule_json jsonb not null,
  asset_key text not null,
  created_at timestamptz not null default now()
);

create table public.child_characters (
  id uuid primary key default gen_random_uuid(),
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  level integer not null default 1,
  growth_value integer not null default 0,
  is_main boolean not null default false,
  obtained_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_profile_id, character_id)
);

create table public.worlds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  theme text not null,
  created_at timestamptz not null default now()
);

create table public.world_areas (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  chapter_no integer not null,
  name text not null,
  unlock_condition_type text not null,
  unlock_condition_value jsonb not null,
  asset_key text not null,
  created_at timestamptz not null default now()
);

create table public.child_world_progress (
  id uuid primary key default gen_random_uuid(),
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  world_area_id uuid not null references public.world_areas(id) on delete cascade,
  progress_value integer not null default 0,
  unlocked_flag boolean not null default false,
  completed_flag boolean not null default false,
  unlocked_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (child_profile_id, world_area_id)
);
