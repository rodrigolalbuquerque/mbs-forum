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

  // Uma consulta enxuta: por tópico, último comentário + contagem, já ordenada
  // no banco (abertos primeiro, depois por atividade mais recente).
  const { data: topicsData } = await supabase.rpc("list_topics");
  const items: TopicItem[] = (topicsData ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    count: Number(r.comment_count) || 0,
    preview: r.last_body
      ? `${r.last_author}: ${r.last_body}`
      : r.topic_preview || "Novo tópico",
    lastActivity: r.last_activity,
  }));

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
