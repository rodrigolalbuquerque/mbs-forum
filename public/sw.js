// Service worker mínimo: torna o app instalável (PWA) e serve um
// fallback simples. Não faz cache agressivo para evitar mostrar
// conteúdo desatualizado das discussões.
const CACHE = "discussoes-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Deixa o navegador cuidar de tudo (sempre rede). O SW existe
  // principalmente para habilitar a instalação como app.
  return;
});
