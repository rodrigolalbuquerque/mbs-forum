-- ============================================================
--  Cria 4 contas de teste (senha: 234567)
--  Rode no SQL Editor do Supabase DEPOIS do schema.sql.
--  Troque os e-mails placeholder pelos reais quando quiser
--  (ou apague e recadastre pelo app).
-- ============================================================

create extension if not exists pgcrypto;

-- 1) Autoriza os e-mails (a lista de convidados)
insert into public.allowed_emails (email) values
  ('rodrigo@exemplo.com'),
  ('karol@exemplo.com'),
  ('simone@exemplo.com'),
  ('marcos@exemplo.com')
on conflict do nothing;

-- 2) Cria os usuários de autenticação + identidade de e-mail
do $$
declare
  u record;
  new_id uuid;
begin
  for u in
    select * from (values
      ('rodrigo', 'rodrigo@exemplo.com'),
      ('karol',   'karol@exemplo.com'),
      ('simone',  'simone@exemplo.com'),
      ('marcos',  'marcos@exemplo.com')
    ) as t(name, email)
  loop
    if exists (select 1 from auth.users where email = u.email) then
      continue;
    end if;

    new_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
      u.email, crypt('234567', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      json_build_object('name', u.name),
      '', '', '', ''
    );

    insert into auth.identities (
      provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      new_id::text, new_id,
      json_build_object('sub', new_id::text, 'email', u.email),
      'email', now(), now(), now()
    );
  end loop;
end $$;

-- Conferir:
-- select u.email, p.name from auth.users u join public.profiles p on p.id = u.id;
