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
        className={`relative max-w-[78%] rounded-lg pl-3 pr-8 py-2 shadow-sm ${
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
          <div className="w-[78vw] max-w-140">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              autoFocus
              className="w-full resize-y bg-transparent text-sm leading-relaxed text-[#111b21] outline-none placeholder:text-wa-secondary"
            />
            <div className="-mr-5 mt-1 flex justify-end gap-3 border-t border-black/10 pt-1.5 text-xs">
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
            <span className="whitespace-pre-wrap break-words text-sm text-[#111b21]">
              {body}
            </span>
            <span className="float-right ml-2 mt-1 select-none text-[10px] text-wa-secondary">
              {formatTime(time)}
            </span>
          </>
        )}

        {/* Menu de ações (só nas próprias mensagens) */}
        {editable && !editing && (
          <div className="absolute right-1 top-1">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-6 w-6 items-center justify-center rounded text-wa-secondary opacity-60 transition hover:bg-black/10 group-hover:opacity-100 aria-expanded:opacity-100"
              aria-expanded={menuOpen}
              aria-label="Opções"
            >
              <ChevronDown size={20} strokeWidth={2.25} />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-1 w-32 overflow-hidden rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5">
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
