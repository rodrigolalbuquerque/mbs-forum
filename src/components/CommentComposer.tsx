"use client";

import { useRef } from "react";
import { addComment } from "@/lib/actions";

export default function CommentComposer({ postId }: { postId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  function autoGrow() {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter envia; Shift+Enter quebra a linha.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (e.currentTarget.value.trim()) {
        formRef.current?.requestSubmit();
      }
    }
  }

  function handleSubmit() {
    // Depois do envio, o React reseta o textarea (uncontrolled);
    // devolvemos a altura ao tamanho de 1 linha no próximo tick.
    requestAnimationFrame(() => {
      if (areaRef.current) areaRef.current.style.height = "auto";
    });
  }

  return (
    <form
      ref={formRef}
      action={addComment}
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-3xl items-end gap-2"
    >
      <input type="hidden" name="post_id" value={postId} />
      <textarea
        ref={areaRef}
        name="body"
        rows={1}
        required
        autoComplete="off"
        placeholder="Escreva um comentário"
        onInput={autoGrow}
        onKeyDown={handleKeyDown}
        className="wa-scroll max-h-40 flex-1 resize-none rounded-2xl bg-white px-4 py-2.5 text-sm leading-relaxed text-[#111b21] outline-none placeholder:text-wa-secondary"
      />
      <button
        type="submit"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-wa-green text-white transition hover:bg-wa-green-dark"
        aria-label="Enviar"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M3 20.5v-6l8-2.5-8-2.5v-6l19 8.5-19 8.5z" />
        </svg>
      </button>
    </form>
  );
}
