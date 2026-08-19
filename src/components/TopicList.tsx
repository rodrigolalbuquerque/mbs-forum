"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatListStamp } from "@/lib/format";

export type TopicItem = {
  id: string;
  title: string;
  status: string;
  count: number;
  preview: string;
  lastActivity: string;
};

export default function TopicList({ items }: { items: TopicItem[] }) {
  const [q, setQ] = useState("");
  const pathname = usePathname();

  const term = q.trim().toLowerCase();
  const filtered = term
    ? items.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          t.preview.toLowerCase().includes(term),
      )
    : items;

  return (
    <>
      {/* Busca */}
      <div className="bg-white px-3 py-2">
        <div className="flex items-center gap-3 rounded-lg bg-wa-panel px-4 py-1.5">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="#54656f"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar um tópico"
            className="w-full bg-transparent py-1 text-sm text-[#111b21] outline-none placeholder:text-wa-secondary"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="wa-scroll flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-wa-secondary">
            {items.length === 0
              ? "Nenhum tópico ainda. Toque em + para criar."
              : "Nada encontrado."}
          </p>
        ) : (
          <ul>
            {filtered.map((t) => {
              const active = pathname === `/posts/${t.id}`;
              const concluido = t.status === "concluido";
              return (
                <li key={t.id}>
                  <Link
                    href={`/posts/${t.id}`}
                    className={`flex items-center gap-3 px-3 py-3 transition ${
                      active
                        ? "bg-wa-panel"
                        : concluido
                          ? "bg-black/4 hover:bg-wa-hover"
                          : "hover:bg-wa-hover"
                    }`}
                  >
                    {/* Indicador de estado do tópico */}
                    <span
                      title={concluido ? "Concluído" : "Aberto"}
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        concluido
                          ? "bg-wa-green"
                          : "bg-amber-500 animate-dot-pulse"
                      }`}
                    />
                    <div
                      className={`min-w-0 flex-1 border-b border-wa-panelborder pb-3 ${
                        concluido ? "opacity-75" : ""
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={`truncate font-medium ${
                            concluido ? "text-wa-secondary" : "text-[#111b21]"
                          }`}
                        >
                          {t.title}
                        </span>
                        <span
                          className={`shrink-0 text-xs ${
                            t.count > 0 && !active
                              ? "text-wa-green"
                              : "text-wa-secondary"
                          }`}
                        >
                          {formatListStamp(t.lastActivity)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-sm text-wa-secondary">
                          {t.preview}
                        </span>
                        {t.count > 0 && !active && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-wa-green px-1.5 text-[11px] font-semibold text-white">
                            {t.count}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
