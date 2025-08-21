export function parseQuantityKg(quantity: unknown): number | null {
  if (quantity == null) return null;
  if (typeof quantity === "number" && Number.isFinite(quantity)) return quantity;
  const s = String(quantity).trim().toLowerCase();
  const m = s.match(/([0-9]+(?:[.,][0-9]+)?)\s*(kg|kilog?rammes?|kilos?)?/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
export function looksLikeCroquettes(product?: string | null): boolean {
  return !!product?.toLowerCase().includes("croquette");
}
export function addDaysISO(baseISO: string, days: number): string {
  const d = new Date(baseISO); const out = new Date(d); out.setUTCDate(out.getUTCDate() + Math.max(0, Math.floor(days))); return out.toISOString();
}
export function estimateDepletionDate(opts: { product?: string|null; quantity?: number|string|null; purchased_at?: string|null; delay_days?: number|null; }): string | null {
  const purchased = opts.purchased_at ? new Date(opts.purchased_at) : null;
  if (!purchased || isNaN(purchased.getTime())) return null;
  const qkg = parseQuantityKg(opts.quantity ?? null);
  if (looksLikeCroquettes(opts.product) && qkg && qkg > 0) {
    return addDaysISO(purchased.toISOString(), (qkg * 1000) / 300);
  }
  if (opts.delay_days && opts.delay_days > 0) return addDaysISO(purchased.toISOString(), opts.delay_days);
  return null;
}
