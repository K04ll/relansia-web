// app/api/_diag/email/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function POST(req: Request) {
  // simple protection: même header que le cron
  const auth = req.headers.get("authorization");
  const cron = req.headers.get("x-vercel-cron");
  if (!cron && auth !== `Bearer ${process.env.CRON_SECRET}`) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const to = body?.to as string | undefined;
  const from = process.env.EMAIL_FROM || "";
  const hasKey = Boolean(process.env.RESEND_API_KEY);

  if (!to) {
    return NextResponse.json({
      ok: false,
      reason: "missing_to",
      env: { hasKey, from }
    }, { status: 400 });
  }
  if (!hasKey || !from) {
    return NextResponse.json({
      ok: false,
      reason: "missing_env",
      env: { hasKey, from }
    }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY!);

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: "Relansia — test direct (diag)",
      html: `<div style="font-family:system-ui">Test OK ✅<br/><small>from=${from}</small></div>`
    });

    if (error) {
      return NextResponse.json({
        ok: false,
        reason: "resend_error",
        env: { hasKey, from },
        providerError: String(error)
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      env: { hasKey, from },
      providerId: data?.id || null
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      reason: "exception",
      env: { hasKey, from },
      error: e?.message || String(e)
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return NextResponse.json({
    ok: true,
    tip: "POST with { to: 'you@example.com' } and Authorization: Bearer <CRON_SECRET>"
  });
}
