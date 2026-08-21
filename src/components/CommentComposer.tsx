"use client";

import { useEffect, useRef } from "react";

// Composer apresentacional: o estado do texto e o envio ficam no pai
// (Conversation), que faz o envio otimista. Aqui só cuidamos da UI:
// auto-crescer, Enter envia / Shift+Enter quebra linha, e travar durante o envio.
export default function CommentComposer({
  value,
  onChange,
  onSend,
  pending,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  pending: boolean;
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null);

  function autoGrow() {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  // Ajusta a altura quando o texto muda (inclui o "limpar" após enviar).
  useEffect(autoGrow, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
      className="mx-auto flex max-w-3xl items-end gap-2"
    >
      <textarea
        ref={areaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        // readOnly (não disabled) enquanto envia: bloqueia digitar/enviar sem
        // fechar o teclado do celular.
        readOnly={pending}
        autoComplete="off"
        placeholder="Escreva um comentário"
        className={`wa-scroll max-h-40 flex-1 resize-none rounded-2xl bg-white px-4 py-2.5 text-sm leading-relaxed text-[#111b21] outline-none placeholder:text-wa-secondary ${
          pending ? "opacity-60" : ""
        }`}
      />
      <button
        type="submit"
        disabled={pending || !value.trim()}
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
