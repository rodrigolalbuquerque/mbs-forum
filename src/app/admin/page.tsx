import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";
import { setApproval, signOut } from "@/lib/actions";

type Row = {
  id: string;
  name: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  approved: boolean;
  is_admin: boolean;
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) redirect("/");

  const { data } = await supabase
    .from("profiles")
    .select("id, name, display_name, avatar_url, email, approved, is_admin")
    .order("approved", { ascending: true })
    .order("name", { ascending: true });
  const users = (data ?? []) as Row[];

  const pendentes = users.filter((u) => !u.approved).length;

  return (
    <main className="min-h-dvh bg-wa-panel">
      {/* Cabeçalho */}
      <header className="flex items-center gap-3 bg-wa-green-dark px-4 py-3 text-white">
        <Link
          href="/"
          title="Voltar ao app"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M15.5 4l-8 8 8 8 1.4-1.4L10.3 12l6.6-6.6z" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="font-semibold">Administração</h1>
          <p className="text-xs text-white/80">
            {users.length} usuário{users.length === 1 ? "" : "s"} ·{" "}
            {pendentes} aguardando aprovação
          </p>
        </div>
        <form action={signOut}>
          <button className="rounded-full px-3 py-1.5 text-sm hover:bg-white/10">
            Sair
          </button>
        </form>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-5">
        <ul className="flex flex-col gap-2">
          {users.map((u) => {
            const display = u.display_name || u.name;
            return (
              <li
                key={u.id}
                className="flex items-center gap-3 rounded-xl border border-wa-panelborder bg-white p-3"
              >
                <Avatar name={display} src={u.avatar_url} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-[#111b21]">
                      {display}
                    </span>
                    {u.is_admin && (
                      <span className="rounded-full bg-wa-green/15 px-2 py-0.5 text-[10px] font-medium text-wa-green-dark">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-wa-secondary">
                    @{u.name}
                    {u.email ? ` · ${u.email}` : ""}
                  </p>
                </div>

                {u.is_admin ? (
                  <span className="shrink-0 text-xs font-medium text-wa-green-dark">
                    Aprovado
                  </span>
                ) : u.approved ? (
                  <form action={setApproval.bind(null, u.id, false)}>
                    <button className="shrink-0 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50">
                      Revogar
                    </button>
                  </form>
                ) : (
                  <form action={setApproval.bind(null, u.id, true)}>
                    <button className="shrink-0 rounded-full bg-wa-green px-4 py-1.5 text-xs font-medium text-white transition hover:bg-wa-green-dark">
                      Aprovar
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
