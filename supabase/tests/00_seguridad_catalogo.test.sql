-- Revisa el catálogo de Postgres y falla ante los patrones prohibidos por el
-- sistema «Seguridad, coste y cumplimiento» (docs/README.md). Se ejecuta con
-- `supabase test db` contra la base local construida solo con las migraciones,
-- así que también detecta lo que exista únicamente en el proyecto remoto.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

-- Esquemas propios de Nocendland (expuesto y privado).
create temp table _esquemas(nombre text) on commit drop;
insert into _esquemas values ('nocendland'), ('nocendland_private');

-- 1. Toda tabla propia tiene RLS activado.
select is_empty($$
  select n.nspname || '.' || c.relname
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.relkind in ('r', 'p')
    and n.nspname in (select nombre from _esquemas)
    and not c.relrowsecurity
$$, 'Toda tabla propia tiene RLS activado');

-- 2. Ninguna política de escritura es USING/WITH CHECK (true).
select is_empty($$
  select n.nspname || '.' || c.relname || ' · ' || p.polname
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in (select nombre from _esquemas)
    and p.polcmd in ('a', 'w', 'd', '*')
    and (pg_get_expr(p.polqual, p.polrelid) in ('true', '(true)')
      or pg_get_expr(p.polwithcheck, p.polrelid) in ('true', '(true)'))
$$, 'Ninguna política de INSERT/UPDATE/DELETE/ALL es (true)');

-- 3. Una política SELECT (true) solo existe con excepción escrita.
select is_empty($$
  select n.nspname || '.' || c.relname || ' · ' || p.polname
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in (select nombre from _esquemas)
    and p.polcmd = 'r'
    and pg_get_expr(p.polqual, p.polrelid) in ('true', '(true)')
    and coalesce(obj_description(p.oid, 'pg_policy'), '') not like 'excepcion:%'
$$, 'Las políticas SELECT (true) tienen excepción escrita');

-- 4. Toda función SECURITY DEFINER fija search_path vacío.
select is_empty($$
  select p.oid::regprocedure::text
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where p.prosecdef
    and n.nspname in (select nombre from _esquemas)
    and not exists (
      select 1 from unnest(coalesce(p.proconfig, '{}')) cfg
      where cfg in ('search_path=""', 'search_path=')
    )
$$, 'Las funciones SECURITY DEFINER tienen search_path vacío');

-- 5. anon no ejecuta funciones SECURITY DEFINER salvo excepción escrita.
select is_empty($$
  select p.oid::regprocedure::text
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where p.prosecdef
    and n.nspname in (select nombre from _esquemas)
    and has_function_privilege('anon', p.oid, 'EXECUTE')
    and coalesce(obj_description(p.oid, 'pg_proc'), '') not like 'excepcion:%'
$$, 'anon no ejecuta funciones SECURITY DEFINER sin excepción');

-- 6. Extensiones con salida a red fuera del alcance de anon y authenticated.
--    Al instalar pg_net, Supabase concede acceso a anon y authenticated por
--    defecto; si una migración la instala, debe revocarlo en el mismo cambio.
select is_empty($$
  select r.rolname || ' → ' || p.oid::regprocedure::text
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  cross join (values ('anon'), ('authenticated')) r(rolname)
  where n.nspname in ('net', 'http')
    and has_schema_privilege(r.rolname, n.oid, 'USAGE')
    and has_function_privilege(r.rolname, p.oid, 'EXECUTE')
$$, 'pg_net/http no son ejecutables por anon ni authenticated');

-- 7. Todo bucket tiene límite de tamaño.
select is_empty($$
  select id from storage.buckets where file_size_limit is null
$$, 'Todo bucket tiene file_size_limit');

-- 8. El bucket de Nocendland está versionado en las migraciones. Sin esto, el
--    test 7 no puede ver el bucket remoto. Véase la tarea «Limitar tamaño y
--    cuota del bucket de Nocendland».
select isnt_empty($$
  select id from storage.buckets where id = 'nocendland'
$$, 'El bucket nocendland existe en las migraciones');

-- 9. Las políticas propias para clientes se acotan al usuario: cada una cita
--    auth.uid() o es (false). Una política nueva que autorice por otro criterio
--    necesita una excepción escrita.
select is_empty($$
  select n.nspname || '.' || c.relname || ' · ' || p.polname
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in (select nombre from _esquemas)
    and coalesce(obj_description(p.oid, 'pg_policy'), '') not like 'excepcion:%'
    and not (
      coalesce(pg_get_expr(p.polqual, p.polrelid), '') in ('false', '')
      and coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') in ('false', '')
    )
    and (
      coalesce(pg_get_expr(p.polqual, p.polrelid), '') not in ('', 'false')
        and pg_get_expr(p.polqual, p.polrelid) not like '%auth.uid()%'
      or coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') not in ('', 'false')
        and pg_get_expr(p.polwithcheck, p.polrelid) not like '%auth.uid()%'
    )
$$, 'Las políticas propias citan auth.uid() o son (false)');

select * from finish();
rollback;
