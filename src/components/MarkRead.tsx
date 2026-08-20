"use client";

import { useEffect } from "react";
import { markTopicRead } from "@/lib/actions";

// Marca o tópico como lido ao abrir e sempre que chega mensagem nova enquanto
// está aberto (via `signal`), para o badge de não-lidas sumir e não voltar.
export default function MarkRead({
  postId,
  signal,
}: {
  postId: string;
  signal: string | number;
}) {
  useEffect(() => {
    markTopicRead(postId).catch(() => {});
  }, [postId, signal]);

  return null;
}
