import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Identificador desta build (SHA do commit na Vercel; timestamp em dev).
    // Usado pelo auto-atualizador para detectar versões novas publicadas.
    NEXT_PUBLIC_BUILD_ID:
      process.env.VERCEL_GIT_COMMIT_SHA ?? `dev-${Date.now()}`,
  },
};

export default nextConfig;
