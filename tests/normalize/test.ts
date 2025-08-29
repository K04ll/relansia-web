import { describe, it, expect } from "vitest";
import { normalizeEmail, normalizePhone } from "@/lib/import/normalize";

describe("normalize", () => {
  it("email lower/trim", () => {
    expect(normalizeEmail("  Foo@Bar.COM ")).toBe("foo@bar.com");
  });
  it("phone E.164 FR", () => {
    const p = normalizePhone("06 12 34 56 78", "FR");
    expect(p.e164?.startsWith("+33")).toBe(true);
    expect(p.cc).toBe("33");
    expect(p.nsn).toBe("612345678");
  });
});
