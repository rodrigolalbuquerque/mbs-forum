"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip } from "lucide-react";

const ACCEPT = ".pdf,.doc,.docx,.md,.txt";
const ALLOWED_EXT = ["pdf", "doc", "docx", "md", "txt"];
const MAX_BYTES = 10 * 1024 * 1024;

// Composer apresentacional: texto, envio e upload ficam no pai (Conversation).
export default function CommentComposer({
  value,
  onChange,
  onSend,
  pending,
  fileName,
  onPickFile,
  onRemoveFile,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  pending: boolean;
  fileName: string | null;
  onPickFile: (f: File) => void;
  onRemoveFile: () => void;
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  function autoGrow() {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }
  useEffect(autoGrow, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // permite re-selecionar o mesmo arquivo
    if (!f) return;
    const ext = (f.name.split(".").pop() ?? "").toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      setFileError("Tipo não permitido (pdf, doc, docx, md, txt).");
      return;
    }
    if (f.size > MAX_BYTES) {
      setFileError("Arquivo acima de 10 MB.");
      return;
    }
    setFileError(null);
    onPickFile(f);
  }

  return (
    <div className="mx-auto max-w-3xl">
      {fileName && (
        <div className="mb-1 flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm">
          <span className="text-lg leading-none">📎</span>
          <span className="min-w-0 flex-1 truncate text-[#111b21]">
            {fileName}
          </span>
          <button
            type="button"
            onClick={onRemoveFile}
            disabled={pending}
            aria-label="Remover anexo"
            className="shrink-0 rounded px-1 text-lg leading-none text-wa-secondary hover:text-red-600 disabled:opacity-50"
          >
            ×
          </button>
        </div>
      )}
      {fileError && <p className="mb-1 px-1 text-xs text-red-600">{fileError}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        className="flex items-end gap-2"
      >
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={pending}
          aria-label="Anexar arquivo"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-wa-secondary transition hover:bg-black/5 disabled:opacity-50"
        >
          <Paperclip size={21} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={pick}
        />

        <textarea
          ref={areaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          readOnly={pending}
          autoComplete="off"
          placeholder="Escreva um comentário"
          className={`wa-scroll max-h-40 flex-1 resize-none rounded-2xl bg-white px-4 py-2.5 text-sm leading-relaxed text-[#111b21] outline-none placeholder:text-wa-secondary ${
            pending ? "opacity-60" : ""
          }`}
        />

        <button
          type="submit"
          disabled={pending || (!value.trim() && !fileName)}
          aria-label="Enviar"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-wa-green text-white transition hover:bg-wa-green-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M3 20.5v-6l8-2.5-8-2.5v-6l19 8.5-19 8.5z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
