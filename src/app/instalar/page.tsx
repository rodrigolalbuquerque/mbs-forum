"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [showGenericHelp, setShowGenericHelp] = useState(false);

  useEffect(() => {
    // Já instalado (rodando como app) -> vai direto para o login.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (standalone) {
      router.replace("/login");
      return;
    }

    const ua = navigator.userAgent;
    const ios =
      /iphone|ipad|ipod/i.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    // Tela de instalação é só para celular; no desktop vai direto ao login.
    const isMobile =
      /android|iphone|ipad|ipod|mobile|blackberry|iemobile|opera mini/i.test(
        ua,
      ) || ios;
    if (!isMobile) {
      router.replace("/login");
      return;
    }

    setIsIOS(ios);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => router.replace("/login");

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    setReady(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [router]);

  async function handleInstall() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      return;
    }
    if (isIOS) {
      setShowIOSHelp(true);
      return;
    }
    setShowGenericHelp(true);
  }

  // Evita "piscar" a tela antes de decidir se redireciona.
  if (!ready) return null;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center bg-wa-panel px-6 py-10 text-center">
      <div className="absolute inset-x-0 top-0 h-44 bg-wa-green-dark" />

      <div className="z-10 flex w-full max-w-sm flex-col items-center rounded-2xl bg-white p-7 shadow-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="MBS Fórum"
          width={96}
          height={96}
          className="h-24 w-24 rounded-2xl shadow-sm"
        />
        <h1 className="mt-4 text-2xl font-bold text-[#111b21]">MBS Fórum</h1>
        <p className="mt-2 text-sm text-wa-secondary">
          Instale o app no seu celular para abrir com um toque, direto da tela
          inicial — como qualquer aplicativo.
        </p>

        <button
          onClick={handleInstall}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-wa-green px-5 py-3 font-medium text-white transition hover:bg-wa-green-dark"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 3v10.6l3.3-3.3 1.4 1.4L12 17.4 6.3 11.7l1.4-1.4L11 13.6V3h1zM5 19h14v2H5z" />
          </svg>
          Instalar app
        </button>

        <Link
          href="/login"
          className="mt-3 w-full rounded-full px-5 py-3 text-sm font-medium text-wa-green-dark transition hover:bg-wa-green/10"
        >
          Já instalei — quero entrar
        </Link>

        {/* Instruções iOS (Safari não permite instalar por botão) */}
        {(showIOSHelp || isIOS) && (
          <div className="mt-5 w-full rounded-xl bg-wa-panel p-4 text-left text-sm text-[#111b21]">
            <p className="font-medium">No iPhone/iPad (Safari):</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-wa-secondary">
              <li>
                Toque no botão <strong>Compartilhar</strong> (o quadrado com a
                seta para cima).
              </li>
              <li>
                Escolha <strong>Adicionar à Tela de Início</strong>.
              </li>
              <li>
                Confirme em <strong>Adicionar</strong>.
              </li>
            </ol>
          </div>
        )}

        {/* Fallback genérico (navegador sem instalação por botão) */}
        {showGenericHelp && !isIOS && (
          <div className="mt-5 w-full rounded-xl bg-wa-panel p-4 text-left text-sm text-wa-secondary">
            Para instalar, abra o menu do navegador (⋮) e toque em{" "}
            <strong className="text-[#111b21]">Instalar app</strong> ou{" "}
            <strong className="text-[#111b21]">
              Adicionar à tela inicial
            </strong>
            .
          </div>
        )}
      </div>

      <p className="z-10 mt-4 text-xs text-wa-secondary">
        É rápido e ocupa pouco espaço no celular.
      </p>
    </main>
  );
}
