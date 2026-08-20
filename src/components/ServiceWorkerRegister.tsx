"use client";

import { useEffect } from "react";
import { onIdle, cancelIdle } from "@/lib/idle";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Registrar o SW não é crítico para o primeiro paint — faz no ocioso.
    const id = onIdle(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Falha ao registrar é silenciosa: o app segue funcionando.
      });
    });
    return () => cancelIdle(id);
  }, []);

  return null;
}
