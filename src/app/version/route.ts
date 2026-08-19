// Devolve o identificador da build que está servindo AGORA (deploy atual).
// O cliente compara com o NEXT_PUBLIC_BUILD_ID embutido na página carregada;
// se diferir, há uma versão nova publicada e ele recarrega sozinho.
export const dynamic = "force-dynamic";

export async function GET() {
  const id = process.env.VERCEL_GIT_COMMIT_SHA ?? "dev";
  return new Response(id, {
    headers: {
      "content-type": "text/plain",
      "cache-control": "no-store, max-age=0",
    },
  });
}
