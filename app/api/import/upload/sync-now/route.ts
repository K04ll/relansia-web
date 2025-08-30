import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeRow } from '@/lib/import/normalize';
import { upsertRows } from '@/lib/import/upsert';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth || auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json() as { userId: string };
    if (!userId) return NextResponse.json({ error: 'missing userId' }, { status: 400 });

    const { data: sources } = await supabase.from('data_sources').select('url').eq('user_id', userId).eq('active', true);
    if (!sources || sources.length === 0) return NextResponse.json({ ok: true, sources: 0, stats: [] });

    const allStats: any[] = [];
    for (const s of sources) {
      const res = await fetch(s.url, { cache: 'no-store' });
      const text = await res.text();
      // Simple CSV parsing (pas de lib côté server): split lignes/colonnes ; en prod, gardez PapaParse côté upload.
      const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
      const headers = headerLine.split(',').map(h => h.trim());
      const rows = lines.map(l => {
        const cols = l.split(','); const o: Record<string, string> = {};
        headers.forEach((h, i) => { o[h] = (cols[i] ?? '').trim(); });
        return normalizeRow(o);
      });

      const stats = await upsertRows(userId, rows, 'url');
      allStats.push({ url: s.url, ...stats });
      await supabase.from('data_sources').update({ last_synced_at: new Date().toISOString() }).eq('user_id', userId).eq('url', s.url);
    }

    return NextResponse.json({ ok: true, sources: sources.length, stats: allStats });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'sync_failed' }, { status: 500 });
  }
}
