import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/cron/sync" });
}

export async function POST(req: NextRequest) {
  const secret = new URL(req.url).searchParams.get("secret");
  const header = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const CRON_SECRET = process.env.CRON_SECRET ?? "";
  if (!CRON_SECRET || (secret !== CRON_SECRET && header !== CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, action: "sync noop" });
}
