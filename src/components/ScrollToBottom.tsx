"use client";

import { useEffect, useRef } from "react";

function getScrollParent(el: HTMLElement): HTMLElement | null {
  let node = el.parentElement;
  while (node) {
    const oy = getComputedStyle(node).overflowY;
    if ((oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

export default function ScrollToBottom({ dep }: { dep: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    const anchor = ref.current;
    if (!anchor) return;

    // Ao abrir o tópico, vai direto pro fim (sem animação).
    if (first.current) {
      first.current = false;
      anchor.scrollIntoView({ block: "end" });
      return;
    }

    // Mensagem nova chegou: só rola se o usuário já estiver perto do fim,
    // para não interromper quem está lendo o histórico mais acima.
    const scroller = getScrollParent(anchor);
    if (!scroller) {
      anchor.scrollIntoView({ block: "end", behavior: "smooth" });
      return;
    }
    const distanceFromBottom =
      scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    if (distanceFromBottom < 200) {
      anchor.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  }, [dep]);

  return <div ref={ref} />;
}
