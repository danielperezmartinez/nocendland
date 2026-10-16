-- Comprueba los topes de tamaño y cantidad que impiden que una cuenta agote el
-- plan compartido de devappsdpm-db. Solo contra la base local.
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local', 'authenticated', 'authenticated',
   '{"avatar_url": "https://avatars.test.local/a.png"}');

-- Bucket versionado con sus límites.
select results_eq(
  $$ select file_size_limit, allowed_mime_types, public from storage.buckets where id = 'nocendland' $$,
  $$ values (2097152::bigint, array['image/png', 'image/jpeg', 'image/webp']::text[], false) $$,
  'El bucket nocendland admite 2 MB de PNG, JPEG o WebP y es privado');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

-- El perfil toma email y avatar de Auth, no del cliente.
insert into nocendland."user" (id, email, user_name, avatar_url)
values ('00000000-0000-0000-0000-00000000000a', 'suplantado@otro.test', 'A', 'https://malicioso.test/x.png');
select results_eq(
  $$ select email, avatar_url from nocendland."user" where id = '00000000-0000-0000-0000-00000000000a' $$,
  $$ values ('a@test.local'::text, 'https://avatars.test.local/a.png'::text) $$,
  'El perfil creado usa el email y el avatar de Auth');
update nocendland."user" set email = 'otro@otro.test', avatar_url = 'https://malicioso.test/y.png'
where id = '00000000-0000-0000-0000-00000000000a';
select results_eq(
  $$ select email, avatar_url from nocendland."user" where id = '00000000-0000-0000-0000-00000000000a' $$,
  $$ values ('a@test.local'::text, 'https://avatars.test.local/a.png'::text) $$,
  'Actualizar el perfil no cambia email ni avatar');

-- Storage: solo las carpetas de la app y la carpeta propia.
select lives_ok($$
  insert into storage.objects (bucket_id, name, owner_id)
  values ('nocendland', 'nutrition_ingredient/00000000-0000-0000-0000-00000000000a/1', '00000000-0000-0000-0000-00000000000a')
$$, 'A sube a su carpeta de ingredientes');
select throws_ok($$
  insert into storage.objects (bucket_id, name, owner_id)
  values ('nocendland', 'cualquier_cosa/00000000-0000-0000-0000-00000000000a/1', '00000000-0000-0000-0000-00000000000a')
$$, '42501', null, 'A no sube a carpetas ajenas a la app');
select throws_ok($$
  insert into storage.objects (bucket_id, name, owner_id)
  values ('nocendland', 'training_share/00000000-0000-0000-0000-00000000000a/1', '00000000-0000-0000-0000-00000000000a')
$$, '42501', null, 'A no escribe instantáneas de training_share');

-- Cuota de 200 objetos por usuario.
reset role;
insert into storage.objects (bucket_id, name, owner_id)
select 'nocendland', format('training_exercise/00000000-0000-0000-0000-00000000000a/%s', n), '00000000-0000-0000-0000-00000000000a'
from generate_series(2, 200) n;
set local role authenticated;
select throws_ok($$
  insert into storage.objects (bucket_id, name, owner_id)
  values ('nocendland', 'nutrition_ingredient/00000000-0000-0000-0000-00000000000a/extra', '00000000-0000-0000-0000-00000000000a')
$$, '42501', null, 'El objeto 201 supera la cuota por usuario');

-- Tope de filas por usuario (horarios: 50).
reset role;
insert into nocendland.training_schedule (id_user, name)
select '00000000-0000-0000-0000-00000000000a', format('Horario %s', n) from generate_series(1, 50) n;
set local role authenticated;
select throws_ok($$
  insert into nocendland.training_schedule (id_user, name)
  values ('00000000-0000-0000-0000-00000000000a', 'Horario 51')
$$, 'P0001', 'row_limit_exceeded', 'El horario 51 supera el tope por usuario');
select throws_ok($$
  insert into nocendland.training_exercise (id_user, name)
  values ('00000000-0000-0000-0000-00000000000a', repeat('x', 201))
$$, '23514', null, 'Un nombre de más de 200 caracteres se rechaza');
select lives_ok($$
  insert into nocendland.training_exercise (id_user, name)
  values ('00000000-0000-0000-0000-00000000000a', 'Press banca')
$$, 'Un ejercicio normal se guarda');

-- Enlaces de compartir: 20 activos como mucho; los revocados no cuentan.
reset role;
insert into nocendland.training_share (owner_id, token_hash, share_type, title, manifest)
select '00000000-0000-0000-0000-00000000000a', lpad(to_hex(n), 64, '0'), 'exercises', 'Compartido',
  '{"version": "training-share/v1", "type": "exercises", "exercises": []}'
from generate_series(1, 20) n;
select throws_ok($$
  insert into nocendland.training_share (owner_id, token_hash, share_type, title, manifest)
  values ('00000000-0000-0000-0000-00000000000a', repeat('f', 64), 'exercises', 'Uno más',
    '{"version": "training-share/v1", "type": "exercises", "exercises": []}')
$$, 'P0001', 'share_limit_reached', 'El enlace activo 21 supera el tope');
update nocendland.training_share set revoked_at = now() where token_hash = lpad(to_hex(1), 64, '0');
select lives_ok($$
  insert into nocendland.training_share (owner_id, token_hash, share_type, title, manifest)
  values ('00000000-0000-0000-0000-00000000000a', repeat('e', 64), 'exercises', 'Tras revocar',
    '{"version": "training-share/v1", "type": "exercises", "exercises": []}')
$$, 'Tras revocar un enlace se puede crear otro');

-- Previsualizaciones: 60 por hora y enlace, solo desde service_role.
set local role service_role;
select is(nocendland.register_training_share_preview(repeat('0', 64)), 'not_found',
  'Un token desconocido no cuenta como visita');
select is(
  (select count(*) from generate_series(1, 60) n
   where nocendland.register_training_share_preview(lpad(to_hex(2), 64, '0')) = 'allowed'),
  60::bigint, 'Las 60 primeras previsualizaciones de la hora se permiten');
select is(nocendland.register_training_share_preview(lpad(to_hex(2), 64, '0')), 'rate_limited',
  'La previsualización 61 de la hora se limita');
select is(nocendland.register_training_share_preview(lpad(to_hex(1), 64, '0')), 'not_found',
  'Un enlace revocado no se previsualiza');

set local role anon;
select throws_ok($$ select nocendland.register_training_share_preview(repeat('0', 64)) $$,
  '42501', null, 'anon no registra previsualizaciones directamente');

select * from finish();
rollback;
