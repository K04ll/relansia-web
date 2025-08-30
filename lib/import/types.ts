export type CsvRow = {
  external_id?: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  amount?: string | number;     // e.g. "49.90"
  amount_cents?: string | number;
  currency?: string;            // e.g. "EUR"
  purchased_at?: string;        // ISO or yyyy-mm-dd
  date?: string;
};

export type UpsertResult = {
  insertedClients: number;
  updatedClients: number;
  insertedPurchases: number;
  updatedPurchases: number;
  plannedReminders: number;
  invalidRows: number;
};
