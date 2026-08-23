-- Guarda el catálogo completo como una única operación cancelable desde la interfaz.
create or replace function public.save_training_schedule_catalog(
  catalog_draft jsonb,
  selected_key text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  draft_item jsonb;
  created_schedule_id bigint;
  active_schedule_id bigint;
  selected_schedule_id bigint;
  schedule_ids jsonb := '{}'::jsonb;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if jsonb_typeof(catalog_draft) <> 'array' or jsonb_array_length(catalog_draft) = 0 then
    raise exception 'invalid_training_schedule_catalog';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(catalog_draft) item
    where nullif(btrim(item ->> 'key'), '') is null
      or (not coalesce((item ->> 'deleted')::boolean, false)
        and nullif(btrim(item ->> 'name'), '') is null)
      or ((item ->> 'id') is null and coalesce((item ->> 'deleted')::boolean, false))
      or ((item ->> 'id') is not null and (item ->> 'duplicateFromId') is not null)
  ) then
    raise exception 'invalid_training_schedule_catalog';
  end if;

  if (
    select count(*)
    from jsonb_array_elements(catalog_draft) item
    where not coalesce((item ->> 'deleted')::boolean, false)
  ) = 0 then
    raise exception 'training_schedule_required';
  end if;

  if (
    select count(*)
    from jsonb_array_elements(catalog_draft) item
    where not coalesce((item ->> 'deleted')::boolean, false)
      and coalesce((item ->> 'isActive')::boolean, false)
  ) <> 1 then
    raise exception 'single_active_training_schedule_required';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(catalog_draft) item
    group by item ->> 'key'
    having count(*) > 1
  ) or exists (
    select 1
    from jsonb_array_elements(catalog_draft) item
    where not coalesce((item ->> 'deleted')::boolean, false)
    group by lower(btrim(item ->> 'name'))
    having count(*) > 1
  ) then
    raise exception 'duplicate_training_schedule_catalog_value';
  end if;

  if not exists (
    select 1
    from jsonb_array_elements(catalog_draft) item
    where item ->> 'key' = selected_key
      and not coalesce((item ->> 'deleted')::boolean, false)
  ) then
    raise exception 'invalid_selected_training_schedule';
  end if;

  -- El conjunto completo y updated_at funcionan como control de concurrencia optimista.
  if exists (
    select 1
    from public.training_schedule schedule
    where schedule.id_user = current_user_id
      and not exists (
        select 1 from jsonb_array_elements(catalog_draft) item
        where (item ->> 'id')::bigint = schedule.id
      )
  ) or exists (
    select 1
    from jsonb_array_elements(catalog_draft) item
    left join public.training_schedule schedule
      on schedule.id = (item ->> 'id')::bigint
      and schedule.id_user = current_user_id
    where (item ->> 'id') is not null
      and (schedule.id is null
        or (item ->> 'updatedAt') is null
        or schedule.updated_at <> (item ->> 'updatedAt')::timestamptz)
  ) then
    raise exception 'stale_training_schedule_catalog';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(catalog_draft) item
    left join public.training_schedule schedule
      on schedule.id = (item ->> 'duplicateFromId')::bigint
      and schedule.id_user = current_user_id
    where (item ->> 'duplicateFromId') is not null and schedule.id is null
  ) then
    raise exception 'invalid_training_schedule_duplicate';
  end if;

  -- Los nombres temporales permiten intercambiar nombres sin violar el índice único.
  update public.training_schedule
  set name = '__catalog_' || gen_random_uuid()::text,
      is_active = false,
      updated_at = now()
  where id_user = current_user_id;

  for draft_item in select value from jsonb_array_elements(catalog_draft)
  loop
    if not coalesce((draft_item ->> 'deleted')::boolean, false)
      and (draft_item ->> 'id') is not null then
      update public.training_schedule
      set name = btrim(draft_item ->> 'name'), updated_at = now()
      where id = (draft_item ->> 'id')::bigint and id_user = current_user_id;

      schedule_ids := schedule_ids || jsonb_build_object(
        draft_item ->> 'key',
        (draft_item ->> 'id')::bigint
      );
    end if;
  end loop;

  for draft_item in select value from jsonb_array_elements(catalog_draft)
  loop
    if (draft_item ->> 'id') is null then
      insert into public.training_schedule (id_user, name, is_active)
      values (current_user_id, btrim(draft_item ->> 'name'), false)
      returning id into created_schedule_id;

      if (draft_item ->> 'duplicateFromId') is not null then
        insert into public.training_schedule_item (
          id_user, schedule_id, exercise_id, weekday, set_count,
          target_repetitions, target_weight_kg, sort_order
        )
        select
          current_user_id, created_schedule_id, exercise_id, weekday, set_count,
          target_repetitions, target_weight_kg, sort_order
        from public.training_schedule_item
        where id_user = current_user_id
          and schedule_id = (draft_item ->> 'duplicateFromId')::bigint;
      end if;

      schedule_ids := schedule_ids || jsonb_build_object(draft_item ->> 'key', created_schedule_id);
    end if;
  end loop;

  select (schedule_ids ->> (item ->> 'key'))::bigint into active_schedule_id
  from jsonb_array_elements(catalog_draft) item
  where not coalesce((item ->> 'deleted')::boolean, false)
    and coalesce((item ->> 'isActive')::boolean, false);

  update public.training_schedule
  set is_active = true, updated_at = now()
  where id = active_schedule_id and id_user = current_user_id;

  delete from public.training_schedule schedule
  using jsonb_array_elements(catalog_draft) item
  where coalesce((item ->> 'deleted')::boolean, false)
    and schedule.id = (item ->> 'id')::bigint
    and schedule.id_user = current_user_id;

  selected_schedule_id := (schedule_ids ->> selected_key)::bigint;
  return jsonb_build_object(
    'scheduleIds', schedule_ids,
    'selectedScheduleId', selected_schedule_id
  );
end;
$$;

revoke all on function public.save_training_schedule_catalog(jsonb, text) from public, anon;
grant execute on function public.save_training_schedule_catalog(jsonb, text) to authenticated;
