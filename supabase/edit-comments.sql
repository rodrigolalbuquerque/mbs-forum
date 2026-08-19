-- ============================================================
--  Permite que o AUTOR edite seus próprios comentários.
--  Rode no SQL Editor do Supabase (necessário para a edição
--  de mensagens funcionar).
-- ============================================================

drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own" on public.comments
  for update to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);
