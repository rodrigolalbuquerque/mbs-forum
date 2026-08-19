import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rotas que podem ser acessadas sem login.
const PUBLIC_PATHS = ["/login", "/instalar"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  // Deslogado: no mobile mostra a tela de instalação; no desktop vai ao login.
  if (!user && !isPublic) {
    const ua = request.headers.get("user-agent") ?? "";
    const isMobile =
      /android|iphone|ipad|ipod|mobile|blackberry|iemobile|opera mini/i.test(ua);
    const url = request.nextUrl.clone();
    url.pathname = isMobile ? "/instalar" : "/login";
    return NextResponse.redirect(url);
  }

  // Logado não precisa ver login/instalar.
  if (user && (path === "/login" || path === "/instalar")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Roda em tudo menos arquivos estáticos, imagens e o manifesto/SW do PWA.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
