-- ============================================================
--  Permite login por NOME DE USUÁRIO (além do e-mail)
--  Rode no SQL Editor do Supabase.
-- ============================================================

-- Garante nomes de usuário únicos (sem diferenciar maiúsc/minúsc).
create unique index if not exists profiles_name_lower_idx
  on public.profiles (lower(name));

-- Função pública que devolve o e-mail de um nome de usuário.
-- Usada pela tela de login para traduzir "usuário" -> "e-mail"
-- antes de autenticar no Supabase.
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
