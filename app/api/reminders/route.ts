import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { estimateDepletionDate } from "@/lib/scheduling";
import { getUserIdOrDev } from "@/lib/auth";

/** GET /api/reminders */
export async function GET() {
  try {
    const userId = getUserIdOrDev();
    const { data, error } = await supabaseServer
      .from("reminders")
      .select(
        "id, product, delay_days, channel, scheduled_at, message, status, created_at, sent_at, clients:client_id(email,first_name,last_name,phone)"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "reminders get error" }, { status: 500 });
  }
}

/** POST /api/reminders */
export async function POST(req: Request) {
  try {
    const userId = getUserIdOrDev();
    const body = await req.json();

    const {
      client_email,
      client_id,
      product,
      delay_days = 0,
      channel,
      scheduled_at,
      message,
      status = "scheduled",
    } = body ?? {};

    if (!channel) {
      return NextResponse.json({ ok: false, error: "channel is required" }, { status: 400 });
    }

    // Résoudre le client dans le même tenant
    let cid: string | null = client_id ?? null;
    let clientRow: any = null;

    if (!cid && client_email) {
      const { data, error } = await supabaseServer
        .from("clients")
        .select("id, email, product, quantity, purchased_at, first_name, last_name, phone")
        .eq("user_id", userId)
        .eq("email", String(client_email).toLowerCase())
        .single();

      if (error || !data) {
        return NextResponse.json({ ok: false, error: "client not found" }, { status: 400 });
      }
      cid = data.id;
      clientRow = data;
    }

    if (!cid) {
      return NextResponse.json(
        { ok: false, error: "client_id or client_email is required" },
        { status: 400 }
      );
    }

    // Estimation scheduled_at si manquant
    let when: string | null = scheduled_at ?? null;
    if (!when) {
      if (!clientRow) {
        const { data } = await supabaseServer
          .from("clients")
          .select("product, quantity, purchased_at")
          .eq("user_id", userId)
          .eq("id", cid)
          .single();
        clientRow = data;
      }
      when = estimateDepletionDate({
        product: product ?? clientRow?.product,
        quantity: clientRow?.quantity,
        purchased_at: clientRow?.purchased_at,
        delay_days,
      });
    }

    if (!when) {
      return NextResponse.json(
        { ok: false, error: "scheduled_at could not be determined" },
        { status: 400 }
      );
    }

    const insertPayload = {
      user_id: userId,
      client_id: cid,
      product: product ?? clientRow?.product ?? null,
      delay_days: delay_days ?? 0,
      channel,
      scheduled_at: new Date(when).toISOString(),
      message: message ?? null,
      status,
    };

    const { data, error } = await supabaseServer
      .from("reminders")
      .insert(insertPayload)
      .select()
      .single();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, reminder: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}

/** PATCH /api/reminders */
export async function PATCH(req: Request) {
  try {
    const userId = getUserIdOrDev();
    const body = await req.json();
    const { id, action } = body ?? {};
    if (!id || !action) {
      return NextResponse.json({ ok: false, error: "id et action requis" }, { status: 400 });
    }

    // Charger reminder + client (même tenant)
    const { data: r, error } = await supabaseServer
      .from("reminders")
      .select("id, channel, status, clients:client_id(email, phone)")
      .eq("user_id", userId)
      .eq("id", id)
      .single();

    if (error || !r) {
      return NextResponse.json({ ok: false, error: "reminder introuvable" }, { status: 404 });
    }

    if (action === "cancel") {
      const { error: upErr } = await supabaseServer
        .from("reminders")
        .update({ status: "canceled" })
        .eq("user_id", userId)
        .eq("id", id);
      if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
      return NextResponse.json({ ok: true, status: "canceled" });
    }

    if (action === "draft") {
      const { error: upErr } = await supabaseServer
        .from("reminders")
        .update({ status: "draft" })
        .eq("user_id", userId)
        .eq("id", id);
      if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
      return NextResponse.json({ ok: true, status: "draft" });
    }

    if (action === "send_now") {
      // Mock provider en dev : validations minimales selon canal
      const client = r.clients as { email?: string; phone?: string } | null;
      const email = client?.email;
      const phone = client?.phone;

      if (r.channel === "email") {
        const ok = !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!ok) return NextResponse.json({ ok: false, error: "email invalide" }, { status: 400 });
      } else if (r.channel === "sms" || r.channel === "whatsapp") {
        const ok = !!phone && /^\+?[1-9]\d{7,14}$/.test(phone);
        if (!ok) return NextResponse.json({ ok: false, error: "phone E.164 invalide" }, { status: 400 });
      }

      const now = new Date().toISOString();
      const { error: upErr } = await supabaseServer
        .from("reminders")
        .update({ status: "sent", sent_at: now })
        .eq("user_id", userId)
        .eq("id", id);
      if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });

      return NextResponse.json({ ok: true, status: "sent", sent_at: now });
    }

    return NextResponse.json({ ok: false, error: "action inconnue" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}
