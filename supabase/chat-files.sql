-- ============================================================
--  Anexos de documentos nas mensagens (pdf, doc/docx, md, txt).
--  Bucket PRIVADO (URLs assinadas), cap de 10 MB, arquivo na pasta do
--  próprio usuário. Modelo genérico (imagens podem reusar depois).
-- ============================================================

alter table public.comments
  add column if not exists file_path text,
  add column if not exists file_name text,
  add column if not exists file_type text,
  add column if not exists file_size bigint;

insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-files', 'chat-files', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = 10485760;

drop policy if exists "chatfiles_insert_own" on storage.objects;
create policy "chatfiles_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'chat-files'
    and public.is_approved()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "chatfiles_select_approved" on storage.objects;
create policy "chatfiles_select_approved" on storage.objects
  for select to authenticated
  using (bucket_id = 'chat-files' and public.is_approved());

drop policy if exists "chatfiles_delete_own" on storage.objects;
create policy "chatfiles_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'chat-files'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_admin()
    )
  );

-- list_topics passa a trazer last_file_name (prévia "📎 arquivo").
-- Ver a definição completa em supabase/topic-reads.sql / list-topics.sql.
