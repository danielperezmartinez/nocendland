-- Comprueba, tabla por tabla, que un segundo usuario y anon no pueden leer,
-- modificar ni borrar los datos de otro usuario, y que el dueño sí ve los suyos.
-- Se ejecuta con `supabase test db` contra la base local; nunca contra el
-- proyecto remoto compartido, porque inserta en auth.users (aunque todo acaba en
-- rollback).
begin;
create extension if not exists pgtap with schema extensions;

-- Tablas con datos de usuario y su columna de dueño. nutrition_objetive_level
-- queda fuera porque su política es (false) para todos los clientes; el test de
-- catálogo la cubre. Al añadir una tabla con datos de usuario, añádela aquí.
create temp table _tablas(tabla text, dueno text) on commit drop;
insert into _tablas values
  ('user', 'id'),
  ('nutrition_ingredient', 'id_user'),
  ('nutrition_intake', 'id_user'),
  ('nutrition_objective', 'id_user'),
  ('training_exercise', 'id_user'),
  ('training_share', 'owner_id'),
  ('training_schedule', 'id_user'),
  ('training_schedule_item', 'id_user'),
  ('training_entry', 'id_user'),
  ('training_set', 'id_user'),
  ('finance_settings', 'id_user'),
  ('finance_category', 'id_user'),
  ('finance_period', 'id_user'),
  ('finance_goal', 'id_user'),
  ('finance_recurring_item', 'id_user'),
  ('finance_budget_allocation', 'id_user'),
  ('finance_movement', 'id_user');
grant select on _tablas to anon, authenticated;

-- Toda tabla de nocendland con columna de dueño está en la lista.
select plan((select count(*)::int * 6 + 5 from _tablas));

select is_empty($$
  select c.table_name
  from information_schema.columns c
  join information_schema.tables t
    on t.table_schema = c.table_schema and t.table_name = c.table_name
  where c.table_schema = 'nocendland'
    and t.table_type = 'BASE TABLE'
    and c.column_name in ('id_user', 'owner_id')
    and c.table_name not in (select tabla from _tablas)
    and c.table_name <> 'nutrition_objetive_level'
$$, 'Toda tabla con dueño está cubierta por el test de aislamiento');

-- Cuenta las filas que devuelve una consulta o una sentencia con RETURNING.
-- Un «permission denied» cuenta como 0 filas: tampoco da acceso.
create function pg_temp.filas(sentencia text) returns bigint
language plpgsql as $$
declare
  total bigint;
begin
  execute format('with q as (%s) select count(*) from q', sentencia) into total;
  return total;
exception when insufficient_privilege then
  return 0;
end;
$$;
grant execute on function pg_temp.filas(text) to anon, authenticated;

-- Datos del usuario A, creados como postgres (todo se revierte al final).
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.local', 'authenticated', 'authenticated');

insert into nocendland."user" (id, email, user_name, avatar_url) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local', 'A', ''),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.local', 'B', '');

insert into nocendland.nutrition_ingredient (id, id_user, name)
values (900001, '00000000-0000-0000-0000-00000000000a', 'Avena');
insert into nocendland.nutrition_intake (ingredient, id_user, quantity_in_grams)
values (900001, '00000000-0000-0000-0000-00000000000a', 50);
insert into nocendland.nutrition_objective (level, id_user)
values ((enum_range(null::nocendland.nutrition_objetive_levels))[1], '00000000-0000-0000-0000-00000000000a');

insert into nocendland.training_exercise (id, id_user, name)
values (900001, '00000000-0000-0000-0000-00000000000a', 'Sentadilla');
insert into nocendland.training_share (owner_id, token_hash, share_type, title, manifest)
values (
  '00000000-0000-0000-0000-00000000000a', repeat('a', 64), 'exercises', 'Compartido',
  '{"version": "training-share/v1", "type": "exercises", "exercises": []}'
);
insert into nocendland.training_schedule (id, id_user, name, is_active)
values (900001, '00000000-0000-0000-0000-00000000000a', 'Horario', true);
insert into nocendland.training_schedule_item (id_user, schedule_id, exercise_id, weekday)
values ('00000000-0000-0000-0000-00000000000a', 900001, 900001, 1);
insert into nocendland.training_entry (id, id_user, exercise_id)
values (900001, '00000000-0000-0000-0000-00000000000a', 900001);
insert into nocendland.training_set (id_user, entry_id, position)
values ('00000000-0000-0000-0000-00000000000a', 900001, 1);

insert into nocendland.finance_settings (id_user)
values ('00000000-0000-0000-0000-00000000000a');
insert into nocendland.finance_category (id, id_user, name, flow_type)
values (900001, '00000000-0000-0000-0000-00000000000a', 'Casa', 'expense');
insert into nocendland.finance_period (id, id_user, starts_on, ends_on)
values (900001, '00000000-0000-0000-0000-00000000000a', '2026-10-01', '2026-10-31');
insert into nocendland.finance_goal (id, id_user, name, target_amount)
values (900001, '00000000-0000-0000-0000-00000000000a', 'Colchón', 1000);
insert into nocendland.finance_recurring_item (id, id_user, category_id, name, amount, starts_on, due_day)
values (900001, '00000000-0000-0000-0000-00000000000a', 900001, 'Alquiler', 500, '2026-10-01', 1);
insert into nocendland.finance_budget_allocation (id_user, period_id, category_id, planned_amount)
values ('00000000-0000-0000-0000-00000000000a', 900001, 900001, 500);
insert into nocendland.finance_movement (id_user, period_id, category_id, name, amount, scheduled_on)
values ('00000000-0000-0000-0000-00000000000a', 900001, 900001, 'Compra', 20, '2026-10-05');

-- Usuario B no ve, no modifica ni borra las filas de A.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';

select is(pg_temp.filas(format(
  'select 1 from nocendland.%I where %I = %L', tabla, dueno, '00000000-0000-0000-0000-00000000000a'
)), 0::bigint, format('B no lee filas de A en %s', tabla)) from _tablas;
select is(pg_temp.filas(format(
  'update nocendland.%1$I set %2$I = %2$I where %2$I = %3$L returning 1',
  tabla, dueno, '00000000-0000-0000-0000-00000000000a'
)), 0::bigint, format('B no modifica filas de A en %s', tabla)) from _tablas;
select is(pg_temp.filas(format(
  'delete from nocendland.%I where %I = %L returning 1', tabla, dueno, '00000000-0000-0000-0000-00000000000a'
)), 0::bigint, format('B no borra filas de A en %s', tabla)) from _tablas;

-- B no puede crear filas en nombre de A.
select throws_ok($$
  update nocendland."user" set id = '00000000-0000-0000-0000-00000000000a'
  where id = '00000000-0000-0000-0000-00000000000b'
$$, '42501', null, 'B no se apropia del perfil de A');
select throws_ok($$
  insert into nocendland.nutrition_ingredient (id_user, name)
  values ('00000000-0000-0000-0000-00000000000a', 'Intruso')
$$, '42501', null, 'B no inserta ingredientes en nombre de A');
select throws_ok($$
  insert into nocendland.training_exercise (id_user, name)
  values ('00000000-0000-0000-0000-00000000000a', 'Intruso')
$$, '42501', null, 'B no inserta ejercicios en nombre de A');
select throws_ok($$
  insert into nocendland.finance_category (id_user, name, flow_type)
  values ('00000000-0000-0000-0000-00000000000a', 'Intruso', 'expense')
$$, '42501', null, 'B no inserta categorías financieras en nombre de A');

-- anon no lista ni modifica nada.
set local request.jwt.claim.sub = '';
set local request.jwt.claims = '{"role":"anon"}';
set local role anon;

select is(pg_temp.filas(format('select 1 from nocendland.%I', tabla)), 0::bigint,
  format('anon no lista %s', tabla)) from _tablas;
select is(pg_temp.filas(format(
  'update nocendland.%1$I set %2$I = %2$I returning 1', tabla, dueno
)), 0::bigint, format('anon no modifica %s', tabla)) from _tablas;

-- A sí ve sus filas (las políticas no son simplemente «nadie»).
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select cmp_ok(pg_temp.filas(format(
  'select 1 from nocendland.%I where %I = %L', tabla, dueno, '00000000-0000-0000-0000-00000000000a'
)), '>', 0::bigint, format('A ve sus filas en %s', tabla)) from _tablas;

select * from finish();
rollback;
