-- Perfil mínimo para verificar Auth y su inicialización. No replica los dominios.
create schema if not exists nocendland;
create table if not exists nocendland."user" (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  email text not null,
  user_name text,
  avatar_url text
);
alter table nocendland."user" enable row level security;
grant usage on schema nocendland to authenticated;
grant select, insert, update on nocendland."user" to authenticated;
create policy own_profile on nocendland."user" to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
