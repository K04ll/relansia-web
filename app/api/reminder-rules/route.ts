// app/api/reminder-rules/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { z } from "zod";

const ruleSchema = z.object({
  id: z.string().optional(),
  delay_days: z.number().min(0),
  channel: z.enum(["email", "sms", "whatsapp"]),
  template: z.string().nullable().optional(),
  position: z.number().min(0),
  enabled: z.boolean().default(true),
});

const batchSchema = z.object({
  rules: z.array(ruleSchema),
});

function err(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

async function getUserIdOrDev() {
  // Adapte à ton auth: si tu utilises Supabase Auth Helpers côté API, remplace par la méthode officielle.
  // Ici, on suppose un user de dev pour simplifier si non connecté.
  const devUserId = process.env.DEV_USER_ID || "00000000-0000-0000-0000-000000000000";
  return devUserId;
}

export async function GET() {
  const userId = await getUserIdOrDev();
  const { data, error } = await supabaseServer
    .from("reminder_rules")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true });

  if (error) return err("db_get_failed", error.message, 500);
  return NextResponse.json({ rules: data || [] });
}

export async function POST(req: Request) {
  const userId = await getUserIdOrDev();
  const body = await req.json().catch(() => ({}));
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) return err("invalid_body", parsed.error.message);

  // Normaliser les positions 0..N-1 côté serveur
  const normalized = parsed.data.rules
    .sort((a, b) => a.position - b.position)
    .map((r, i) => ({ ...r, position: i }));

  // ⚠️ Ne PAS envoyer `id: undefined`/`null` → omettre la propriété si absente
  const upserts = normalized.map((r) => {
    const base = {
      user_id: userId,
      delay_days: r.delay_days,
      channel: r.channel,
      template: r.template ?? null,
      position: r.position,
      enabled: r.enabled ?? true,
    } as const;

    // S'il y a un id => upsert sur id ; sinon => insertion sans champ id (DEFAULT uuid)
    return r.id ? { id: r.id, ...base } : { ...base };
  });

  // Stratégie: upsert sur id (mettra à jour celles qui ont un id, et insérera les nouvelles)
  const { data, error } = await supabaseServer
    .from("reminder_rules")
    .upsert(upserts, { onConflict: "id" })
    .select("*")
    .order("position", { ascending: true });

  if (error) return err("db_upsert_failed", error.message, 500);
  return NextResponse.json({ rules: data });
}


// PATCH pour opérations ciblées (toggle, duplicate, reorder)
const patchSchema = z.object({
  op: z.enum(["toggle", "duplicate", "reorder"]),
  id: z.string().optional(),            // toggle/duplicate
  enabled: z.boolean().optional(),      // toggle
  fromIndex: z.number().optional(),     // reorder
  toIndex: z.number().optional(),       // reorder
});

export async function PATCH(req: Request) {
  const userId = await getUserIdOrDev();
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return err("invalid_body", parsed.error.message);

  const { op } = parsed.data;

  // Récupérer la liste actuelle pour calculer positions
  const { data: rules, error: getErr } = await supabaseServer
    .from("reminder_rules")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true });

  if (getErr) return err("db_get_failed", getErr.message, 500);

  if (op === "toggle") {
    const { id, enabled } = parsed.data;
    if (!id || enabled === undefined) return err("missing_params", "id et enabled requis");
    const { error } = await supabaseServer
      .from("reminder_rules")
      .update({ enabled })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return err("db_update_failed", error.message, 500);
  }

  if (op === "duplicate") {
    const { id } = parsed.data;
    if (!id) return err("missing_params", "id requis");
    const src = rules?.find((r) => r.id === id);
    if (!src) return err("not_found", "règle introuvable", 404);

    // Insérer la copie juste après
    const insert = {
      user_id: userId,
      delay_days: src.delay_days,
      channel: src.channel,
      template: src.template,
      position: (src.position as number) + 1,
      enabled: src.enabled,
    };
    const { error: insErr } = await supabaseServer.from("reminder_rules").insert(insert);
    if (insErr) return err("db_insert_failed", insErr.message, 500);

    // Réindexer positions 0..N-1
    await reindexPositions(userId);
  }

  if (op === "reorder") {
    const { fromIndex, toIndex } = parsed.data;
    if (
      fromIndex === undefined ||
      toIndex === undefined ||
      fromIndex < 0 ||
      toIndex < 0 ||
      !rules ||
      fromIndex >= rules.length ||
      toIndex >= rules.length
    ) {
      return err("invalid_reorder", "indices de déplacement invalides");
    }
    const arr = [...rules];
    const [moved] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, moved);
    // Appliquer nouvelles positions
    const updates = arr.map((r, i) => ({ id: r.id, position: i }));
    const { error: updErr } = await supabaseServer.from("reminder_rules").upsert(
      updates.map((u) => ({ ...u, user_id: userId })), { onConflict: "id" }
    );
    if (updErr) return err("db_reorder_failed", updErr.message, 500);
  }

  // Retourner la liste à jour
  const { data: after, error: afterErr } = await supabaseServer
    .from("reminder_rules")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true });

  if (afterErr) return err("db_get_failed", afterErr.message, 500);
  return NextResponse.json({ rules: after });
}

export async function DELETE(req: Request) {
  const userId = await getUserIdOrDev();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return err("missing_id", "paramètre id requis");

  const { error } = await supabaseServer
    .from("reminder_rules")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return err("db_delete_failed", error.message, 500);

  await reindexPositions(userId);

  const { data, error: getErr } = await supabaseServer
    .from("reminder_rules")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true });

  if (getErr) return err("db_get_failed", getErr.message, 500);
  return NextResponse.json({ rules: data });
}

async function reindexPositions(userId: string) {
  const { data, error } = await supabaseServer
    .from("reminder_rules")
    .select("id")
    .eq("user_id", userId)
    .order("position", { ascending: true });

  if (error || !data) return;

  const updates = data.map((r, i) => ({ id: r.id, position: i, user_id: userId }));
  await supabaseServer.from("reminder_rules").upsert(updates, { onConflict: "id" });
}
