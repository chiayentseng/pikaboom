create schema if not exists private;

create or replace function private.is_current_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select auth.uid()) is not null
    and (select auth.uid()) = target_profile_id;
$$;

create or replace function private.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.profile_id = (select auth.uid())
  );
$$;

create or replace function private.is_household_parent(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.profile_id = (select auth.uid())
      and hm.member_role = 'parent'
  );
$$;

create or replace function private.shares_household_with_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members me
    join public.household_members target
      on target.household_id = me.household_id
    where me.profile_id = (select auth.uid())
      and target.profile_id = target_profile_id
  );
$$;

grant usage on schema private to postgres, service_role;
grant execute on function private.is_current_profile(uuid) to authenticated, service_role;
grant execute on function private.is_household_member(uuid) to authenticated, service_role;
grant execute on function private.is_household_parent(uuid) to authenticated, service_role;
grant execute on function private.shares_household_with_profile(uuid) to authenticated, service_role;

create index if not exists idx_household_members_profile_id on public.household_members (profile_id);
create index if not exists idx_child_profiles_household_id on public.child_profiles (household_id);
create index if not exists idx_task_templates_household_id on public.task_templates (household_id);
create index if not exists idx_daily_task_instances_household_id on public.daily_task_instances (household_id);
create index if not exists idx_task_logs_household_id on public.task_logs (household_id);
create index if not exists idx_reward_logs_household_id on public.reward_logs (household_id);
create index if not exists idx_child_characters_child_profile_id on public.child_characters (child_profile_id);
create index if not exists idx_child_world_progress_child_profile_id on public.child_world_progress (child_profile_id);

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.child_profiles enable row level security;
alter table public.task_templates enable row level security;
alter table public.daily_task_instances enable row level security;
alter table public.task_logs enable row level security;
alter table public.reward_logs enable row level security;
alter table public.characters enable row level security;
alter table public.child_characters enable row level security;
alter table public.worlds enable row level security;
alter table public.world_areas enable row level security;
alter table public.child_world_progress enable row level security;

create policy "profiles_select_same_household"
on public.profiles
for select
to authenticated
using (
  private.is_current_profile(id)
  or private.shares_household_with_profile(id)
);

create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (private.is_current_profile(id));

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (private.is_current_profile(id))
with check (private.is_current_profile(id));

create policy "households_select_member"
on public.households
for select
to authenticated
using (private.is_household_member(id));

create policy "households_insert_owner"
on public.households
for insert
to authenticated
with check (private.is_current_profile(owner_profile_id));

create policy "households_update_parent"
on public.households
for update
to authenticated
using (private.is_household_parent(id))
with check (private.is_household_parent(id));

create policy "household_members_select_member"
on public.household_members
for select
to authenticated
using (private.is_household_member(household_id));

create policy "household_members_insert_parent"
on public.household_members
for insert
to authenticated
with check (private.is_household_parent(household_id));

create policy "household_members_update_parent"
on public.household_members
for update
to authenticated
using (private.is_household_parent(household_id))
with check (private.is_household_parent(household_id));

create policy "household_members_delete_parent"
on public.household_members
for delete
to authenticated
using (private.is_household_parent(household_id));

create policy "child_profiles_select_member"
on public.child_profiles
for select
to authenticated
using (private.is_household_member(household_id));

create policy "child_profiles_insert_parent"
on public.child_profiles
for insert
to authenticated
with check (private.is_household_parent(household_id));

create policy "child_profiles_update_member"
on public.child_profiles
for update
to authenticated
using (private.is_household_member(household_id))
with check (private.is_household_member(household_id));

create policy "task_templates_select_member"
on public.task_templates
for select
to authenticated
using (private.is_household_member(household_id));

create policy "task_templates_insert_parent"
on public.task_templates
for insert
to authenticated
with check (
  private.is_household_parent(household_id)
  and private.is_current_profile(parent_profile_id)
);

create policy "task_templates_update_parent"
on public.task_templates
for update
to authenticated
using (private.is_household_parent(household_id))
with check (
  private.is_household_parent(household_id)
  and private.is_current_profile(parent_profile_id)
);

create policy "task_templates_delete_parent"
on public.task_templates
for delete
to authenticated
using (private.is_household_parent(household_id));

create policy "daily_task_instances_select_member"
on public.daily_task_instances
for select
to authenticated
using (private.is_household_member(household_id));

create policy "daily_task_instances_insert_member"
on public.daily_task_instances
for insert
to authenticated
with check (private.is_household_member(household_id));

create policy "daily_task_instances_update_member"
on public.daily_task_instances
for update
to authenticated
using (private.is_household_member(household_id))
with check (private.is_household_member(household_id));

create policy "daily_task_instances_delete_parent"
on public.daily_task_instances
for delete
to authenticated
using (private.is_household_parent(household_id));

create policy "task_logs_select_member"
on public.task_logs
for select
to authenticated
using (private.is_household_member(household_id));

create policy "task_logs_insert_member"
on public.task_logs
for insert
to authenticated
with check (private.is_household_member(household_id));

create policy "task_logs_update_member"
on public.task_logs
for update
to authenticated
using (private.is_household_member(household_id))
with check (private.is_household_member(household_id));

create policy "task_logs_delete_parent"
on public.task_logs
for delete
to authenticated
using (private.is_household_parent(household_id));

create policy "reward_logs_select_member"
on public.reward_logs
for select
to authenticated
using (private.is_household_member(household_id));

create policy "reward_logs_insert_member"
on public.reward_logs
for insert
to authenticated
with check (private.is_household_member(household_id));

create policy "characters_select_authenticated"
on public.characters
for select
to authenticated
using (true);

create policy "child_characters_select_member"
on public.child_characters
for select
to authenticated
using (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = child_profile_id
      and private.is_household_member(cp.household_id)
  )
);

create policy "child_characters_insert_member"
on public.child_characters
for insert
to authenticated
with check (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = child_profile_id
      and private.is_household_member(cp.household_id)
  )
);

create policy "child_characters_update_member"
on public.child_characters
for update
to authenticated
using (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = child_profile_id
      and private.is_household_member(cp.household_id)
  )
)
with check (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = child_profile_id
      and private.is_household_member(cp.household_id)
  )
);

create policy "worlds_select_authenticated"
on public.worlds
for select
to authenticated
using (true);

create policy "world_areas_select_authenticated"
on public.world_areas
for select
to authenticated
using (true);

create policy "child_world_progress_select_member"
on public.child_world_progress
for select
to authenticated
using (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = child_profile_id
      and private.is_household_member(cp.household_id)
  )
);

create policy "child_world_progress_insert_member"
on public.child_world_progress
for insert
to authenticated
with check (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = child_profile_id
      and private.is_household_member(cp.household_id)
  )
);

create policy "child_world_progress_update_member"
on public.child_world_progress
for update
to authenticated
using (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = child_profile_id
      and private.is_household_member(cp.household_id)
  )
)
with check (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = child_profile_id
      and private.is_household_member(cp.household_id)
  )
);
