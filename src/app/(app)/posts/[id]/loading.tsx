// Esqueleto exibido instantaneamente ao abrir/trocar de tópico, enquanto os
// dados do servidor chegam. Mantém a mesma moldura do chat para não "pular".
export default function Loading() {
  return (
    <div className="flex h-full w-full min-w-0 flex-col">
      <header className="flex items-center gap-3 bg-wa-panel px-3 py-2.5 md:px-4">
        <div className="h-5 w-44 animate-pulse rounded bg-black/10" />
      </header>

      <div className="wa-chat-bg flex-1 overflow-hidden px-3 py-4 md:px-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          <div className="flex justify-start">
            <div className="h-16 w-3/5 animate-pulse rounded-lg bg-white/70" />
          </div>
          <div className="flex justify-end">
            <div className="h-10 w-2/5 animate-pulse rounded-lg bg-wa-bubbleout/70" />
          </div>
          <div className="flex justify-start">
            <div className="h-12 w-1/2 animate-pulse rounded-lg bg-white/70" />
          </div>
          <div className="flex justify-end">
            <div className="h-8 w-1/3 animate-pulse rounded-lg bg-wa-bubbleout/70" />
          </div>
        </div>
      </div>

      <footer className="bg-wa-panel px-3 py-2.5 md:px-4">
        <div className="mx-auto h-11 max-w-3xl animate-pulse rounded-2xl bg-white" />
      </footer>
    </div>
  );
}
