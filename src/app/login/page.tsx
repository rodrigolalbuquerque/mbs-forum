"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInstall, setShowInstall] = useState(false);

  // Convite de instalação só no celular e quando ainda não está instalado.
  useEffect(() => {
    const ua = navigator.userAgent;
    const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setShowInstall(isMobile && !standalone);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (mode === "login") {
      // Aceita e-mail OU nome de usuário. Se não tiver "@", traduz
      // o nome de usuário para o e-mail correspondente no banco.
      let loginEmail = email.trim();
      if (!loginEmail.includes("@")) {
        const { data, error } = await supabase.rpc("email_for_username", {
          uname: loginEmail,
        });
        if (error || !data) {
          setError("Usuário ou senha incorretos.");
          setLoading(false);
          return;
        }
        loginEmail = data as string;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });
      if (error) {
        setError("Usuário ou senha incorretos.");
        setLoading(false);
        return;
      }
      router.replace("/");
      router.refresh();
    } else {
      if (password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("As senhas não conferem.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() } },
      });
      if (error) {
        setError(
          error.message.toLowerCase().includes("already registered")
            ? "Este e-mail já tem uma conta. Faça login."
            : error.message,
        );
        setLoading(false);
        return;
      }
      // Se a confirmação por e-mail estiver desligada, já vem sessão →
      // a tela de "aguardando aprovação" aparece pelo gate do app.
      if (data.session) {
        router.replace("/");
        router.refresh();
      } else {
        setInfo(
          "Conta criada! Confirme seu e-mail e aguarde a aprovação de um administrador.",
        );
        setMode("login");
        setLoading(false);
      }
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center bg-wa-panel px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-40 bg-wa-green-dark" />
      <div className="z-10 w-full max-w-sm rounded-xl bg-white p-7 shadow-lg">
        <div className="mb-5 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="MBS Digital"
            width={48}
            height={48}
            className="h-12 w-12 rounded-xl"
          />
          <div>
            <h1 className="text-xl font-bold text-[#111b21]">MBS Fórum</h1>
            <p className="text-sm text-wa-secondary">
              {mode === "login"
                ? "Entre para participar dos debates."
                : "Crie sua conta (acesso liberado por um admin)."}
            </p>
          </div>
        </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === "signup" && (
          <input
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-lg border border-wa-panelborder px-3 py-2.5 text-sm text-[#111b21] outline-none focus:border-wa-green"
          />
        )}
        <input
          type={mode === "login" ? "text" : "email"}
          placeholder={
            mode === "login" ? "E-mail ou nome de usuário" : "E-mail"
          }
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete={mode === "login" ? "username" : "email"}
          className="rounded-lg border border-wa-panelborder px-3 py-2.5 text-sm text-[#111b21] outline-none focus:border-wa-green"
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="rounded-lg border border-wa-panelborder px-3 py-2.5 text-sm text-[#111b21] outline-none focus:border-wa-green"
        />
        {mode === "signup" && (
          <input
            type="password"
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="rounded-lg border border-wa-panelborder px-3 py-2.5 text-sm text-[#111b21] outline-none focus:border-wa-green"
          />
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-wa-green-dark">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-full bg-wa-green px-4 py-2.5 text-sm font-medium text-white transition hover:bg-wa-green-dark disabled:opacity-50"
        >
          {loading
            ? "Aguarde..."
            : mode === "login"
              ? "Entrar"
              : "Criar conta"}
        </button>
      </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setInfo(null);
          }}
          className="mt-4 block w-full text-center text-sm text-wa-green-dark hover:underline"
        >
          {mode === "login"
            ? "Não tem conta? Criar conta"
            : "Já tem conta? Entrar"}
        </button>

        {showInstall && (
          <a
            href="/instalar"
            className="mt-4 flex items-center justify-center gap-1.5 border-t border-wa-panelborder pt-3 text-xs text-wa-secondary hover:text-wa-green-dark"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path d="M12 3v10.6l3.3-3.3 1.4 1.4L12 17.4 6.3 11.7l1.4-1.4L11 13.6V3h1zM5 19h14v2H5z" />
            </svg>
            Instalar o app no celular
          </a>
        )}
      </div>
    </main>
  );
}
