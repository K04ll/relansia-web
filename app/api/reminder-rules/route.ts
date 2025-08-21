import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getUserIdOrDev } from "@/lib/auth";

// GET : liste toutes les règles de relance de l'utilisateur
export async function GET() {
  const userId = await getUserIdOrDev();

  const { data, error } = await supabaseServer
    .from("reminder_rules")
    .select("*")
    .eq("user_id", userId)
    .order("delay_days", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST : ajoute une nouvelle règle
export async function POST(req: Request) {
  const userId = await getUserIdOrDev();
  const body = await req.json();

  const { data, error } = await supabaseServer
    .from("reminder_rules")
    .insert({
      user_id: userId,
      delay_days: body.delay_days,
      channel: body.channel,
      message_template: body.message_template ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH : modifie une règle existante
export async function PATCH(req: Request) {
  const userId = await getUserIdOrDev();
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: "Missing rule id" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("reminder_rules")
    .update({
      delay_days: body.delay_days,
      channel: body.channel,
      message_template: body.message_template ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE : supprime une règle
export async function DELETE(req: Request) {
  const userId = await getUserIdOrDev();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing rule id" }, { status: 400 });
  }

  const { error } = await supabaseServer
    .from("reminder_rules")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
