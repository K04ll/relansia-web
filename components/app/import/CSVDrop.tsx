// components/app/import/CSVDrop.tsx
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/stores/onboarding";

type Mapping = Partial<{
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
}>;
type ParsedRow = Record<string, any>;

const ACCEPT = ".csv,text/csv";

export default function CSVDrop() {
  const router = useRouter();
  const { setImport, reset } = useOnboardingStore();

  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);       // preview (20)
  const [allRows, setAllRows] = useState<ParsedRow[]>([]); // toutes les lignes
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvancedMapping, setShowAdvancedMapping] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const hasData = rows.length > 0;

  // ---------- Heuristique d’auto-mapping (FR/EN) ----------
  const autoMap = useCallback((cols: string[]): Mapping => {
    const norm = (s: string) => s.toLowerCase().trim().replaceAll(/\s+|-/g, "");
    const find = (...keys: string[]) => cols.find((c) => keys.includes(norm(c)));
    return {
      email: find("email", "e-mail", "courriel"),
      phone: find("phone", "tel", "tél", "mobile", "portable", "phonenumber"),
      first_name: find("firstname", "first_name", "prénom", "prenom"),
      last_name: find("lastname", "last_name", "nom", "nomdefamille"),
    } as Mapping;
  }, []);

  // ---------- Validation basique (preview) ----------
  const emailRegex = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);
  function isValidEmail(v: any) {
    return typeof v === "string" && emailRegex.test(v.trim());
  }
  function isLikelyPhone(v: any) {
    if (typeof v !== "string") return false;
    const s = v.replace(/[^\d+]/g, "");
    return s.length >= 8;
  }
  function statusBadge(email: any, phone: any) {
    const okEmail = isValidEmail(email);
    const okPhone = isLikelyPhone(phone);
    if (okEmail || okPhone) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Valide
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
        À corriger
      </span>
    );
  }
  function cellText(v: any) {
    const s = (v ?? "").toString().trim();
    return s || "—";
  }

  // ---------- Parsing CSV ----------
  async function parseFile(file: File) {
    setParsing(true);
    setError(null);
    try {
      const Papa = (await import("papaparse")).default;
      await new Promise<void>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (res: any) => {
            const data: ParsedRow[] = Array.isArray(res.data) ? res.data : [];
            const preview = data.slice(0, 20);
            const cols = res.meta?.fields ?? Object.keys(preview[0] || {});
            const auto = autoMap(cols);

            setAllRows(data);
            setRows(preview);
            setHeaders(cols);
            setMapping(auto);

            // On décide si on cache ou montre l’éditeur de mapping
            // → si confiance OK on cache par défaut
            const rec = recognizedState(auto, cols);
            setShowAdvancedMapping(!rec.hideMappingByDefault);
            resolve();
          },
          error: (err: any) => reject(err),
        });
      });
      setFileName(file.name);
    } catch (e: any) {
      setError(e?.message || "Erreur de parsing CSV");
    } finally {
      setParsing(false);
    }
  }

  const onDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) parseFile(f);
  }, []);

  const onBrowse = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) parseFile(f);
  }, []);

  // ---------- Actions ----------
  function resetAll() {
    setFileName(null);
    setRows([]);
    setAllRows([]);
    setHeaders([]);
    setMapping({});
    setError(null);
    setShowAdvancedMapping(false);
    reset();
    if (inputRef.current) inputRef.current.value = "";
  }

  async function validateImport() {
    setImport({ filename: fileName ?? "import.csv", mapping, sample: rows });

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/clients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: allRows, mapping, defaultCountry: "FR" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || "import_failed");

      router.push("/app/onboarding/step2");
    } catch (e: any) {
      setError(e?.message || "Erreur d’import");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- Données d’aperçu canonique FR ----------
  const previewCanonical = useMemo(() => {
    const pick = (r: ParsedRow, key?: string) => (key ? r[key] : undefined);
    return rows.map((r) => ({
      email: pick(r, mapping.email),
      phone: pick(r, mapping.phone),
      first_name: pick(r, mapping.first_name),
      last_name: pick(r, mapping.last_name),
    }));
  }, [rows, mapping]);

  // ---------- Reconnaissance / Confiance ----------
  const rec = useMemo(() => recognizedState(mapping, headers), [mapping, headers]);

  return (
    <section aria-label="Import CSV" className="space-y-6">
      {/* Dropzone */}
      <div
        onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
        onDrop={onDrop}
        className={[
          "relative rounded-2xl border transition-all select-none",
          "border-[var(--border)] bg-[var(--surface)]/60",
          dragOver ? "ring-4 ring-[var(--primary)]/40 border-[var(--primary)] shadow-xl scale-[1.01]" : "hover:border-[var(--primary)]/70 hover:shadow-lg",
          "p-6 md:p-10",
          "overflow-hidden"
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[radial-gradient(ellipse_at_top,_var(--primary)_0%,_transparent_60%)]" />
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-xl border p-3 bg-white/70 dark:bg-white/5">
            <span aria-hidden className="text-2xl">📄</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg md:text-xl font-semibold">
              Déposez votre CSV ou cliquez pour choisir un fichier
            </h3>
            <p className="mt-1 text-sm text-[var(--text-dim)]">
              Colonnes reconnues automatiquement : <b>Email</b>, <b>Téléphone</b>, <b>Prénom</b>, <b>Nom</b>.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white cursor-pointer"
                onClick={() => inputRef.current?.click()}
              >
                {fileName ? "Choisir un autre fichier" : "Choisir un fichier"}
              </button>
              <span className="text-sm text-[var(--text-dim)]">ou glissez-déposez votre fichier .csv ici</span>
              {fileName && (
                <span className="text-sm rounded-md border px-2 py-1 bg-black/5 dark:bg-white/5">
                  {fileName}
                </span>
              )}
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="sr-only"
                onChange={onBrowse}
              />
            </div>

            {error && (
              <div className="mt-3 text-sm rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-red-700 dark:text-red-300">
                {error}
              </div>
            )}
          </div>
        </div>

        {parsing && (
          <div className="mt-4 text-sm text-[var(--text-dim)] animate-pulse">
            Parsing du CSV…
          </div>
        )}
      </div>

      {/* Pourquoi importer */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-5">
        <h4 className="font-semibold">Pourquoi importer votre CSV ?</h4>
        <ul className="mt-2 text-sm text-[var(--text-dim)] list-disc pl-5 space-y-1">
          <li>Relansia retrouve vos clients existants pour lancer des relances intelligentes.</li>
          <li>Auto-mapping des colonnes, correction rapide des emails/téléphones douteux.</li>
          <li>Aucune donnée sensible côté client : traitement sécurisé côté serveur.</li>
        </ul>
        <div className="mt-3 text-sm">
          <b>Conseil :</b> exportez depuis votre outil (Shopify, WooCommerce…) en <code>.csv</code> avec au minimum <b>Email</b> ou <b>Téléphone</b>.
        </div>
      </div>

      {/* Mapping + Preview */}
      {hasData && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-5">
          {/* ✅ Bandeau “Colonnes reconnues” OU éditeur avancé */}
          {!showAdvancedMapping && rec.hideMappingByDefault ? (
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <div className="text-sm">
                <span className="font-medium">✅ Colonnes reconnues automatiquement :</span>{" "}
                Email, Téléphone, Prénom, Nom.
              </div>
              <button
                type="button"
                onClick={() => setShowAdvancedMapping(true)}
                className="self-start lg:self-auto px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface)]/80 transition cursor-pointer text-sm"
              >
                Corriger le mapping
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-[var(--text-dim)]">Mapping :</div>
              <div className="flex flex-wrap gap-2">
                <ChipSelect
                  emoji="✉️"
                  label="Email"
                  value={mapping.email ?? ""}
                  options={headers}
                  onChange={(v) => setMapping((m) => ({ ...m, email: v || undefined }))}
                />
                <ChipSelect
                  emoji="📞"
                  label="Téléphone"
                  value={mapping.phone ?? ""}
                  options={headers}
                  onChange={(v) => setMapping((m) => ({ ...m, phone: v || undefined }))}
                />
                <ChipSelect
                  emoji="🧑"
                  label="Prénom"
                  value={mapping.first_name ?? ""}
                  options={headers}
                  onChange={(v) => setMapping((m) => ({ ...m, first_name: v || undefined }))}
                />
                <ChipSelect
                  emoji="👤"
                  label="Nom"
                  value={mapping.last_name ?? ""}
                  options={headers}
                  onChange={(v) => setMapping((m) => ({ ...m, last_name: v || undefined }))}
                />
              </div>
              <div className="text-xs text-[var(--text-dim)]">
                Astuce : vous pouvez cacher cette zone quand tout est reconnu.
                <button
                  type="button"
                  onClick={() => setShowAdvancedMapping(false)}
                  className="ml-2 underline hover:no-underline"
                >
                  Masquer
                </button>
              </div>
            </div>
          )}

          {/* Preview table 2025 */}
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/40 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-[var(--surface)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--surface)]/60">
                  <tr className="text-left">
                    <Th>Statut</Th>
                    <Th>Email</Th>
                    <Th>Téléphone</Th>
                    <Th>Prénom</Th>
                    <Th>Nom</Th>
                  </tr>
                </thead>
                <tbody className="[&>tr:nth-child(odd)]:bg-[var(--surface)]/30">
                  {previewCanonical.map((r, i) => (
                    <tr
                      key={i}
                      className="border-t border-[var(--border)] hover:bg-[var(--surface)]/60 transition-colors"
                    >
                      <Td>{statusBadge(r.email, r.phone)}</Td>
                      <Td className="truncate" title={cellText(r.email)}>{cellText(r.email)}</Td>
                      <Td className="font-mono truncate" title={cellText(r.phone)}>{cellText(r.phone)}</Td>
                      <Td className="truncate" title={cellText(r.first_name)}>{cellText(r.first_name)}</Td>
                      <Td className="truncate" title={cellText(r.last_name)}>{cellText(r.last_name)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={resetAll}
              className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface)]/80 transition cursor-pointer"
            >
              Recommencer
            </button>
            <button
              type="button"
              onClick={validateImport}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white shadow-sm hover:opacity-90 active:opacity-100 transition cursor-pointer disabled:opacity-60"
            >
              {submitting ? "Import…" : "Valider l’import"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------------- Helpers & UI ---------------- */

// Calcule si on peut cacher le mapping (confiance OK)
function recognizedState(mapping: Mapping, headers: string[]) {
  const has = (k?: string) => !!k && headers.includes(k);
  const rec = {
    email: has(mapping.email),
    phone: has(mapping.phone),
    first_name: has(mapping.first_name),
    last_name: has(mapping.last_name),
  };
  const essentialsOK = rec.email || rec.phone;       // au moins un moyen de contact
  const strongOK = rec.first_name && rec.last_name;  // nom/prénom ok
  const count = [rec.email, rec.phone, rec.first_name, rec.last_name].filter(Boolean).length;

  // On cache si : au moins un contact et 3 champs reconnus (ou tous 4)
  const hideMappingByDefault = essentialsOK && (count >= 3 || (essentialsOK && strongOK));

  return { ...rec, count, hideMappingByDefault };
}

function ChipSelect({
  emoji,
  label,
  value,
  options,
  onChange,
}: {
  emoji: string;
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  // Traduction FR pour la valeur choisie
  const labels: Record<string, string> = {
    email: "Email",
    phone: "Téléphone",
    first_name: "Prénom",
    last_name: "Nom",
  };

  return (
    <label className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 px-3 py-2 shadow-sm">
      <span className="select-none">{emoji}</span>
      <span className="text-sm">{label}</span>
      <div className="relative">
        <select
          className="appearance-none bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1 pr-7 text-sm cursor-pointer focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">—</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {labels[o] ?? o}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-dim)]">▾</span>
      </div>
      <span className="text-[var(--text-dim)] text-xs">
        → <b>{labels[value] ?? "—"}</b>
      </span>
    </label>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-[var(--text-dim)] font-medium whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableCellElement> & { children: React.ReactNode }) {
  return (
    <td className={`px-4 py-3 ${className}`} {...props}>
      {children}
    </td>
  );
}
