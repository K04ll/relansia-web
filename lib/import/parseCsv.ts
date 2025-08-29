import { parse } from "csv-parse/sync";
import type { ImportRow } from "./types";

export function parseCsv(buffer: Buffer): ImportRow[] {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  // mapping souple des colonnes
  const pick = (r: Record<string,string>, keys: string[]) =>
    keys.map(k => r[k])?.find(Boolean);

  return records.map((r) => ({
    email: pick(r, ["email","Email","EMAIL"]),
    phone: pick(r, ["phone","Phone","Téléphone","tel","Tel"]),
    country: pick(r, ["country","Country","Pays","ISO2"]),
    firstName: pick(r, ["firstName","firstname","First Name","Prénom"]),
    lastName: pick(r, ["lastName","lastname","Last Name","Nom"]),
    orderId: (pick(r, ["orderId","order_id","Order ID"]) || "").toString(),
    orderDate: (pick(r, ["orderDate","order_date","Date"]) || "").toString(),
    orderTotal: Number(pick(r, ["total","amount","orderTotal"]) || 0),
    currency: pick(r, ["currency","devise","Currency"]) || "EUR",
    storeName: pick(r, ["store","boutique","storeName"]),
    externalId: pick(r, ["externalId","row_id","_id"]),
  }));
}
