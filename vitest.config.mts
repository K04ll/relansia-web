// vitest.config.mts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Environnement Node (emails/render ne nécessite pas le DOM)
    environment: "node",

    // Fichiers de setup (garde le tien)
    setupFiles: ["./tests/setup/setup.node.ts"],

    // Prend en charge .ts et .tsx (ex: render.test.tsx)
    include: ["tests/**/*.test.{ts,tsx}"], // ❌ plus de *.spec.ts


    // Qualité de vie
    passWithNoTests: true,
    testTimeout: 20000,

    // Coverage (activé via `npm run test:ci`)
    coverage: {
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      exclude: ["**/tests/**", "**/.next/**", "**/node_modules/**"],
    },

    // (Vitest 1.6+) remplace l’option dépréciée deps.inline
    server: {
      deps: {
        inline: [], // rien à inline pour ce projet
      },
    },
  },

  // Résolution des builds Vite
  resolve: {
    conditions: ["development", "browser", "module", "import"],
  },
});
