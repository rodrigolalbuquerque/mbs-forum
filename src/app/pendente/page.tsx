import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions";

export default async function PendingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, approved")
    .eq("id", user.id)
    .single();

  // Já aprovado? Vai para o app.
  if (profile?.approved) redirect("/");

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center bg-wa-panel px-6 py-10 text-center">
      <div className="absolute inset-x-0 top-0 h-40 bg-wa-green-dark" />

      <div className="z-10 w-full max-w-sm rounded-2xl bg-white p-7 shadow-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        </div>
        <h1 className="mt-4 text-xl font-bold text-[#111b21]">
          Conta aguardando aprovação
        </h1>
        <p className="mt-2 text-sm text-wa-secondary">
          Sua conta{profile?.name ? ` (${profile.name})` : ""} foi criada e está
          esperando a liberação de um administrador. Você receberá acesso assim
          que for aprovada.
        </p>

        <form action={signOut} className="mt-6">
          <button className="w-full rounded-full bg-wa-green px-5 py-2.5 text-sm font-medium text-white transition hover:bg-wa-green-dark">
            Sair
          </button>
        </form>
      </div>
    </main>
  );
}
