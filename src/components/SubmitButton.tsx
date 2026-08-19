"use client";

import { useFormStatus } from "react-dom";

// Botão de submit que se desabilita enquanto a ação do formulário roda,
// evitando envios duplicados por cliques repetidos.
export default function SubmitButton({
  children,
  pendingLabel,
  className,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  pendingLabel?: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      aria-label={ariaLabel}
      className={`${className ?? ""} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
