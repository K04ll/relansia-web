import { NextResponse } from "next/server";
import { parseCsv } from "@/lib/import/parseCsv";
import { upsertRow } from "@/lib/import/upsert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const workspaceId = req.headers.get("x-workspace-id")!;
  if (!workspaceId) return NextResponse.json({ error: "workspace required" }, { status: 400 });

  const contentType = req.headers.get("content-type") || "";
  let buffer: Buffer;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "file missing" }, { status: 400 });
    buffer = Buffer.from(await file.arrayBuffer());
  } else {
    // text/csv brut
    buffer = Buffer.from(await req.arrayBuffer());
  }

  const rows = parseCsv(buffer);
  let customers = 0, purchases = 0, reminders = 0;
  for (const r of rows) {
    const { customersUpserted, purchasesUpserted, remindersCreated } = await upsertRow(workspaceId, r);
    customers += customersUpserted;
    purchases += purchasesUpserted;
    reminders += remindersCreated;
  }

  return NextResponse.json({
    ok: true,
    rows: rows.length,
    customersUpserted: customers,
    purchasesUpserted: purchases,
    remindersCreated: reminders,
  });
}
