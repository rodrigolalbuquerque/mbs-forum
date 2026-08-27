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
  filePath?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
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
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [optimistic, addOptimistic] = useOptimistic(
    initialMessages,
    (state: ChatMessage[], msg: ChatMessage) => [...state, msg],
  );

  function handleSend() {
    const body = text.trim();
    if ((!body && !file) || pending) return;

    const attaching = file;
    setText("");
    setFile(null);

    startTransition(async () => {
      addOptimistic({
        id: `temp-${Date.now()}`,
        body,
        created_at: new Date().toISOString(),
        author_id: currentUserId,
        authorName: "",
        avatarUrl: null,
        fileName: attaching?.name ?? null,
        fileSize: attaching?.size ?? null,
        filePath: null,
        status: "sending",
      });

      try {
        const fd = new FormData();
        fd.set("post_id", postId);
        fd.set("body", body);

        if (attaching) {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const ext = attaching.name.split(".").pop()?.toLowerCase() || "bin";
          const path = `${currentUserId}/${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("chat-files")
            .upload(path, attaching, {
              contentType: attaching.type || undefined,
            });
          if (upErr) throw upErr;
          fd.set("file_path", path);
          fd.set("file_name", attaching.name);
          fd.set("file_type", attaching.type || "");
          fd.set("file_size", String(attaching.size));
        }

        await addComment(fd);
      } catch {
        // Falhou: devolve texto e anexo, sem perder nada.
        setText(body);
        setFile(attaching);
      }
    });
  }

  // Dedup otimista×realtime: descarta a temp cuja (autor+texto+arquivo) já
  // exista num comentário real (evita aparecer 2×).
  const reals = optimistic.filter((m) => !m.status);
  const messages = optimistic.filter(
    (m) =>
      !m.status ||
      !reals.some(
        (r) =>
          r.author_id === m.author_id &&
          r.body === m.body &&
          (r.fileName ?? "") === (m.fileName ?? ""),
      ),
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
              filePath={m.filePath}
              fileName={m.fileName}
              fileSize={m.fileSize}
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
          fileName={file?.name ?? null}
          onPickFile={setFile}
          onRemoveFile={() => setFile(null)}
        />
      </footer>
    </>
  );
}
