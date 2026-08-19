export default function HomePlaceholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center border-b-4 border-wa-green bg-wa-panel px-8 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="MBS Digital"
        width={112}
        height={112}
        className="h-28 w-28 rounded-3xl shadow-sm"
      />
      <h1 className="mt-6 text-2xl font-light text-[#41525d]">MBS Fórum</h1>
      <p className="mt-3 max-w-sm text-sm text-wa-secondary">
        Selecione um tópico à esquerda para ver a conversa, ou toque em{" "}
        <strong>+</strong> para abrir um novo debate.
      </p>
      <p className="mt-8 flex items-center gap-1.5 text-xs text-wa-secondary">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
          <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8H9V6a3 3 0 016 0v3z" />
        </svg>
        As decisões do grupo ficam registradas aqui.
      </p>
    </div>
  );
}
