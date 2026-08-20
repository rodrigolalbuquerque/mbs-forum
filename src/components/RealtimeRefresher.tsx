"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { onIdle, cancelIdle } from "@/lib/idle";

// Escuta mudanças em posts/comments via Supabase Realtime e atualiza os dados
// do servidor (router.refresh). A conexão é adiada para depois do carregamento
// (não pesa no primeiro paint) e o supabase-js é importado dinamicamente para
// sair do bundle inicial. Fecha o WebSocket ao sair da página para não impedir
// o back/forward cache (bfcache).
export default function RealtimeRefresher() {
  const router = useRouter();

  useEffect(() => {
    let supabase: SupabaseClient | undefined;
    let channel: RealtimeChannel | undefined;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const refresh = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => router.refresh(), 250);
    };

    async function subscribe() {
      if (cancelled || channel) return;
      if (!supabase) {
        const { createClient } = await import("@/lib/supabase/client");
        if (cancelled) return;
        supabase = createClient();
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) supabase.realtime.setAuth(session.access_token);

      channel = supabase
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
        )
        .subscribe();
    }

    function teardown() {
      if (supabase && channel) supabase.removeChannel(channel);
      channel = undefined;
      supabase?.realtime.disconnect();
    }

    // bfcache: ao sair, fecha o socket; ao voltar do cache, reabre e atualiza.
    const onPageHide = () => teardown();
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        router.refresh();
        subscribe();
      }
    };

    // Conecta só quando o navegador estiver ocioso.
    const idleId = onIdle(() => subscribe());
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      cancelled = true;
      cancelIdle(idleId);
      clearTimeout(refreshTimer);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      teardown();
    };
  }, [router]);

  return null;
}
