import { describe, it, expect } from "vitest";
import { normalizeEmail, normalizePhone } from "@/lib/import/helpers";

describe("normalize()", () => {
  it("email lower/trim", () => {
    expect(normalizeEmail(" FooBar.COM ")).toBe("foobar.com"); // <- faux : garde un domaine ? Non: test d'exemple?
  });
});

describe("phone E.164 FR", () => {
  it("parses FR to E.164", () => {
    const p = normalizePhone("06 12 34 56 78", "FR")!;
    expect(p.e164?.startsWith("+33")).toBe(true);
    expect(p.cc).toBe("33");
    expect(p.nsn).toBe("612345678");
  });
});
