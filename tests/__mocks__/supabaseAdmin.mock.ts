// tests/__mocks__/supabaseAdmin.mock.ts
import { randomUUID } from "node:crypto";

type Row = Record<string, any>;

export function createMockClient() {
  const customers: Row[] = [];
  const purchases: Row[] = [];
  const reminders: Row[] = [];

  function selectCols<T extends Row>(rows: T[], cols: string | "*") {
    if (cols === "*" || !cols) return rows;
    const wanted = cols.split(",").map((s) => s.trim());
    return rows.map((r) => {
      const o: Row = {};
      for (const k of wanted) o[k] = r[k];
      return o as T;
    });
  }

  function tableAPI(table: "customers" | "purchases" | "reminders") {
    const store = table === "customers" ? customers : table === "purchases" ? purchases : reminders;

    let _cols: string | "*" = "*";
    let _filters: ((r: Row) => boolean)[] = [];

    const api = {
      select(cols: string) {
        _cols = cols;
        return this;
      },
      eq(field: string, val: any) {
        _filters.push((r: Row) => r[field] === val);
        return this;
      },
      or(preds: string) {
        const parts = preds.split(",").filter(Boolean);
        _filters.push((r: Row) =>
          parts.some((p) => {
            const ands = p.split("and").map((s) => s.trim()).filter(Boolean);
            if (ands.length > 1) {
              return ands.every((a) => {
                const m = a.match(/(\w+)\.eq\.(.+)/);
                return !!(m && r[m[1]] === m[2]);
              });
            } else {
              const m = p.match(/(\w+)\.eq\.(.+)/);
              return !!(m && r[m[1]] === m[2]);
            }
          })
        );
        return this;
      },
      async single() {
        const rows = store.filter((r) => _filters.every((f) => f(r)));
        const row = rows[0] ? selectCols([rows[0]], _cols)[0] : null;
        return { data: row, error: null };
      },
      async insert(row: Row) {
        const id = row.id ?? randomUUID();
        const ins = { ...row, id };
        store.push(ins);
        return {
          data: selectCols([ins], _cols),
          error: null,
          select: (_: string) => ({
            single: async () => ({ data: { id }, error: null }),
          }),
        };
      },
      async update(row: Row) {
        const rows = store.filter((r) => _filters.every((f) => f(r)));
        for (const r of rows) {
          for (const [k, v] of Object.entries(row)) {
            if (v !== undefined) (r as any)[k] = v;
          }
        }
        return { data: selectCols(rows, _cols), error: null };
      },
      async upsert(row: Row, _opts?: any) {
        if (table === "purchases") {
          const key = (r: Row) => `${r.user_id}|${r.customer_id}|${r.order_id}|${r.order_date}`;
          const idx = store.findIndex((r) => key(r) === key(row));
          if (idx >= 0) {
            store[idx] = { ...store[idx], ...row };
            const id = store[idx].id ?? (store[idx].id = randomUUID());
            return {
              data: selectCols([store[idx]], _cols),
              error: null,
              select: (_: string) => ({ single: async () => ({ data: { id }, error: null }) }),
            };
          }
        }
        const id = randomUUID();
        const ins = { ...row, id };
        store.push(ins);
        return {
          data: selectCols([ins], _cols),
          error: null,
          select: (_: string) => ({ single: async () => ({ data: { id }, error: null }) }),
        };
      },
    };

    return api;
  }

  const client = {
    __tables: { customers, purchases, reminders },
    from: (t: "customers" | "purchases" | "reminders") => tableAPI(t),
    rpc(name: string, args: any) {
      if (name !== "plan_reminders_for_purchase") return { data: null, error: `rpc ${name} not implemented` };
      const { p_user_id, p_purchase_id } = args;
      const purchase = purchases.find((p) => p.id === p_purchase_id && p.user_id === p_user_id);
      if (!purchase) return { data: [{ count: 0 }], error: null };

      const offsets = [1, 7, 30];
      let created = 0;

      const customer = customers.find((c) => c.id === purchase.customer_id);
      const to = customer?.email ?? null;

      for (const od of offsets) {
        const key =
          `${p_user_id}|${purchase.customer_id}|${p_purchase_id}|email|` + String(od);
        const dup = reminders.find(
          (r) => `${r.user_id}|${r.customer_id}|${r.purchase_id}|${r.channel}|${r.offset_days}` === key
        );
        if (!dup) {
          reminders.push({
            id: randomUUID(),
            user_id: p_user_id,
            customer_id: purchase.customer_id,
            purchase_id: p_purchase_id,
            channel: "email",
            status: "pending",
            scheduled_at: new Date(new Date(purchase.order_date).getTime() + od * 86400000).toISOString(),
            tz: "Europe/Paris",
            window_start: "09:00:00",
            window_end: "20:00:00",
            offset_days: od,
            payload: { to, templateId: od === 1 ? "J+1" : od === 7 ? "J+7" : "J+30" },
          });
          created++;
        }
      }
      return { data: [{ count: created }], error: null };
    },
  };

  return client;
}
