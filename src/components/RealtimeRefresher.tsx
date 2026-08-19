"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Escuta mudanças em posts/comments via Supabase Realtime e atualiza
// os dados do servidor (router.refresh). Como a rota inteira é
// re-renderizada, tanto a lista lateral quanto a conversa aberta
// ficam ao vivo, sem recarregar a página.
export default function RealtimeRefresher() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 250);
    };

    // Nome único por montagem evita reaproveitar um canal já inscrito
    // (que causaria erro no Strict Mode ao remontar).
    const channel = supabase
      .channel(`forum-changes-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        refresh,
      );

    // As tabelas têm RLS (leitura só para authenticated), então o
    // Realtime precisa do token do usuário para entregar os eventos.
    // Definimos o token ANTES de inscrever.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) supabase.realtime.setAuth(session.access_token);
      channel.subscribe();
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
