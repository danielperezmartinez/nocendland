-- El perfil contiene datos personales y solo puede consultarlo su propietario autenticado.
drop policy if exists select_user_info on public."user";
drop policy if exists user_select_own on public."user";

create policy user_select_own
  on public."user"
  for select
  to authenticated
  using ((select auth.uid()) = id);

revoke all privileges on table public."user" from anon, authenticated;
grant select on table public."user" to authenticated;

-- La política heredada pertenecía a public aunque dependía de auth.uid().
drop policy if exists nutrition_objective_all on public.nutrition_objective;

create policy nutrition_objective_all
  on public.nutrition_objective
  for all
  to authenticated
  using ((select auth.uid()) = id_user)
  with check ((select auth.uid()) = id_user);

-- La API solo conserva las operaciones que utiliza cada repositorio del frontend.
revoke all privileges on table
  public.nutrition_ingredient,
  public.nutrition_intake,
  public.nutrition_objective,
  public.nutrition_objetive_level,
  public.nutrition_intake_with_totals,
  public.nutrition_objectives_totals,
  public.training_exercise,
  public.training_schedule_item,
  public.training_entry,
  public.training_set,
  public.training_schedule,
  public.training_share
from anon, authenticated;

grant select, insert, update, delete on table
  public.nutrition_ingredient,
  public.nutrition_intake,
  public.nutrition_objective,
  public.training_exercise,
  public.training_schedule_item,
  public.training_entry,
  public.training_set,
  public.training_schedule
to authenticated;

grant select on table
  public.nutrition_intake_with_totals,
  public.nutrition_objectives_totals,
  public.training_share
to authenticated;

-- La función solo debe ejecutarse como trigger interno de Auth.
create or replace function public.insert_user_in_public_table_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public."user" (id, email, user_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'name'),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      'https://e7.pngegg.com/pngimages/643/454/png-clipart-business-game-avatar-computer-program-google-smart-object-game-child-thumbnail.png'
    )
  );

  return new;
end;
$$;

revoke all on function public.insert_user_in_public_table_for_new_user() from public, anon, authenticated;
