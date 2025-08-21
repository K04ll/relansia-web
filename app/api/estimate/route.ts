import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getUserIdOrDev } from "@/lib/auth";
import { estimateDepletionDate } from "@/lib/scheduling";

/**
 * POST /api/estimate
 * Body: { email: string, product?: string, delay_days?: number }
 * Réponse: { scheduled_at: string } (ISO UTC) ou { error }
 */
export async function POST(req: Request) {
  try {
    const userId = getUserIdOrDev();
    const body = await req.json().catch(() => ({}));

    const email = String(body?.email ?? "").toLowerCase().trim();
    const product = body?.product as string | undefined;
    const delay_days = Number.isFinite(body?.delay_days) ? Number(body.delay_days) : 0;

    if (!email) {
      return NextResponse.json({ error: "email requis" }, { status: 400 });
    }

    // Récupère les infos client (même tenant)
    const { data: client, error } = await supabaseServer
      .from("clients")
      .select("id, product, quantity, purchased_at")
      .eq("user_id", userId)
      .eq("email", email)
      .single();

    if (error || !client) {
      return NextResponse.json({ error: "client introuvable" }, { status: 404 });
    }

    // Estimation déterministe côté serveur
    const when = estimateDepletionDate({
      product: product ?? client.product,
      quantity: client.quantity,
      purchased_at: client.purchased_at,
      delay_days,
    });

    if (!when) {
      return NextResponse.json({ error: "impossible d'estimer une date" }, { status: 400 });
    }

    return NextResponse.json({ scheduled_at: when });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "estimate error" }, { status: 500 });
  }
}
