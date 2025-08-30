// lib/import/upsert.ts
import { createClient } from '@supabase/supabase-js';
import type { CsvRow, UpsertResult } from './types';

// service role (server-side only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

export async function upsertClientAndPurchase(
  userId: string,
  row: CsvRow
): Promise<{ clientId?: string; purchaseInserted: boolean }> {
  let clientId: string | undefined;

  // -------- Client par email --------
  if (row.email) {
    const { data } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .eq('email', row.email)
      .maybeSingle();

    if (data?.id) {
      clientId = data.id;
      await supabase.from('clients').update({
        phone: row.phone ?? undefined,
        first_name: row.first_name ?? undefined,
        last_name: row.last_name ?? undefined,
      }).eq('id', clientId);
    }
  }

  // -------- Client par phone --------
  if (!clientId && row.phone) {
    const { data } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .eq('phone', row.phone)
      .maybeSingle();

    if (data?.id) {
      clientId = data.id;
      await supabase.from('clients').update({
        email: row.email ?? undefined,
        first_name: row.first_name ?? undefined,
        last_name: row.last_name ?? undefined,
      }).eq('id', clientId);
    }
  }

  // -------- Insert client --------
  if (!clientId) {
    const ins = await supabase.from('clients').insert({
      user_id: userId,
      email: row.email ?? null,
      phone: row.phone ?? null,
      first_name: row.first_name ?? null,
      last_name: row.last_name ?? null,
    }).select('id').single();
    clientId = ins.data?.id;
  }

  if (!clientId) return { purchaseInserted: false };

  // -------- Purchase --------
  let purchaseInserted = false;
  if (row.external_id) {
    const { data: existing } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('external_id', row.external_id)
      .maybeSingle();

    if (!existing) {
      await supabase.from('purchases').insert({
        user_id: userId,
        client_id: clientId,
        external_id: row.external_id,
        amount_cents: row.amount_cents ?? null,
        currency: row.currency ?? 'EUR',
        purchased_at: row.purchased_at ?? new Date().toISOString(),
      });
      purchaseInserted = true;
    } else {
      await supabase.from('purchases').update({
        client_id: clientId,
        amount_cents: row.amount_cents ?? null,
        currency: row.currency ?? 'EUR',
        purchased_at: row.purchased_at ?? new Date().toISOString(),
      }).eq('id', existing.id);
    }
  } else {
    await supabase.from('purchases').insert({
      user_id: userId,
      client_id: clientId,
      amount_cents: row.amount_cents ?? null,
      currency: row.currency ?? 'EUR',
      purchased_at: row.purchased_at ?? new Date().toISOString(),
    });
    purchaseInserted = true;
  }

  return { clientId, purchaseInserted };
}

export async function planDefaultReminders(userId: string, clientId: string) {
  const now = new Date();
  const addDays = (d: number) =>
    new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString();

  const { data: client } = await supabase
    .from('clients')
    .select('email, phone')
    .eq('id', clientId)
    .single();

  const channel: 'email' | 'sms' =
    client?.email ? 'email' : client?.phone ? 'sms' : 'email';

  await supabase.from('reminders').insert([
    {
      user_id: userId,
      client_id: clientId,
      channel,
      message: null,
      status: 'scheduled',
      scheduled_at: addDays(1),
      retry_count: 0,
      next_attempt_at: addDays(1),
    },
    {
      user_id: userId,
      client_id: clientId,
      channel,
      message: null,
      status: 'scheduled',
      scheduled_at: addDays(7),
      retry_count: 0,
      next_attempt_at: addDays(7),
    },
    {
      user_id: userId,
      client_id: clientId,
      channel,
      message: null,
      status: 'scheduled',
      scheduled_at: addDays(30),
      retry_count: 0,
      next_attempt_at: addDays(30),
    },
  ]);
}

export async function upsertRows(
  userId: string,
  rows: CsvRow[],
  source: 'upload' | 'url'
): Promise<UpsertResult> {
  let insertedClients = 0,
    updatedClients = 0,
    insertedPurchases = 0,
    updatedPurchases = 0,
    plannedReminders = 0,
    invalidRows = 0;

  for (const r of rows) {
    if (!r.email && !r.phone) {
      invalidRows++;
      continue;
    }

    const beforeClient = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .or(
        `email.eq.${r.email ?? '___'},phone.eq.${
          r.phone ?? '___'
        }`.replace('___', '__null__')
      )
      .limit(1);

    const { clientId, purchaseInserted } = await upsertClientAndPurchase(userId, r);

    if (clientId) {
      const existedBefore = Boolean(beforeClient.data && beforeClient.data.length > 0);
      if (existedBefore) updatedClients++;
      else insertedClients++;
    }

    if (r.external_id) {
      const check = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', userId)
        .eq('external_id', r.external_id)
        .maybeSingle();

      if (check?.data?.id) {
        if (purchaseInserted) insertedPurchases++;
        else updatedPurchases++;
      }
    } else {
      if (purchaseInserted) insertedPurchases++;
    }

    if (purchaseInserted && clientId) {
      await planDefaultReminders(userId, clientId);
      plannedReminders += 3;
    }
  }

  await supabase.from('import_logs').insert({
    user_id: userId,
    source,
    stats: {
      insertedClients,
      updatedClients,
      insertedPurchases,
      updatedPurchases,
      plannedReminders,
      invalidRows,
    },
  });

  return {
    insertedClients,
    updatedClients,
    insertedPurchases,
    updatedPurchases,
    plannedReminders,
    invalidRows,
  };
}

/**
 * ✅ Alias pratique pour la route d’upload
 * Retourne { customersUpserted, purchasesUpserted, remindersCreated }
 */
export async function upsertRow(userId: string, row: CsvRow) {
  const r = await upsertRows(userId, [row], 'upload');
  return {
    customersUpserted: r.insertedClients + r.updatedClients,
    purchasesUpserted: r.insertedPurchases + r.updatedPurchases,
    remindersCreated: r.plannedReminders,
  };
}
