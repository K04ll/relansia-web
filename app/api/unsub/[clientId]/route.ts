import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseAdmin"; // utilise ta Service Role Key côté serveur

export const dynamic = "force-dynamic"; // évite cache pour ce GET

export async function GET(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const { clientId } = params;

  if (!clientId) {
    return NextResponse.json({ ok: false, error: "Missing clientId" }, { status: 400 });
  }

  try {
    const sb = createClient();

    // 🔒 Marque le client comme désinscrit (et horodate)
    const { error } = await sb
      .from("customers") // ← si ta table s'appelle 'clients', remplace ici
      .update({ unsubscribed: true, unsubscribed_at: new Date().toISOString() })
      .eq("id", clientId);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const html = `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Désabonnement confirmé</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
       background:#0B0B0F;color:#EEF1F6;display:flex;align-items:center;justify-content:center;
       min-height:100svh;margin:0;padding:24px}
  .card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
        border-radius:16px;max-width:560px;padding:28px;text-align:center;box-shadow:0 8px 24px rgb(0 0 0 / 0.2)}
  h1{font-size:22px;margin:0 0 8px}
  p{margin:8px 0 0;color:#CDD3DE}
  .ok{display:inline-block;margin-bottom:12px;font-weight:600;color:#22C55E}
  a{color:#6E56CF;text-decoration:none}
</style>
</head><body>
  <div class="card">
    <div class="ok">Désabonnement confirmé ✅</div>
    <h1>Vous êtes désabonné</h1>
    <p>Vous ne recevrez plus de rappels de notre part sur cet email.</p>
  </div>
</body></html>`;

    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unhandled error" }, { status: 500 });
  }
}
