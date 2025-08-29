// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true, // ⬅ ignore toutes les erreurs ESLint au build
  },
};

export default nextConfig;
