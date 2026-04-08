-- PikaBoom optional bootstrap SQL
-- Use this after the setup page has created a parent household and the first child profile.
-- Replace the placeholders below with real UUID values from your Supabase project.

-- Example placeholders:
-- <HOUSEHOLD_ID>
-- <PARENT_PROFILE_ID>
-- <CHILD_PROFILE_ID>

insert into public.task_templates (
  household_id,
  parent_profile_id,
  title,
  category,
  icon_key,
  measurement_type,
  target_value,
  unit,
  repeat_type,
  reward_exp,
  reward_energy_type,
  reward_energy_value,
  reward_currency,
  requires_parent_approval,
  is_active
)
values
  ('<HOUSEHOLD_ID>', '<PARENT_PROFILE_ID>', '閱讀故事書', '閱讀', '📚', '時間', 15, '分鐘', '每日', 12, '智慧能量', 10, 0, false, true),
  ('<HOUSEHOLD_ID>', '<PARENT_PROFILE_ID>', '鋼琴練習', '才藝', '🎹', '時間', 20, '分鐘', '每週三次', 16, '音樂能量', 12, 0, true, true),
  ('<HOUSEHOLD_ID>', '<PARENT_PROFILE_ID>', '整理書包', '生活習慣', '🎒', '一次', 1, '次', '每日', 8, '愛心能量', 6, 0, false, true)
on conflict do nothing;

insert into public.worlds (id, name, theme)
values
  ('11111111-1111-1111-1111-111111111111', '成長島', '溫暖、明亮、療癒的冒險起點')
on conflict (id) do nothing;

insert into public.world_areas (world_id, chapter_no, name, unlock_condition_type, unlock_condition_value, asset_key)
values
  ('11111111-1111-1111-1111-111111111111', 1, '新手草原', 'claimed_tasks', '{"target":4}', 'meadow'),
  ('11111111-1111-1111-1111-111111111111', 2, '知識森林', 'claimed_tasks', '{"target":10}', 'forest'),
  ('11111111-1111-1111-1111-111111111111', 3, '音樂山谷', 'claimed_tasks', '{"target":18}', 'valley')
on conflict do nothing;

insert into public.child_world_progress (
  child_profile_id,
  world_area_id,
  progress_value,
  unlocked_flag,
  completed_flag
)
select
  '<CHILD_PROFILE_ID>',
  wa.id,
  0,
  case when wa.chapter_no = 1 then true else false end,
  false
from public.world_areas wa
where wa.world_id = '11111111-1111-1111-1111-111111111111'
on conflict (child_profile_id, world_area_id) do nothing;
