"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Falha ao registrar o service worker é silenciosa: o app segue
        // funcionando normalmente, só não fica disponível offline.
      });
    }
  }, []);

  return null;
}
