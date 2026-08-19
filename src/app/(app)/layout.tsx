import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileButton from "@/components/ProfileButton";
import Shell from "@/components/Shell";
import TopicList, { type TopicItem } from "@/components/TopicList";
import RealtimeRefresher from "@/components/RealtimeRefresher";
import { signOut } from "@/lib/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, display_name, avatar_url, approved, is_admin")
    .eq("id", user!.id)
    .single();

  // Só quem foi aprovado por um admin acessa o app.
  if (!profile?.approved) redirect("/pendente");

  const username = profile.name ?? "voce";
  const myDisplayName = profile.display_name || username;
  const isAdmin = profile.is_admin;

  const { data: postsData } = await supabase
    .from("posts")
    .select(
      "id, title, body, status, created_at, author:profiles!posts_author_id_fkey(name), comments(count)",
    )
    .order("created_at", { ascending: false });

  // Último comentário de cada tópico (para a prévia estilo WhatsApp).
  const { data: commentsData } = await supabase
    .from("comments")
    .select(
      "post_id, body, created_at, author:profiles!comments_author_id_fkey(name, display_name)",
    )
    .order("created_at", { ascending: false });

  type LastComment = { author: string; body: string; created_at: string };
  const lastByPost = new Map<string, LastComment>();
  for (const c of (commentsData ?? []) as unknown as {
    post_id: string;
    body: string;
    created_at: string;
    author: { name: string; display_name: string | null } | null;
  }[]) {
    if (!lastByPost.has(c.post_id)) {
      lastByPost.set(c.post_id, {
        author: c.author?.display_name || c.author?.name || "Alguém",
        body: c.body,
        created_at: c.created_at,
      });
    }
  }

  const items: TopicItem[] = (
    (postsData ?? []) as unknown as {
      id: string;
      title: string;
      body: string;
      status: string;
      created_at: string;
      author: { name: string } | null;
      comments: { count: number }[];
    }[]
  ).map((p) => {
    const last = lastByPost.get(p.id);
    return {
      id: p.id,
      title: p.title,
      status: p.status,
      count: p.comments?.[0]?.count ?? 0,
      preview: last ? `${last.author}: ${last.body}` : p.body || "Novo tópico",
      lastActivity: last?.created_at ?? p.created_at,
    };
  });

  // Abertos primeiro; dentro de cada grupo, por atividade mais recente.
  items.sort((a, b) => {
    const ac = a.status === "concluido" ? 1 : 0;
    const bc = b.status === "concluido" ? 1 : 0;
    if (ac !== bc) return ac - bc;
    return b.lastActivity.localeCompare(a.lastActivity);
  });

  const left = (
    <>
      {/* Cabeçalho do painel */}
      <header className="flex items-center justify-between bg-wa-panel px-2 py-2.5 md:px-3">
          <ProfileButton
            userId={user!.id}
            username={username}
            displayName={myDisplayName}
            avatarUrl={profile?.avatar_url ?? null}
          />
          <div className="flex items-center gap-1">
            {isAdmin && (
              <Link
                href="/admin"
                title="Administração"
                className="flex h-10 w-10 items-center justify-center rounded-full text-wa-secondary hover:bg-black/5"
              >
                <svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor">
                  <path d="M12 1l9 4v6c0 5-3.8 9.4-9 11-5.2-1.6-9-6-9-11V5l9-4zm0 6a3 3 0 100 6 3 3 0 000-6z" />
                </svg>
              </Link>
            )}
            <Link
              href="/new"
              title="Novo tópico"
              className="flex h-10 w-10 items-center justify-center rounded-full text-wa-secondary hover:bg-black/5"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M20 14h-6v6h-4v-6H4v-4h6V4h4v6h6v4z" />
              </svg>
            </Link>
            <form action={signOut}>
              <button
                title="Sair"
                className="flex h-10 w-10 items-center justify-center rounded-full text-wa-secondary hover:bg-black/5"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M16 17v-3H9v-4h7V7l5 5-5 5zM14 2a2 2 0 012 2v2h-2V4H4v16h10v-2h2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2h10z" />
                </svg>
              </button>
            </form>
          </div>
      </header>

      <TopicList items={items} />
    </>
  );

  return (
    <>
      <RealtimeRefresher />
      <Shell left={left}>{children}</Shell>
    </>
  );
}
