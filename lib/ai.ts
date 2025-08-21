import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Input = {
  channel: "email" | "sms" | "whatsapp";
  first_name?: string | null;
  last_name?: string | null;
  product?: string | null;
  purchased_at?: string | null;
  shopName?: string | null;
  signature?: string | null;
  delayDays?: number | null;
};

function sanitize(s?: string | null) { return (s ?? "").trim(); }
function stripPlaceholders(txt: string) { return txt.replace(/\[[^\]\n\r]+?\]/g, "").replace(/\s{2,}/g, " ").trim(); }

function buildContext(i: Input) {
  const first = sanitize(i.first_name);
  const last = sanitize(i.last_name);
  const product = sanitize(i.product);
  const shop = sanitize(i.shopName);
  const signature = sanitize(i.signature);
  const purchasedAt = sanitize(i.purchased_at);
  const who = first || last ? `${first}${first && last ? " " : ""}${last}` : "client";
  const purchasedInfo = purchasedAt ? ` (achat du ${new Date(purchasedAt).toLocaleDateString("fr-FR")})` : "";
  return { who, product, purchasedInfo, shop, signature };
}

export async function generateReminderMessage(input: Input) {
  const { who, product, purchasedInfo, shop, signature } = buildContext(input);

  const system = `
Tu es un assistant copywriting FR pour e-commerce.
Règles:
- Interdit: placeholders/crochets.
- Style clair, adapté au canal, orienté action.
- Personnalise si données fournies. N'invente rien.
- Utilise la signature si fournie.`.trim();

  const common = `
Contexte:
- Destinataire: ${who}
- Produit: ${product || "produit"}
- Détails achat: ${purchasedInfo || "—"}
- Boutique: ${shop || "—"}
- Signature: ${signature || "—"}`.trim();

  let instructions = "";
  if (input.channel === "email") {
    instructions = `Écris un EMAIL FR:
- 1ère ligne: "Objet: ..."
- 90–140 mots, 2–3 paragraphes, appel à l’action clair.
- Termine par la signature fournie, sans coordonnées inventées.`;
  } else if (input.channel === "sms") {
    instructions = `Écris un SMS FR (≤160c), direct, mention produit + next step, termine par nom boutique si dispo.`;
  } else {
    instructions = `Écris un WhatsApp FR: 2–4 lignes, ton amical, max 2 émojis, termine par signature si fournie.`;
  }

  const r = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.6,
    messages: [
      { role: "system", content: system },
      { role: "user", content: `${common}\n\n${instructions}`.trim() },
    ],
  });

  return stripPlaceholders(r.choices[0]?.message?.content?.trim() ?? "");
}
