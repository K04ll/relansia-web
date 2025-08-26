// app/api/reminders/generate/route.ts
export const runtime = 'nodejs'; // ✅ Force l'exécution côté Node (Luxon OK)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DateTime } from 'luxon';
import { parseSendWindow } from '@/lib/settings/sendWindow';
import { addDaysAndClamp } from '@/lib/time/nextValidDate';

type Body = {
  dry_run?: boolean;
  limit_clients?: number | null;
  rule_ids?: string[] | null;
  only_new_since?: string | null; // réservé V1.5 (purchases)
};

type Rule = {
  id: string;
  delay_days: number;
  channel: 'email' | 'sms' | 'whatsapp';
  template: string | null;
  position: number;
};

type ClientRow = {
  id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

// ⚠️ Adapte à ton système d’auth server (supabase-auth-helpers si tu l’utilises).
async function getUserId(req: NextRequest): Promise<string> {
  // Exemple minimal : header X-User-Id (à remplacer par ta vraie auth)
  const uid = req.headers.get('x-user-id');
  if (!uid) throw new Error('UNAUTHENTICATED');
  return uid;
}

function jsonError(code: string, message: string, status = 400) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

export async function POST(req: NextRequest) {
  let user_id: string;
  try {
    user_id = await getUserId(req);
  } catch {
    return jsonError('UNAUTHENTICATED', 'Authentication required.', 401);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  let body: Body = {};
  try {
    const parsed = await req.json();
    if (parsed && typeof parsed === 'object') body = parsed as Body;
  } catch {
    // ignore → body = {}
  }

  const dryRun = Boolean(body.dry_run);
  const limitClients = body.limit_clients ?? null;
  const ruleIds = Array.isArray(body.rule_ids) ? body.rule_ids : null;

  // 1) Charger settings (timezone + send_window)
  const { data: settings, error: errSettings } = await supabase
    .from('settings')
    .select('timezone, send_window')
    .eq('user_id', user_id)
    .maybeSingle();

  if (errSettings) return jsonError('SETTINGS_FETCH_FAILED', errSettings.message, 500);

  const timezone = settings?.timezone || 'Europe/Paris';
  const sendWindow = parseSendWindow(settings?.send_window);

  // 2) Charger règles actives
  let rulesQuery = supabase
    .from('reminder_rules')
    .select('id, delay_days, channel, template, position')
    .eq('user_id', user_id)
    .eq('enabled', true)
    .order('position', { ascending: true })
    .order('delay_days', { ascending: true });

  if (ruleIds && ruleIds.length) {
    rulesQuery = rulesQuery.in('id', ruleIds);
  }

  const { data: rules, error: errRules } = await rulesQuery as unknown as {
    data: Rule[] | null; error: any;
  };

  if (errRules) return jsonError('RULES_FETCH_FAILED', errRules.message, 500);
  if (!rules || rules.length === 0) return jsonError('MISSING_RULES', 'No enabled rules found.', 400);

  // 3) Charger clients (non-unsubscribed)
  let clientsQuery = supabase
    .from('clients')
    .select('id, email, phone, first_name, last_name')
    .eq('user_id', user_id)
    .or('unsubscribed.is.null,unsubscribed.eq.false'); // null/false => actif

  if (limitClients && limitClients > 0) {
    clientsQuery = clientsQuery.limit(limitClients);
  }

  const { data: clients, error: errClients } = await clientsQuery as unknown as {
    data: ClientRow[] | null; error: any;
  };

  if (errClients) return jsonError('CLIENTS_FETCH_FAILED', errClients.message, 500);

  // 4) Calculer scheduled_at pour chaque (client x règle)
  const nowUTC = DateTime.utc().toJSDate();
  type NewReminder = {
    user_id: string;
    client_id: string;
    rule_id: string;
    channel: 'email' | 'sms' | 'whatsapp';
    message: string | null;
    status: 'scheduled';
    scheduled_at: string;    // ISO
    next_attempt_at: string; // ISO
    retry_count: number;
  };

  const toInsert: NewReminder[] = [];
  const samples: Array<Pick<NewReminder, 'client_id' | 'rule_id' | 'channel' | 'scheduled_at'>> = [];

  for (const c of clients || []) {
    for (const r of rules) {
      // V1 : base = now ; V1.5 (purchases) : base = purchased_at
      const scheduledDate = addDaysAndClamp(nowUTC, r.delay_days ?? 0, timezone, sendWindow);
      const scheduledISO = DateTime.fromJSDate(scheduledDate).toUTC().toISO();

      const row: NewReminder = {
        user_id,
        client_id: c.id,
        rule_id: r.id,
        channel: r.channel,
        message: r.template ?? null, // V1: template brut (IA plus tard)
        status: 'scheduled',
        scheduled_at: scheduledISO!,
        next_attempt_at: scheduledISO!,
        retry_count: 0,
      };

      toInsert.push(row);
      if (samples.length < 10) {
        samples.push({
          client_id: c.id,
          rule_id: r.id,
          channel: r.channel,
          scheduled_at: scheduledISO!,
        });
      }
    }
  }

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dry_run: true,
      user_id,
      stats: {
        clients_considered: clients?.length ?? 0,
        rules_considered: rules.length,
        inserted: 0,
        updated: 0,
        skipped_existing: 0,
      },
      samples,
    });
  }

  // 5) Upsert idempotent sur (user_id, client_id, rule_id)
  // ⚠️ nécessite un index unique côté DB
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  const BATCH = 500;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const chunk = toInsert.slice(i, i + BATCH);
    const { data, error } = await supabase
      .from('reminders')
      .upsert(chunk, {
        onConflict: 'user_id,client_id,rule_id',
        ignoreDuplicates: false,
      })
      .select('id, status, scheduled_at, updated_at');

    if (error) return jsonError('REMINDERS_UPSERT_FAILED', error.message, 500);

    if (data) {
      inserted += data.length; // approximation utile (insert + update confondus)
    }
  }

  // Approx du skipped (si besoin d’un comptage exact, on peut split exist/insert)
  skipped = Math.max(0, (clients?.length ?? 0) * rules.length - inserted);

  return NextResponse.json({
    ok: true,
    dry_run: false,
    user_id,
    stats: {
      clients_considered: clients?.length ?? 0,
      rules_considered: rules.length,
      inserted,
      updated, // non différencié dans cette version
      skipped_existing: skipped,
    },
    samples,
  });
}
