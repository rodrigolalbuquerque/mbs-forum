"use client";

import { useState, useTransition } from "react";
import { deletePostById } from "@/lib/actions";

export default function DeleteTopicButton({
  postId,
  title,
}: {
  postId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      await deletePostById(postId);
      // deletePostById redireciona para "/" no servidor.
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Apagar tópico"
        className="flex h-9 w-9 items-center justify-center rounded-full text-wa-secondary hover:bg-black/5"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2h4v2H4V6h4l1-2z" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-[#111b21]">
              Apagar tópico?
            </h2>
            <p className="mt-2 text-sm text-wa-secondary">
              O tópico <strong className="text-[#111b21]">“{title}”</strong> e
              todos os seus comentários serão apagados permanentemente. Essa
              ação não pode ser desfeita.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-full px-4 py-2 text-sm text-wa-secondary hover:bg-black/5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={pending}
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {pending ? "Apagando..." : "Apagar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
