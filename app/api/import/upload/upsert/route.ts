import { NextRequest, NextResponse } from 'next/server';
import { normalizeRow } from '@/lib/import/normalize';
import { upsertRows } from '@/lib/import/upsert';

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth || auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { userId: string; rows: Record<string, unknown>[]; source?: 'upload' | 'url' };
    if (!body?.userId || !Array.isArray(body.rows)) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }

    const rows = body.rows.map(normalizeRow);
    const stats = await upsertRows(body.userId, rows, body.source ?? 'upload');
    return NextResponse.json({ ok: true, ...stats });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'upsert_failed' }, { status: 500 });
  }
}
