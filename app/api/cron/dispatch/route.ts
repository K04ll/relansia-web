import { NextResponse } from "next/server";

function isAuthorized(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("secret");
  const fromHeader = req.headers.get("authorization"); // "Bearer xxx"

  if (fromQuery && fromQuery === expected) return true;
  if (fromHeader && fromHeader.startsWith("Bearer ")) {
    const token = fromHeader.slice("Bearer ".length).trim();
    if (token === expected) return true;
  }
  return false;
}

async function doDispatch(baseUrl: string, authHeader?: string | null) {
  const res = await fetch(`${baseUrl}/api/reminders/dispatch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Dispatch failed");
  return data;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const base = new URL(req.url).origin;
  const authHeader = req.headers.get("authorization"); // on forward au cas où la route interne l’exigerait
  try {
    const data = await doDispatch(base, authHeader);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Dispatch failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
