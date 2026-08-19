import Link from "next/link";
import { createPost } from "@/lib/actions";

export default function NewTopicPage() {
  return (
    <div className="flex h-full w-full flex-col">
      {/* Cabeçalho */}
      <header className="flex items-center gap-3 bg-wa-panel px-3 py-3 md:px-4">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full text-wa-secondary hover:bg-black/5"
          aria-label="Voltar"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M15.5 4l-8 8 8 8 1.4-1.4L10.3 12l6.6-6.6z" />
          </svg>
        </Link>
        <h1 className="font-medium text-[#111b21]">Novo tópico</h1>
      </header>

      {/* Formulário */}
      <div className="wa-chat-bg flex-1 overflow-y-auto px-4 py-8 md:px-16">
        <form
          action={createPost}
          className="mx-auto flex max-w-xl flex-col gap-4 rounded-xl bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-[#111b21]">
              Assunto
            </label>
            <input
              name="title"
              required
              maxLength={200}
              autoFocus
              placeholder="Sobre o que é a discussão?"
              className="w-full rounded-lg border border-wa-panelborder px-3 py-2.5 text-sm outline-none focus:border-wa-green"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#111b21]">
              Mensagem de abertura
            </label>
            <textarea
              name="body"
              rows={6}
              placeholder="Explique o contexto, a pergunta ou a proposta... (opcional)"
              className="w-full resize-y rounded-lg border border-wa-panelborder px-3 py-2.5 text-sm outline-none focus:border-wa-green"
            />
          </div>
          <button
            type="submit"
            className="self-start rounded-full bg-wa-green px-6 py-2.5 text-sm font-medium text-white transition hover:bg-wa-green-dark"
          >
            Criar tópico
          </button>
        </form>
      </div>
    </div>
  );
}
