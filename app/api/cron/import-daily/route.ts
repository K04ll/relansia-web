import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeRow } from '@/lib/import/normalize';
import { upsertRows } from '@/lib/import/upsert';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function POST(req: NextRequest) {
  const isVercelCron = Boolean(req.headers.get('x-vercel-cron'));
  const auth = req.headers.get('authorization');

  if (!isVercelCron && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Sync tous les users qui ont une source active
  const { data: users } = await supabase.from('data_sources')
    .select('user_id').eq('active', true).not('url', 'is', null);
  const userIds = Array.from(new Set((users ?? []).map(u => u.user_id)));

  const report: any[] = [];

  for (const userId of userIds) {
    const { data: sources } = await supabase.from('data_sources').select('url').eq('user_id', userId).eq('active', true);
    if (!sources) continue;

    for (const s of sources) {
      try {
        const res = await fetch(s.url, { cache: 'no-store' });
        const text = await res.text();
        const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
        const headers = headerLine.split(',').map(h => h.trim());
        const rows = lines.map(l => {
          const cols = l.split(','); const o: Record<string, string> = {};
          headers.forEach((h, i) => { o[h] = (cols[i] ?? '').trim(); });
          return normalizeRow(o);
        });
        const stats = await upsertRows(userId, rows, 'url');
        await supabase.from('data_sources').update({ last_synced_at: new Date().toISOString() }).eq('user_id', userId).eq('url', s.url);
        report.push({ userId, url: s.url, ...stats });
      } catch (e: any) {
        report.push({ userId, url: s.url, error: e?.message ?? 'fetch_failed' });
      }
    }
  }

  return NextResponse.json({ ok: true, users: userIds.length, report });
}
