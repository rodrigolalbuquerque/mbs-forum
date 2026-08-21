"use client";

import { useOptimistic, useState, useTransition } from "react";
import { addComment } from "@/lib/actions";
import MessageBubble from "@/components/MessageBubble";
import ScrollToBottom from "@/components/ScrollToBottom";
import CommentComposer from "@/components/CommentComposer";

export type ChatMessage = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  authorName: string;
  avatarUrl: string | null;
  status?: "sending";
};

export default function Conversation({
  postId,
  currentUserId,
  initialMessages,
  opening,
  statusNotice,
}: {
  postId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  opening: React.ReactNode;
  statusNotice: React.ReactNode;
}) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [optimistic, addOptimistic] = useOptimistic(
    initialMessages,
    (state: ChatMessage[], msg: ChatMessage) => [...state, msg],
  );

  function handleSend() {
    const body = text.trim();
    if (!body || pending) return;

    setText(""); // limpa na hora → reenvio manda vazio (bloqueado)

    const fd = new FormData();
    fd.set("post_id", postId);
    fd.set("body", body);

    startTransition(async () => {
      addOptimistic({
        id: `temp-${Date.now()}`,
        body,
        created_at: new Date().toISOString(),
        author_id: currentUserId,
        authorName: "",
        avatarUrl: null,
        status: "sending",
      });
      try {
        await addComment(fd);
      } catch {
        setText(body); // falhou: devolve o texto (o otimista some ao fim)
      }
    });
  }

  // Dedup otimista×realtime: se o realtime do próprio insert já trouxe a
  // mensagem real, descarta a otimista equivalente para não aparecer 2×.
  const reals = optimistic.filter((m) => !m.status);
  const messages = optimistic.filter(
    (m) =>
      !m.status ||
      !reals.some((r) => r.author_id === m.author_id && r.body === m.body),
  );

  const lastId = messages[messages.length - 1]?.id ?? "";

  return (
    <>
      <div className="wa-scroll wa-chat-bg flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 md:px-16">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-1.5">
          {opening}

          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              mine={m.author_id === currentUserId}
              name={m.authorName}
              avatarSrc={m.avatarUrl}
              body={m.body}
              time={m.created_at}
              editable={!m.status && m.author_id === currentUserId}
              status={m.status}
              kind="comment"
              id={m.id}
              postId={postId}
            />
          ))}

          {statusNotice}

          <ScrollToBottom dep={`${messages.length}:${lastId}`} />
        </div>
      </div>

      <footer className="bg-wa-panel px-3 py-2.5 md:px-4">
        <CommentComposer
          value={text}
          onChange={setText}
          onSend={handleSend}
          pending={pending}
        />
      </footer>
    </>
  );
}
