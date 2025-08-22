import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ne bloque pas le build à cause d’erreurs eslint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ne bloque pas le build à cause d’erreurs TS
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
