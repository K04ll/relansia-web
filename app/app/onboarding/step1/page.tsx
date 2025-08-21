"use client";

import Papa from "papaparse";
import { useMemo, useState } from "react";
import Link from "next/link";

type Row = Record<string, any>;

const REQUIRED = ["email"];
const FIELDS = [
  { key: "email", label: "Email *" },
  { key: "first_name", label: "Prénom" },
  { key: "last_name", label: "Nom" },
  { key: "phone", label: "Téléphone" },
  { key: "product", label: "Produit" },
  { key: "quantity", label: "Quantité (ex: 10 kg)" },
  { key: "purchased_at", label: "Date achat (ISO ou fr)" },
];

export default function OnboardingStep1() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        const rows = (res.data || [])
          .slice(0, 5000)
          .map((r) =>
            Object.fromEntries(
              Object.entries(r).map(([k, v]) => [
                k.trim(),
                typeof v === "string" ? v.trim() : v,
              ])
            )
          );
        const hdrs = Object.keys(rows[0] || {});
        setHeaders(hdrs);
        setRawRows(rows);
        // Auto-mapping naïf
        const mp: Record<string, string> = {};
        for (const f of FIELDS) {
          const found =
            hdrs.find((h) => h.toLowerCase() === f.key) ??
            hdrs.find((h) =>
              h.toLowerCase().includes(f.key.replace("_", " "))
            );
          if (found) mp[f.key] = found;
        }
        setMapping(mp);
      },
      error: (err) => setMsg(err.message || "Erreur parsing CSV"),
    });
  }

  const preview = useMemo(() => rawRows.slice(0, 50), [rawRows]);

  const canImport = useMemo(() => {
    const mapped = Object.values(mapping ?? {});
    return REQUIRED.every((r) => mapped.includes(mapping[r] ?? ""));
  }, [mapping]);

  async function doImport() {
    setImporting(true);
    setMsg(null);
    try {
      const rows = rawRows.map((r) => {
        const out: Row = {};
        for (const f of FIELDS) {
          const src = mapping[f.key];
          if (src) out[f.key] = r[src];
        }
        return out;
      });

      // 🔑 Important : user_id est ajouté côté API (via getUserIdOrDev)
      const res = await fetch("/api/clients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur import");
      setMsg(`✅ Import OK — ${data?.inserted ?? 0} lignes upsertées.`);
    } catch (e: any) {
      setMsg("❌ " + (e?.message || "Erreur import"));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-[#1E3A5F]">Étape 1 : Import CSV</h1>
      <p className="mt-2 text-black/60">
        Uploadez votre CSV, mappez les colonnes, puis importez vos clients.
      </p>

      <div className="mt-6 rounded-xl border border-black/10 bg-white p-4">
        <input type="file" accept=".csv,text/csv" onChange={handleFile} />
      </div>

      {headers.length > 0 && (
        <div className="mt-6 grid gap-4">
          <h2 className="text-lg font-medium">Mapping des colonnes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {FIELDS.map((f) => (
              <label key={f.key} className="text-sm">
                {f.label}
                <select
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={mapping[f.key] ?? ""}
                  onChange={(e) =>
                    setMapping({ ...mapping, [f.key]: e.target.value })
                  }
                >
                  <option value="">—</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={!canImport || importing}
              onClick={doImport}
              className="mt-2 w-fit px-4 py-2 rounded-xl bg-[#4BC0A9] text-white disabled:opacity-60"
            >
              {importing ? "Import…" : "Importer"}
            </button>
            {msg && <div className="text-sm text-black/70">{msg}</div>}
          </div>

          <h3 className="mt-8 text-lg font-medium">Aperçu (50 premières lignes)</h3>
          <div className="overflow-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-black/5">
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr key={idx} className="odd:bg-white even:bg-black/2">
                    {headers.map((h) => (
                      <td key={h} className="px-3 py-2">
                        {String(row[h] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 mt-8">
            <Link
              href="/app/onboarding/step2"
              className="px-4 py-2 rounded-xl bg-[#4BC0A9] text-white"
            >
              Continuer
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
