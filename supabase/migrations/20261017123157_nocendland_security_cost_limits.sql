-- Endurecimiento del sistema «Seguridad, coste y cumplimiento» (docs/README.md).
-- Nocendland queda abierta a cualquier cuenta del Auth compartido, así que cada
-- usuario tiene topes de tamaño y cantidad para no agotar el plan gratuito que
-- comparten gift-card, Outify y Nocendland. Solo toca objetos de Nocendland.
begin;

-- 1. Bucket versionado con límite de tamaño y tipos admitidos. Las imágenes se
--    comprimen en el cliente; el recortador de ejercicios produce WebP.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('nocendland', 'nocendland', false, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Subidas solo a las carpetas de la app y con cuota de 200 objetos por usuario.
--    Las instantáneas de training_share las escribe la Edge Function con service_role.
--    El recuento vive en una función para que la política no se consulte a sí misma;
--    solo cuenta los objetos del usuario que la invoca.
create function nocendland.storage_object_count()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)
  from storage.objects objects
  where objects.bucket_id = 'nocendland'
    and (storage.foldername(objects.name))[2] = (select auth.uid())::text
$$;

revoke all on function nocendland.storage_object_count() from public, anon, authenticated;
grant execute on function nocendland.storage_object_count() to authenticated;

drop policy if exists nocendland_insert_own_objects on storage.objects;
create policy nocendland_insert_own_objects
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'nocendland'
    and (storage.foldername(name))[1] in ('nutrition_ingredient', 'training_exercise')
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and (select nocendland.storage_object_count()) < 200
  );

drop policy if exists nocendland_update_own_objects on storage.objects;
create policy nocendland_update_own_objects
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'nocendland'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'nocendland'
    and (storage.foldername(name))[1] in ('nutrition_ingredient', 'training_exercise')
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

-- 3. Email y avatar del perfil salen de Auth, no de lo que envíe el cliente.
create function nocendland_private.sync_user_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  identity record;
begin
  select users.email, users.raw_user_meta_data
  into identity
  from auth.users users
  where users.id = new.id;

  if identity.email is null then
    raise exception 'user_identity_not_found' using errcode = '42501';
  end if;

  new.email := identity.email;
  new.avatar_url := coalesce(
    nullif(identity.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(identity.raw_user_meta_data ->> 'picture', ''),
    ''
  );
  return new;
end;
$$;

revoke all on function nocendland_private.sync_user_identity() from public, anon, authenticated;

create trigger user_sync_identity
before insert or update on nocendland."user"
for each row execute function nocendland_private.sync_user_identity();

-- 4. Tope de filas por usuario en las tablas que crecen. El recuento se hace con
--    privilegios del propietario para no depender de lo que RLS deje ver.
create function nocendland_private.enforce_owner_row_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_limit integer := tg_argv[0]::integer;
  owner_column text := tg_argv[1];
  owner_id uuid := (to_jsonb(new) ->> owner_column)::uuid;
  current_rows bigint;
begin
  execute format(
    'select count(*) from %I.%I where %I = $1',
    tg_table_schema, tg_table_name, owner_column
  ) into current_rows using owner_id;

  if current_rows >= row_limit then
    raise exception 'row_limit_exceeded'
      using errcode = 'P0001', detail = format('%s admite %s filas por usuario', tg_table_name, row_limit);
  end if;
  return new;
end;
$$;

revoke all on function nocendland_private.enforce_owner_row_limit() from public, anon, authenticated;

create trigger nutrition_ingredient_row_limit before insert on nocendland.nutrition_ingredient
for each row execute function nocendland_private.enforce_owner_row_limit('2000', 'id_user');
create trigger nutrition_intake_row_limit before insert on nocendland.nutrition_intake
for each row execute function nocendland_private.enforce_owner_row_limit('50000', 'id_user');
create trigger training_exercise_row_limit before insert on nocendland.training_exercise
for each row execute function nocendland_private.enforce_owner_row_limit('500', 'id_user');
create trigger training_schedule_row_limit before insert on nocendland.training_schedule
for each row execute function nocendland_private.enforce_owner_row_limit('50', 'id_user');
create trigger training_schedule_item_row_limit before insert on nocendland.training_schedule_item
for each row execute function nocendland_private.enforce_owner_row_limit('2000', 'id_user');
create trigger training_entry_row_limit before insert on nocendland.training_entry
for each row execute function nocendland_private.enforce_owner_row_limit('50000', 'id_user');
create trigger training_set_row_limit before insert on nocendland.training_set
for each row execute function nocendland_private.enforce_owner_row_limit('50000', 'id_user');
create trigger finance_category_row_limit before insert on nocendland.finance_category
for each row execute function nocendland_private.enforce_owner_row_limit('200', 'id_user');
create trigger finance_period_row_limit before insert on nocendland.finance_period
for each row execute function nocendland_private.enforce_owner_row_limit('1000', 'id_user');
create trigger finance_goal_row_limit before insert on nocendland.finance_goal
for each row execute function nocendland_private.enforce_owner_row_limit('200', 'id_user');
create trigger finance_recurring_item_row_limit before insert on nocendland.finance_recurring_item
for each row execute function nocendland_private.enforce_owner_row_limit('500', 'id_user');
create trigger finance_budget_allocation_row_limit before insert on nocendland.finance_budget_allocation
for each row execute function nocendland_private.enforce_owner_row_limit('20000', 'id_user');
create trigger finance_movement_row_limit before insert on nocendland.finance_movement
for each row execute function nocendland_private.enforce_owner_row_limit('20000', 'id_user');

-- Enlaces de compartir: como mucho 20 activos por usuario (sin caducidad).
create function nocendland_private.enforce_active_share_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*) from nocendland.training_share share
    where share.owner_id = new.owner_id and share.revoked_at is null
  ) >= 20 then
    raise exception 'share_limit_reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function nocendland_private.enforce_active_share_limit() from public, anon, authenticated;

create trigger training_share_active_limit before insert on nocendland.training_share
for each row execute function nocendland_private.enforce_active_share_limit();

-- 5. Longitud máxima de los textos libres.
alter table nocendland."user"
  add constraint user_user_name_length check (char_length(user_name) <= 200),
  add constraint user_avatar_url_length check (char_length(avatar_url) <= 2048);
alter table nocendland.nutrition_ingredient
  add constraint nutrition_ingredient_name_length check (char_length(name) <= 200),
  add constraint nutrition_ingredient_description_length check (char_length(description) <= 2000),
  add constraint nutrition_ingredient_image_route_length check (char_length(image_route) <= 500);
alter table nocendland.training_exercise
  add constraint training_exercise_name_length check (char_length(name) <= 200),
  add constraint training_exercise_description_length check (char_length(description) <= 4000),
  add constraint training_exercise_tips_size check (
    cardinality(tips) <= 50 and char_length(array_to_string(tips, '')) <= 10000
  ),
  add constraint training_exercise_image_path_length check (char_length(image_path) <= 500),
  add constraint training_exercise_video_url_length check (char_length(video_url) <= 2048);
alter table nocendland.training_share
  add constraint training_share_title_length check (char_length(title) <= 200),
  add constraint training_share_manifest_size check (char_length(manifest::text) <= 1000000);
alter table nocendland.training_schedule
  add constraint training_schedule_name_length check (char_length(name) <= 200);
alter table nocendland.finance_category
  add constraint finance_category_name_length check (char_length(name) <= 200);
alter table nocendland.finance_goal
  add constraint finance_goal_name_length check (char_length(name) <= 200),
  add constraint finance_goal_notes_length check (char_length(notes) <= 2000);
alter table nocendland.finance_recurring_item
  add constraint finance_recurring_item_name_length check (char_length(name) <= 200),
  add constraint finance_recurring_item_notes_length check (char_length(notes) <= 2000);
alter table nocendland.finance_budget_allocation
  add constraint finance_budget_allocation_notes_length check (char_length(notes) <= 2000);
alter table nocendland.finance_movement
  add constraint finance_movement_name_length check (char_length(name) <= 200),
  add constraint finance_movement_notes_length check (char_length(notes) <= 2000);

-- 6. Límite de previsualizaciones anónimas por enlace: 60 por hora. Solo la
--    Edge Function (service_role) registra visitas; anon no ejecuta nada.
create table nocendland_private.training_share_preview_window (
  share_id uuid not null references nocendland.training_share(id) on delete cascade,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (share_id, window_start)
);

alter table nocendland_private.training_share_preview_window enable row level security;
revoke all on nocendland_private.training_share_preview_window from public, anon, authenticated, service_role;

-- Devuelve 'allowed', 'rate_limited' o 'not_found'.
create function nocendland.register_training_share_preview(share_token_hash text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_share_id uuid;
  current_window timestamptz := date_trunc('hour', now());
  window_hits integer;
begin
  select share.id into target_share_id
  from nocendland.training_share share
  where share.token_hash = share_token_hash and share.revoked_at is null;

  if target_share_id is null then
    return 'not_found';
  end if;

  delete from nocendland_private.training_share_preview_window preview_window
  where preview_window.share_id = target_share_id
    and preview_window.window_start < current_window;

  insert into nocendland_private.training_share_preview_window as preview_window (share_id, window_start, hits)
  values (target_share_id, current_window, 1)
  on conflict (share_id, window_start)
  do update set hits = preview_window.hits + 1
  returning preview_window.hits into window_hits;

  return case when window_hits <= 60 then 'allowed' else 'rate_limited' end;
end;
$$;

revoke all on function nocendland.register_training_share_preview(text) from public, anon, authenticated;
grant execute on function nocendland.register_training_share_preview(text) to service_role;

commit;
