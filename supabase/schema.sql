-- ============================================================
--  Esquema do banco - MBS Fórum
--  Cole este arquivo inteiro no SQL Editor do Supabase e rode.
-- ============================================================

-- ---------- Lista de e-mails autorizados (convidados) ----------
create table if not exists public.allowed_emails (
  email text primary key
);
alter table public.allowed_emails enable row level security;
-- Sem políticas: ninguém lê essa tabela pelo cliente.
-- Só o gatilho abaixo (SECURITY DEFINER) consegue consultá-la.

-- ---------- Perfis ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  name         text not null,          -- nome de usuário (login), fixo
  display_name text,                   -- nome de exibição (visual), editável
  avatar_url   text,                   -- foto de perfil
  email        text
);
alter table public.profiles enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id);

-- ---------- Gatilho: só autoriza cadastro de e-mail convidado ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.allowed_emails ae
    where lower(ae.email) = lower(new.email)
  ) then
    raise exception 'E-mail nao autorizado. Peca ao administrador para liberar seu acesso.';
  end if;

  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

-- É função de gatilho: não deve ser chamável via API (RPC).
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Postagens ----------
create table if not exists public.posts (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  body              text not null default '',
  author_id         uuid not null references public.profiles(id) on delete cascade,
  status            text not null default 'aberto' check (status in ('aberto','concluido')),
  status_changed_by uuid references public.profiles(id),
  status_changed_at timestamptz,
  created_at        timestamptz not null default now()
);
alter table public.posts enable row level security;

drop policy if exists "posts_select" on public.posts;
create policy "posts_select" on public.posts
  for select to authenticated using (true);

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts
  for insert to authenticated with check ((select auth.uid()) = author_id);

-- Qualquer integrante pode atualizar (usado para marcar Aberto/Concluído)
drop policy if exists "posts_update_any" on public.posts;
create policy "posts_update_any" on public.posts
  for update to authenticated using (true) with check (true);

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts
  for delete to authenticated using ((select auth.uid()) = author_id);

-- ---------- Comentários ----------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
alter table public.comments enable row level security;

drop policy if exists "comments_select" on public.comments;
create policy "comments_select" on public.comments
  for select to authenticated using (true);

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments
  for insert to authenticated with check ((select auth.uid()) = author_id);

drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own" on public.comments
  for update to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments
  for delete to authenticated using ((select auth.uid()) = author_id);

create index if not exists comments_post_id_idx on public.comments(post_id);
create index if not exists comments_author_id_idx on public.comments(author_id);
create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists posts_author_id_idx on public.posts(author_id);
create index if not exists posts_status_changed_by_idx on public.posts(status_changed_by);

-- ---------- Login por nome de usuário ----------
-- Nomes de usuário únicos (case-insensitive) para o login por nome funcionar.
create unique index if not exists profiles_name_lower_idx
  on public.profiles (lower(name));

-- Traduz nome de usuário -> e-mail (chamado pela tela de login).
create or replace function public.email_for_username(uname text)
returns text
language sql
security definer
set search_path = public
as $$
  select email
  from public.profiles
  where lower(name) = lower(trim(uname))
  limit 1;
$$;

-- Só o anon precisa (resolver usuário -> e-mail antes de logar).
grant execute on function public.email_for_username(text) to anon;

-- ---------- Fotos de perfil (Storage) ----------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_read" on storage.objects;
create policy "avatars_read" on storage.objects
  for select to public using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------- Realtime (atualização ao vivo) ----------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table public.comments;
  end if;
end $$;

-- ============================================================
--  Para liberar acesso a um integrante, rode (troque o e-mail):
--  insert into public.allowed_emails (email) values ('pessoa@exemplo.com');
-- ============================================================
