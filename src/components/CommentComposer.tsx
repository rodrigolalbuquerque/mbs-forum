"use client";

import { useRef, useState, useTransition } from "react";
import { addComment } from "@/lib/actions";

export default function CommentComposer({ postId }: { postId: string }) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function autoGrow() {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function send() {
    const text = body.trim();
    // Bloqueia envio vazio ou enquanto já está enviando (evita duplicatas).
    if (!text || pending) return;

    // Limpa o campo na hora → um reenvio acidental manda vazio (bloqueado).
    setBody("");
    requestAnimationFrame(() => {
      if (areaRef.current) areaRef.current.style.height = "auto";
    });

    const fd = new FormData();
    fd.set("post_id", postId);
    fd.set("body", text);

    startTransition(async () => {
      try {
        await addComment(fd);
      } catch {
        // Falhou: devolve o texto para o campo, sem perder a mensagem.
        setBody(text);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter envia; Shift+Enter quebra a linha.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className="mx-auto flex max-w-3xl items-end gap-2"
    >
      <textarea
        ref={areaRef}
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          autoGrow();
        }}
        onKeyDown={handleKeyDown}
        rows={1}
        // readOnly (não disabled) enquanto envia: bloqueia digitar/enviar mas
        // não fecha o teclado do celular.
        readOnly={pending}
        autoComplete="off"
        placeholder="Escreva um comentário"
        className={`wa-scroll max-h-40 flex-1 resize-none rounded-2xl bg-white px-4 py-2.5 text-sm leading-relaxed text-[#111b21] outline-none placeholder:text-wa-secondary ${
          pending ? "opacity-60" : ""
        }`}
      />
      <button
        type="submit"
        disabled={pending || !body.trim()}
        aria-label="Enviar"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-wa-green text-white transition hover:bg-wa-green-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M3 20.5v-6l8-2.5-8-2.5v-6l19 8.5-19 8.5z" />
        </svg>
      </button>
    </form>
  );
}
