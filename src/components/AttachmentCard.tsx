"use client";

import { useState } from "react";
import { signAttachment } from "@/lib/actions";

const ICONS: Record<string, string> = {
  pdf: "📄",
  doc: "📄",
  docx: "📄",
  md: "📝",
  txt: "📃",
};

function formatSize(n?: number | null): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentCard({
  path,
  name,
  size,
  pending,
}: {
  path?: string | null;
  name: string;
  size?: number | null;
  pending?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const ext = (name.split(".").pop() ?? "").toLowerCase();
  const icon = ICONS[ext] ?? "📎";

  async function open() {
    if (pending || !path || loading) return;
    setLoading(true);
    try {
      const url = await signAttachment(path);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  }

  const meta = pending
    ? "enviando…"
    : loading
      ? "abrindo…"
      : `${ext.toUpperCase()}${size ? ` · ${formatSize(size)}` : ""}`;

  return (
    <button
      type="button"
      onClick={open}
      disabled={pending || loading}
      className="mb-1 flex w-full min-w-[180px] items-center gap-2.5 rounded-lg bg-black/5 px-2.5 py-2 text-left transition hover:bg-black/10 disabled:cursor-default disabled:hover:bg-black/5"
    >
      <span className="text-2xl leading-none">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[#111b21]">
          {name}
        </span>
        <span className="block text-xs text-wa-secondary">{meta}</span>
      </span>
      {!pending && (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
          className="shrink-0 text-wa-secondary"
        >
          <path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z" />
        </svg>
      )}
    </button>
  );
}
