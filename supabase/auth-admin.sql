-- ============================================================
--  Autenticação: cadastro aberto + aprovação por admin
--  (já aplicado no projeto via MCP; mantido aqui como referência)
-- ============================================================

-- Colunas de aprovação / admin
alter table public.profiles
  add column if not exists approved boolean not null default false,
  add column if not exists is_admin boolean not null default false;

-- Funções auxiliares (SECURITY DEFINER p/ evitar recursão de RLS)
create or replace function public.is_approved()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select approved from public.profiles where id = auth.uid()), false);
$$;
revoke execute on function public.is_approved() from public, anon;
grant execute on function public.is_approved() to authenticated;

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Cadastro aberto: o gatilho não checa mais allowed_emails
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Definir admins (aprovados). Ajuste os nomes conforme necessário.
update public.profiles set is_admin = true, approved = true
where lower(name) in ('rodrigo', 'karol', 'simone', 'marcos');

-- Usuário não pode se auto-aprovar: só edita display_name/avatar_url
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

-- RLS: conteúdo só para aprovados
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_approved());

drop policy if exists "posts_select" on public.posts;
create policy "posts_select" on public.posts for select to authenticated
  using (public.is_approved());

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts for insert to authenticated
  with check ((select auth.uid()) = author_id and public.is_approved());

drop policy if exists "posts_update_any" on public.posts;
create policy "posts_update_any" on public.posts for update to authenticated
  using (public.is_approved()) with check (public.is_approved());

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts for delete to authenticated
  using ((select auth.uid()) = author_id and public.is_approved());

drop policy if exists "comments_select" on public.comments;
create policy "comments_select" on public.comments for select to authenticated
  using (public.is_approved());

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments for insert to authenticated
  with check ((select auth.uid()) = author_id and public.is_approved());

drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own" on public.comments for update to authenticated
  using ((select auth.uid()) = author_id and public.is_approved())
  with check ((select auth.uid()) = author_id and public.is_approved());

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments for delete to authenticated
  using ((select auth.uid()) = author_id and public.is_approved());

-- RPC de aprovação (só admin)
create or replace function public.set_user_approval(target_id uuid, approve boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem aprovar usuarios.';
  end if;
  update public.profiles set approved = approve where id = target_id;
end;
$$;
revoke execute on function public.set_user_approval(uuid, boolean) from public, anon;
grant execute on function public.set_user_approval(uuid, boolean) to authenticated;

-- allowed_emails não é mais usada
drop table if exists public.allowed_emails;
