import { describe, it, expect } from "vitest";
import { render } from "@react-email/render";
import { ReminderJ1, ReminderJ7, ReminderJ30 } from "@/emails";

// Tokens communs
const tokens = {
  firstName: "Camille",
  storeName: "Relansia Demo Shop",
  offer: "https://relansia.com/offre",
  signature: "L’équipe Relansia",
  unsubscribeUrl: "https://relansia-web.vercel.app/api/unsub/123",
};

// Helper: retire les commentaires HTML ajoutés par @react-email/render
function stripHtmlComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, "").trim();
}

describe("Email templates", () => {
  it("renders J+1 correctly", async () => {
    const raw = await render(<ReminderJ1 {...tokens} />);
    const html = stripHtmlComments(raw); // ✅ nettoie `<!-- -->`
    expect(html).toContain("Bonjour Camille");
    expect(html).toContain(tokens.unsubscribeUrl);
  });

  it("renders J+7 correctly", async () => {
    const html = await render(<ReminderJ7 {...tokens} />);
    expect(html).toContain("On pense à toi");
    expect(html).toContain(tokens.storeName);
  });

  it("renders J+30 correctly", async () => {
    const html = await render(<ReminderJ30 {...tokens} />);
    expect(html).toContain("tu nous manques");
    expect(html).toContain(tokens.offer!);
  });

  it("fallback text contains greeting without tags", async () => {
    const raw = await render(<ReminderJ1 {...tokens} />);
    const html = stripHtmlComments(raw);
    const text = html.replace(/<[^>]+>/g, "");
    expect(text).toContain("Bonjour Camille");
    expect(text).not.toMatch(/<h1>/);
  });

  it("dark mode friendly (no forced white bg)", async () => {
    const html = await render(<ReminderJ7 {...tokens} />);
    expect(html).not.toContain("background:#fff");
  });
});
