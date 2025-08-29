export type ImportRow = {
  email?: string;
  phone?: string;
  country?: string;       // ISO2 (ex: "FR") pour parsing tel
  firstName?: string;
  lastName?: string;
  orderId: string;
  orderDate: string;      // ISO8601
  orderTotal?: number;
  currency?: string;      // "EUR" par défaut
  storeName?: string;
  externalId?: string;    // identifiant ligne/source si dispo
};
