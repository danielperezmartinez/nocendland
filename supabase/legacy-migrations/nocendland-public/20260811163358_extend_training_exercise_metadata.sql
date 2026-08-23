begin;

alter table public.training_exercise
  add column video_url text,
  add column training_modalities text[] not null default '{}'::text[],
  add column muscle_groups text[] not null default '{}'::text[],
  add column movement_patterns text[] not null default '{}'::text[],
  add constraint training_exercise_video_url_check check (
    video_url is null or video_url ~* '^https://[^[:space:]]+$'
  ),
  add constraint training_exercise_modalities_check check (
    training_modalities <@ array[
      'strength', 'cardio', 'power_plyometrics', 'mobility', 'flexibility', 'balance_stability'
    ]::text[]
  ),
  add constraint training_exercise_muscle_groups_check check (
    muscle_groups <@ array[
      'full_body', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms_grip',
      'core_abs', 'glutes_hips', 'quadriceps', 'hamstrings', 'calves'
    ]::text[]
  ),
  add constraint training_exercise_movement_patterns_check check (
    movement_patterns <@ array[
      'push', 'pull', 'squat', 'hip_hinge', 'lunge_unilateral', 'rotation',
      'anti_rotation_core_stability', 'loaded_carry', 'locomotion', 'jump', 'isolation'
    ]::text[]
  );

create or replace function public.import_training_share_manifest(
  shared_manifest jsonb,
  conflict_actions jsonb default '{}'::jsonb,
  activate_schedule boolean default false,
  source_share uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  shared_exercise jsonb;
  shared_day jsonb;
  shared_item jsonb;
  shared_portable_id uuid;
  local_exercise_id bigint;
  local_schedule_id bigint;
  local_schedule_name text;
  base_schedule_name text;
  name_suffix integer := 1;
  exercise_mapping jsonb := '{}'::jsonb;
  action text;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if shared_manifest ->> 'version' <> 'training-share/v1'
    or shared_manifest ->> 'type' not in ('exercises', 'schedule')
    or jsonb_typeof(shared_manifest -> 'exercises') <> 'array' then
    raise exception 'invalid_training_share_manifest';
  end if;

  perform public.ensure_training_schedule();

  for shared_exercise in
    select value from jsonb_array_elements(shared_manifest -> 'exercises')
  loop
    shared_portable_id := (shared_exercise ->> 'portableId')::uuid;
    action := coalesce(conflict_actions ->> shared_portable_id::text, 'keep');

    if action not in ('keep', 'update') then
      raise exception 'invalid_conflict_action';
    end if;

    select id into local_exercise_id
    from public.training_exercise
    where id_user = current_user_id and portable_id = shared_portable_id;

    if local_exercise_id is null then
      insert into public.training_exercise (
        id_user,
        portable_id,
        name,
        description,
        tips,
        image_path,
        video_url,
        training_modalities,
        muscle_groups,
        movement_patterns
      ) values (
        current_user_id,
        shared_portable_id,
        btrim(shared_exercise ->> 'name'),
        nullif(btrim(coalesce(shared_exercise ->> 'description', '')), ''),
        coalesce(array(select jsonb_array_elements_text(shared_exercise -> 'tips')), '{}'::text[]),
        null,
        nullif(btrim(coalesce(shared_exercise ->> 'videoUrl', '')), ''),
        coalesce(array(select jsonb_array_elements_text(coalesce(shared_exercise -> 'trainingModalities', '[]'::jsonb))), '{}'::text[]),
        coalesce(array(select jsonb_array_elements_text(coalesce(shared_exercise -> 'muscleGroups', '[]'::jsonb))), '{}'::text[]),
        coalesce(array(select jsonb_array_elements_text(coalesce(shared_exercise -> 'movementPatterns', '[]'::jsonb))), '{}'::text[])
      ) returning id into local_exercise_id;
    elsif action = 'update' then
      update public.training_exercise
      set name = btrim(shared_exercise ->> 'name'),
          description = nullif(btrim(coalesce(shared_exercise ->> 'description', '')), ''),
          tips = coalesce(array(select jsonb_array_elements_text(shared_exercise -> 'tips')), '{}'::text[]),
          video_url = nullif(btrim(coalesce(shared_exercise ->> 'videoUrl', '')), ''),
          training_modalities = coalesce(array(select jsonb_array_elements_text(coalesce(shared_exercise -> 'trainingModalities', '[]'::jsonb))), '{}'::text[]),
          muscle_groups = coalesce(array(select jsonb_array_elements_text(coalesce(shared_exercise -> 'muscleGroups', '[]'::jsonb))), '{}'::text[]),
          movement_patterns = coalesce(array(select jsonb_array_elements_text(coalesce(shared_exercise -> 'movementPatterns', '[]'::jsonb))), '{}'::text[]),
          archived_at = null,
          updated_at = now()
      where id = local_exercise_id and id_user = current_user_id;
    end if;

    exercise_mapping := exercise_mapping || jsonb_build_object(shared_portable_id::text, local_exercise_id);
  end loop;

  if shared_manifest ->> 'type' = 'schedule' then
    if jsonb_typeof(shared_manifest -> 'schedule') <> 'object'
      or jsonb_typeof(shared_manifest -> 'schedule' -> 'days') <> 'array' then
      raise exception 'invalid_training_schedule_manifest';
    end if;

    shared_portable_id := (shared_manifest -> 'schedule' ->> 'portableId')::uuid;
    if exists (
      select 1 from public.training_schedule
      where id_user = current_user_id and portable_id = shared_portable_id
    ) then
      raise exception 'schedule_already_imported';
    end if;

    base_schedule_name := btrim(shared_manifest -> 'schedule' ->> 'name');
    local_schedule_name := base_schedule_name;
    while exists (
      select 1 from public.training_schedule
      where id_user = current_user_id and lower(btrim(name)) = lower(local_schedule_name)
    ) loop
      name_suffix := name_suffix + 1;
      local_schedule_name := base_schedule_name || ' (' || name_suffix || ')';
    end loop;

    if activate_schedule then
      update public.training_schedule
      set is_active = false, updated_at = now()
      where id_user = current_user_id and is_active;
    end if;

    insert into public.training_schedule (
      id_user,
      portable_id,
      name,
      is_active,
      source_share_id
    ) values (
      current_user_id,
      shared_portable_id,
      local_schedule_name,
      activate_schedule,
      source_share
    ) returning id into local_schedule_id;

    for shared_day in
      select value from jsonb_array_elements(shared_manifest -> 'schedule' -> 'days')
    loop
      if (shared_day ->> 'weekday')::integer not between 1 and 7
        or jsonb_typeof(shared_day -> 'items') <> 'array' then
        raise exception 'invalid_training_schedule_day';
      end if;

      for shared_item in
        select value from jsonb_array_elements(shared_day -> 'items')
      loop
        local_exercise_id := (exercise_mapping ->> (shared_item ->> 'exercisePortableId'))::bigint;
        if local_exercise_id is null then
          raise exception 'missing_training_schedule_exercise';
        end if;

        insert into public.training_schedule_item (
          id_user,
          schedule_id,
          exercise_id,
          weekday,
          set_count,
          target_repetitions,
          target_weight_kg,
          sort_order
        ) values (
          current_user_id,
          local_schedule_id,
          local_exercise_id,
          (shared_day ->> 'weekday')::smallint,
          (shared_item ->> 'setCount')::smallint,
          nullif(shared_item ->> 'targetRepetitions', '')::smallint,
          nullif(shared_item ->> 'targetWeightKg', '')::numeric,
          (shared_item ->> 'sortOrder')::integer
        );
      end loop;
    end loop;
  end if;

  return jsonb_build_object(
    'exerciseIds', exercise_mapping,
    'scheduleId', local_schedule_id,
    'scheduleName', local_schedule_name
  );
end;
$$;

revoke all on function public.import_training_share_manifest(jsonb, jsonb, boolean, uuid) from public, anon;
grant execute on function public.import_training_share_manifest(jsonb, jsonb, boolean, uuid) to authenticated;

commit;
