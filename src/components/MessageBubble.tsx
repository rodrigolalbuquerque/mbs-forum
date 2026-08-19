"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import Avatar from "@/components/Avatar";
import { colorFor } from "@/lib/colors";
import { formatTime } from "@/lib/format";
import {
  updateComment,
  updatePostBody,
  deleteCommentById,
} from "@/lib/actions";

export default function MessageBubble({
  mine,
  name,
  avatarSrc,
  body,
  time,
  editable,
  kind,
  id,
  postId,
}: {
  mine: boolean;
  name: string;
  avatarSrc?: string | null;
  body: string;
  time: string;
  editable: boolean;
  kind: "post" | "comment";
  id: string;
  postId: string;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(body);
  const [pending, startTransition] = useTransition();

  function saveEdit() {
    const clean = draft.trim();
    if (!clean || clean === body) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      if (kind === "comment") {
        await updateComment(id, clean, postId);
      } else {
        await updatePostBody(postId, clean);
      }
      setEditing(false);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteCommentById(id, postId);
      router.refresh();
    });
  }

  return (
    <div
      className={`group flex items-end gap-1.5 ${
        mine ? "justify-end" : "justify-start"
      }`}
    >
      {!mine && <Avatar name={name} src={avatarSrc} size={26} />}
      <div
        className={`max-w-[85%] rounded-lg px-2.5 py-1.5 shadow-sm ${
          mine ? "bg-wa-bubbleout" : "bg-wa-bubblein"
        }`}
      >
        {!mine && (
          <span
            className="mb-0.5 block text-xs font-semibold"
            style={{ color: colorFor(name) }}
          >
            {name}
          </span>
        )}

        {editing ? (
          <div className="w-[72vw] max-w-140">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              autoFocus
              className="w-full resize-y bg-transparent text-sm leading-relaxed text-[#111b21] outline-none placeholder:text-wa-secondary"
            />
            <div className="mt-1 flex justify-end gap-3 border-t border-black/10 pt-1.5 text-xs">
              <button
                onClick={() => {
                  setDraft(body);
                  setEditing(false);
                }}
                disabled={pending}
                className="text-wa-secondary hover:underline disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={pending}
                className="font-medium text-wa-green-dark hover:underline disabled:opacity-50"
              >
                {pending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="whitespace-pre-wrap wrap-break-word text-sm text-[#111b21]">
              {body}
            </div>
            <div className="mt-1 flex items-center justify-end gap-1">
              <span className="select-none text-[10px] text-wa-secondary">
                {formatTime(time)}
              </span>
              {editable && (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="-mr-1 flex h-5 w-5 items-center justify-center rounded text-wa-secondary hover:bg-black/10 aria-expanded:bg-black/10"
                    aria-expanded={menuOpen}
                    aria-label="Opções"
                  >
                    <ChevronDown size={16} strokeWidth={2.25} />
                  </button>
                  {menuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpen(false)}
                      />
                      <div className="absolute bottom-full right-0 z-20 mb-1 w-32 overflow-hidden rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5">
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            setDraft(body);
                            setEditing(true);
                          }}
                          className="block w-full px-3 py-1.5 text-left text-[#111b21] hover:bg-wa-hover"
                        >
                          Editar
                        </button>
                        {kind === "comment" && (
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              setConfirmOpen(true);
                            }}
                            className="block w-full px-3 py-1.5 text-left text-red-600 hover:bg-wa-hover"
                          >
                            Apagar
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !pending && setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-6 text-left shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-[#111b21]">
              Apagar comentário?
            </h2>
            <p className="mt-2 text-sm text-wa-secondary">
              Este comentário será apagado permanentemente. Essa ação não pode
              ser desfeita.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={pending}
                className="rounded-full px-4 py-2 text-sm text-wa-secondary hover:bg-black/5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={remove}
                disabled={pending}
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {pending ? "Apagando..." : "Apagar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
