// vitest.config.mts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    setupFiles: ["./tests/setup/setup.node.ts"],
    // ✅ Vitest ne prend que les tests unitaires
    include: ["tests/**/*.test.{ts,tsx}"],
    passWithNoTests: true,
    testTimeout: 20000,
    coverage: {
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      exclude: ["**/tests/**", "**/.next/**", "**/node_modules/**"],
    },
    // remplace l’ancienne option dépréciée
    server: { deps: { inline: [] } },
  },
  resolve: { conditions: ["development", "browser", "module", "import"] },
});
