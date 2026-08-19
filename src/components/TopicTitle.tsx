"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePostTitle } from "@/lib/actions";

export default function TopicTitle({
  postId,
  title,
  subtitle,
  canEdit,
}: {
  postId: string;
  title: string;
  subtitle: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [pending, startTransition] = useTransition();

  function save() {
    const clean = draft.trim();
    if (!clean || clean === title) {
      setEditing(false);
      setDraft(title);
      return;
    }
    startTransition(async () => {
      await updatePostTitle(postId, clean);
      setEditing(false);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={200}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setDraft(title);
              setEditing(false);
            }
          }}
          className="min-w-0 flex-1 rounded-md border border-wa-panelborder bg-white px-2 py-1 text-sm text-[#111b21] outline-none focus:border-wa-green"
        />
        <button
          onClick={save}
          disabled={pending}
          className="shrink-0 text-sm font-medium text-wa-green-dark hover:underline disabled:opacity-50"
        >
          {pending ? "..." : "Salvar"}
        </button>
        <button
          onClick={() => {
            setDraft(title);
            setEditing(false);
          }}
          disabled={pending}
          className="shrink-0 text-sm text-wa-secondary hover:underline disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <div className="min-w-0">
        <h1 className="truncate font-medium text-[#111b21]">{title}</h1>
        <p className="truncate text-xs text-wa-secondary">{subtitle}</p>
      </div>
      {canEdit && (
        <button
          onClick={() => {
            setDraft(title);
            setEditing(true);
          }}
          title="Editar título"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-wa-secondary hover:bg-black/5"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
        </button>
      )}
    </div>
  );
}
