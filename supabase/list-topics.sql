-- ============================================================
--  RPC list_topics(): lista de tópicos para o painel lateral em UMA consulta.
--  Retorna, por tópico: contagem de comentários + último comentário, já
--  ordenado (abertos primeiro, depois por atividade recente).
--  Evita buscar "todos os comentários" a cada navegação.
-- ============================================================

create or replace function public.list_topics()
returns table (
  id uuid,
  title text,
  status text,
  created_at timestamptz,
  comment_count bigint,
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
