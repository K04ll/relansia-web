import { describe, it, expect } from "vitest";
import { render } from "@react-email/render";
import { ReminderJ1, ReminderJ7, ReminderJ30 } from "@/emails"; // <— simple et robuste

const tokens = {
  firstName: "Camille",
  storeName: "Relansia Demo Shop",
  offer: "https://relansia.com/offre",
  signature: "L’équipe Relansia",
  unsubscribeUrl: "https://relansia-web.vercel.app/api/unsub/123",
};

describe("Email templates", () => {
  it("renders J+1 correctly", async () => {
    const html = await render(<ReminderJ1 {...tokens} />);
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
});
