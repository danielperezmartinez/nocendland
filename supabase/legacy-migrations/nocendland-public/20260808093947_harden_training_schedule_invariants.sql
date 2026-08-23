-- Refuerza invariantes e índices detectados por los advisors tras crear el catálogo.
create index training_schedule_source_share_fk_idx
  on public.training_schedule (source_share_id)
  where source_share_id is not null;

create index training_schedule_item_schedule_owner_idx
  on public.training_schedule_item (schedule_id, id_user);

create index training_share_owner_idx
  on public.training_share (owner_id);

create or replace function public.enforce_training_active_schedule()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  affected_user_id uuid := coalesce(new.id_user, old.id_user);
begin
  -- Durante el borrado en cascada de un usuario ya no hay un catálogo que proteger.
  if not exists (select 1 from public.user where id = affected_user_id) then
    return null;
  end if;

  if exists (select 1 from public.training_schedule where id_user = affected_user_id)
    and not exists (
      select 1
      from public.training_schedule
      where id_user = affected_user_id and is_active
    ) then
    raise exception 'active_schedule_required';
  end if;

  return null;
end;
$$;

create constraint trigger training_schedule_requires_active
after insert or update or delete on public.training_schedule
deferrable initially deferred
for each row execute function public.enforce_training_active_schedule();

revoke all on function public.enforce_training_active_schedule() from public, anon, authenticated;
