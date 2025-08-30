// lib/import/parseCsv.ts
import { parse } from "csv-parse/sync";
import type { CsvRow } from "./types";

export function parseCsv(buffer: Buffer): CsvRow[] {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  // Renvoie la 1ʳᵉ valeur non vide trouvée
  const pick = (r: Record<string, string>, keys: string[]): string | undefined => {
    for (const k of keys) {
      const val = r[k];
      if (val && val.trim().length > 0) return val;
    }
    return undefined;
  };

  return records.map<CsvRow>((r) => ({
    // ⚠️ undefined (pas null) pour matcher un type optionnel
    email:      pick(r, ["email", "Email", "EMAIL"]) ?? undefined,
    phone:      pick(r, ["phone", "Phone", "Téléphone", "tel", "Tel"]) ?? undefined,
    country:    pick(r, ["country", "Country", "Pays", "ISO2"]) ?? undefined,

    // Si ton CsvRow est camelCase:
    firstName:  pick(r, ["firstName", "firstname", "First Name", "Prénom"]) ?? undefined,
    lastName:   pick(r, ["lastName", "lastname", "Last Name", "Nom"]) ?? undefined,

    orderId:    pick(r, ["orderId", "order_id", "Order ID"]) ?? undefined,
    orderDate:  pick(r, ["orderDate", "order_date", "Date"]) ?? undefined,
    orderTotal: (() => {
      const v = pick(r, ["total", "amount", "orderTotal"]);
      if (!v) return undefined;
      const n = Number(String(v).replace(",", "."));
      return Number.isFinite(n) ? n : undefined;
    })(),
    currency:   pick(r, ["currency", "devise", "Currency"]) ?? "EUR",
    storeName:  pick(r, ["store", "boutique", "storeName"]) ?? undefined,
    externalId: pick(r, ["externalId", "row_id", "_id"]) ?? undefined,
  }));
}
