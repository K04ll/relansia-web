import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseAdmin"; // Service Role côté serveur

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, context: any) {
  // ← on évite le typing strict du 2e arg, Next 15 est pointilleux
  const clientId = context?.params?.clientId as string | undefined;
  if (!clientId) {
    return NextResponse.json({ ok: false, error: "Missing clientId" }, { status: 400 });
  }

  const sb = createClient();

  // ⚠️ Si ta table s’appelle "clients", remplace "customers" par "clients"
  const { error } = await sb
    .from("customers")
    .update({ unsubscribed: true, unsubscribed_at: new Date().toISOString() })
    .eq("id", clientId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Désabonnement confirmé</title>
  <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
  background:#0B0B0F;color:#EEF1F6;display:flex;align-items:center;justify-content:center;
  min-height:100svh;margin:0;padding:24px}
  .card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
  border-radius:16px;max-width:560px;padding:28px;text-align:center;box-shadow:0 8px 24px rgb(0 0 0 / 0.2)}
  h1{font-size:22px;margin:0 0 8px}p{margin:8px 0 0;color:#CDD3DE}.ok{display:inline-block;margin-bottom:12px;font-weight:600;color:#22C55E}</style>
  </head><body><div class="card"><div class="ok">Désabonnement confirmé ✅</div>
  <h1>Vous êtes désabonné</h1><p>Vous ne recevrez plus de rappels sur cet email.</p></div></body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
