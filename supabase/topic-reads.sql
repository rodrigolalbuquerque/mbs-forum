-- ============================================================
--  Sinalização de mensagens não-lidas.
--  Guarda, por usuário/tópico, quando ele leu por último; a RPC list_topics
--  passa a devolver unread_count (comentários de OUTROS após a última leitura).
-- ============================================================

create table if not exists public.topic_reads (
  user_id uuid not null references auth.users on delete cascade,
  post_id uuid not null references public.posts on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table public.topic_reads enable row level security;

drop policy if exists "topic_reads_select_own" on public.topic_reads;
create policy "topic_reads_select_own" on public.topic_reads
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "topic_reads_insert_own" on public.topic_reads;
create policy "topic_reads_insert_own" on public.topic_reads
  for insert to authenticated
  with check ((select auth.uid()) = user_id and public.is_approved());

drop policy if exists "topic_reads_update_own" on public.topic_reads;
create policy "topic_reads_update_own" on public.topic_reads
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Marca o tópico como lido usando o now() do banco (evita desvio de relógio).
create or replace function public.mark_topic_read(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_approved() then
    return;
  end if;
  insert into public.topic_reads (user_id, post_id, last_read_at)
  values (auth.uid(), p_id, now())
  on conflict (user_id, post_id) do update set last_read_at = now();
end;
$$;
revoke execute on function public.mark_topic_read(uuid) from public, anon;
grant execute on function public.mark_topic_read(uuid) to authenticated;

-- list_topics com unread_count (ver também supabase/list-topics.sql)
drop function if exists public.list_topics();
create function public.list_topics()
returns table (
  id uuid,
  title text,
  status text,
  created_at timestamptz,
  comment_count bigint,
  unread_count bigint,
  last_body text,
  last_author text,
  last_activity timestamptz,
  topic_preview text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    p.id,
    p.title,
    p.status,
    p.created_at,
    coalesce(cc.cnt, 0) as comment_count,
    (
      select count(*)::bigint
      from public.comments c
      where c.post_id = p.id
        and c.author_id <> auth.uid()
        and c.created_at > coalesce(
          (select tr.last_read_at from public.topic_reads tr
             where tr.user_id = auth.uid() and tr.post_id = p.id),
          '-infinity'::timestamptz)
    ) as unread_count,
    left(lc.body, 140) as last_body,
    lc.author as last_author,
    coalesce(lc.created_at, p.created_at) as last_activity,
    left(p.body, 140) as topic_preview
  from public.posts p
  left join lateral (
    select count(*)::bigint as cnt
    from public.comments c where c.post_id = p.id
  ) cc on true
  left join lateral (
    select c.body, c.created_at,
           coalesce(pr.display_name, pr.name) as author
    from public.comments c
    join public.profiles pr on pr.id = c.author_id
    where c.post_id = p.id
    order by c.created_at desc
    limit 1
  ) lc on true
  where public.is_approved()
  order by (p.status = 'concluido'), coalesce(lc.created_at, p.created_at) desc;
$$;
revoke execute on function public.list_topics() from public, anon;
grant execute on function public.list_topics() to authenticated;
