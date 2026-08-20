import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Identificador desta build (SHA do commit na Vercel; timestamp em dev).
    // Usado pelo auto-atualizador para detectar versões novas publicadas.
    NEXT_PUBLIC_BUILD_ID:
      process.env.VERCEL_GIT_COMMIT_SHA ?? `dev-${Date.now()}`,
  },
  experimental: {
    // Mantém no cache do Router os tópicos visitados por 30s → voltar a um
    // tópico recente é instantâneo (sem novo ida-e-volta ao servidor).
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;
