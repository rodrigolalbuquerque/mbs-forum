"use client";

import { useEffect } from "react";
import { onIdle, cancelIdle } from "@/lib/idle";

// Mantém o app sempre na versão mais nova: verifica periodicamente (e ao
// reabrir/focar) qual build está publicada; se for diferente da carregada,
// recarrega a página automaticamente. A checagem começa após o carregamento
// (ocioso) para não competir com o primeiro paint.
export default function VersionWatcher() {
  useEffect(() => {
    const current = process.env.NEXT_PUBLIC_BUILD_ID;
    // Só atua em produção (na Vercel o id é o SHA do commit).
    if (!current || current.startsWith("dev")) return;

    let stopped = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    async function check() {
      try {
        const res = await fetch("/version", { cache: "no-store" });
        if (!res.ok) return;
        const latest = (await res.text()).trim();
        if (!latest || latest === current || stopped) return;

        // Evita loop caso o recarregamento não resolva (ex.: cache de borda).
        const key = "mbs-reloaded-for";
        if (sessionStorage.getItem(key) === latest) return;
        sessionStorage.setItem(key, latest);

        window.location.reload();
      } catch {
        // sem rede / offline: ignora
      }
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };

    const idleId = onIdle(() => {
      check();
      interval = setInterval(check, 60_000);
      document.addEventListener("visibilitychange", onVisible);
    });

    return () => {
      stopped = true;
      cancelIdle(idleId);
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
