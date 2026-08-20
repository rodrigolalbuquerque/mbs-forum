// Agenda trabalho não-crítico para quando o navegador estiver ocioso,
// tirando-o do caminho do carregamento inicial. Faz fallback para setTimeout
// onde requestIdleCallback não existe (ex.: Safari mais antigo).
type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

export function onIdle(cb: () => void, timeout = 2000): number {
  if (typeof window === "undefined") return 0;
  const w = window as IdleWindow;
  if (typeof w.requestIdleCallback === "function") {
    return w.requestIdleCallback(cb, { timeout });
  }
  return window.setTimeout(cb, 200);
}

export function cancelIdle(id: number): void {
  if (typeof window === "undefined") return;
  const w = window as IdleWindow;
  if (typeof w.cancelIdleCallback === "function") w.cancelIdleCallback(id);
  else clearTimeout(id);
}
