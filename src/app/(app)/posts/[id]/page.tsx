import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MarkRead from "@/components/MarkRead";
import MessageBubble from "@/components/MessageBubble";
import TopicTitle from "@/components/TopicTitle";
import DeleteTopicButton from "@/components/DeleteTopicButton";
import Conversation, { type ChatMessage } from "@/components/Conversation";
import { formatDate } from "@/lib/format";
import { setStatus } from "@/lib/actions";

type Profile = {
  name: string;
  display_name: string | null;
  avatar_url?: string | null;
} | null;

function displayOf(p: Profile): string {
  return p?.display_name || p?.name || "Alguém";
}

type Post = {
  id: string;
  title: string;
  body: string;
  status: string;
  created_at: string;
  author_id: string;
  status_changed_at: string | null;
  author: Profile;
  changer: Profile;
};

type Comment = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author: Profile;
};

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // user.id local (sem chamada de rede) — o proxy/middleware já validou a sessão.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user.id;

  // Post e comentários em paralelo (1 ida-e-volta em vez de 2 sequenciais).
  const [{ data: postData }, { data: commentsData }] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "id, title, body, status, created_at, author_id, status_changed_at, author:profiles!posts_author_id_fkey(name, display_name, avatar_url), changer:profiles!posts_status_changed_by_fkey(name, display_name)",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("comments")
      .select(
        "id, body, created_at, author_id, author:profiles!comments_author_id_fkey(name, display_name, avatar_url)",
      )
      .eq("post_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!postData) notFound();
  const post = postData as unknown as Post;
  const comments = (commentsData ?? []) as unknown as Comment[];

  const isConcluido = post.status === "concluido";
  const isAuthor = post.author_id === userId;
  const authorName = displayOf(post.author);

  const initialMessages: ChatMessage[] = comments.map((c) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    author_id: c.author_id,
    authorName: displayOf(c.author),
    avatarUrl: c.author?.avatar_url ?? null,
  }));

  return (
    <div className="flex h-full w-full min-w-0 flex-col">
      {/* Marca como lido (some o badge de não-lidas deste tópico). */}
      <MarkRead postId={post.id} signal={comments.length} />

      {/* Cabeçalho da conversa */}
      <header className="flex min-w-0 items-center gap-3 bg-wa-panel px-3 py-2 md:px-4">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full text-wa-secondary hover:bg-black/5 md:hidden"
          aria-label="Voltar"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M15.5 4l-8 8 8 8 1.4-1.4L10.3 12l6.6-6.6z" />
          </svg>
        </Link>
        <TopicTitle
          postId={post.id}
          title={post.title}
          subtitle={`criado por ${authorName}`}
          canEdit={isAuthor}
        />

        {/* Botão de status */}
        <form action={setStatus}>
          <input type="hidden" name="post_id" value={post.id} />
          <input
            type="hidden"
            name="status"
            value={isConcluido ? "aberto" : "concluido"}
          />
          <button
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              isConcluido
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "bg-wa-green text-white hover:bg-wa-green-dark"
            }`}
          >
            {isConcluido ? "Reabrir" : "Concluir"}
          </button>
        </form>

        {isAuthor && <DeleteTopicButton postId={post.id} title={post.title} />}
      </header>

      {/* Conversa (envio otimista) + campo de digitar */}
      <Conversation
        postId={post.id}
        currentUserId={userId ?? ""}
        initialMessages={initialMessages}
        opening={
          <>
            <SystemChip>
              Tópico aberto por {authorName} · {formatDate(post.created_at)}
            </SystemChip>
            {post.body && (
              <MessageBubble
                mine={post.author_id === userId}
                name={authorName}
                avatarSrc={post.author?.avatar_url}
                body={post.body}
                time={post.created_at}
                editable={isAuthor}
                kind="post"
                id={post.id}
                postId={post.id}
              />
            )}
          </>
        }
        statusNotice={
          post.changer && post.status_changed_at ? (
            <SystemChip highlight>
              {displayOf(post.changer)} marcou como{" "}
              {isConcluido ? "Concluído" : "Aberto"} ·{" "}
              {formatDate(post.status_changed_at)}
            </SystemChip>
          ) : null
        }
      />
    </div>
  );
}

function SystemChip({
  children,
  highlight,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="my-2 flex justify-center">
      <span
        className={`rounded-lg px-3 py-1 text-center text-xs shadow-sm ${
          highlight
            ? "bg-wa-green/15 text-wa-green-dark"
            : "bg-wa-bubblein/90 text-wa-secondary"
        }`}
      >
        {children}
      </span>
    </div>
  );
}
