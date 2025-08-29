// tests/import-normalize.spec.ts
import { describe, it, expect } from "vitest";
import { normalizeEmail, normalizePhone, phoneDedupKey } from "../../lib/import/normalize";
describe("normalizeEmail", () => {
  it("lowercases & trims", () => {
    expect(normalizeEmail("  Foo@Bar.COM ")).toBe("foo@bar.com");
  });
});

describe("normalizePhone / phoneDedupKey", () => {
  it("parses FR numbers to E.164", () => {
    const p = normalizePhone("06 12 34 56 78", "FR");
    expect(p.e164).toMatch(/^\+33\d+/);
    const key = phoneDedupKey("06-12-34-56-78", "FR");
    expect(key).toEqual({ cc: "33", nsn: expect.any(String) });
  });
  it("returns empty for invalid phone", () => {
    const p = normalizePhone("abc", "FR");
    expect(p.e164).toBeUndefined();
  });
});
