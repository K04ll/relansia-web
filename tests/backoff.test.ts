import { describe, it, expect } from "vitest";
// Chemin via alias TS => fonctionne grâce à vite-tsconfig-paths
import { nextBackoffMs } from "../lib/worker/backoff";


describe("nextBackoffMs", () => {
  it("grandit exponentiellement et reste borné", () => {
    const a0 = nextBackoffMs(0);
    const a3 = nextBackoffMs(3);
    const a8 = nextBackoffMs(8);
    expect(a0).toBeGreaterThan(0);
    expect(a3).toBeGreaterThan(a0);
    expect(a8).toBeLessThanOrEqual(21_600_000); // 6h
  });

  it("ajoute du jitter", () => {
    const set = new Set(Array.from({ length: 6 }, () => nextBackoffMs(2)));
    expect(set.size).toBeGreaterThan(1);
  });
});
