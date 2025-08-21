// lib/text/format.ts
export type BrandingMode = "relansia" | "store" | "both" | "none";

export type FormatInput = {
  shopName?: string | null;
  signature?: string | null;
  brandingPrefixMode?: BrandingMode;
  baseMessage: string;
};

function trimLines(s: string) {
  return s
    .split(/\r?\n/g)
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
}

export function buildOutboundText(input: FormatInput) {
  const { shopName, signature, brandingPrefixMode = "store", baseMessage } = input;

  const clean = trimLines(baseMessage);

  const prefix =
    brandingPrefixMode === "none"
      ? ""
      : brandingPrefixMode === "relansia"
      ? "【RELANSIA】 "
      : brandingPrefixMode === "both"
      ? `【${shopName || "Boutique"}｜RELANSIA】 `
      : `【${shopName || "Boutique"}】 `;

  const withPrefix = `${prefix}${clean}`;

  const withSignature =
    signature && signature.trim().length > 0
      ? `${withPrefix}\n\n— ${signature.trim()}`
      : withPrefix;

  const html = `<p>${withSignature
    .split("\n")
    .map((l) => l.replace(/</g, "&lt;").replace(/>/g, "&gt;"))
    .join("<br/>")}</p>`;

  return { text: withSignature, html };
}
