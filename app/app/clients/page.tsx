// app/app/clients/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Client = {
  id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
};

export default function ClientsPage() {
  const router = useRouter();
  const [all, setAll] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/clients/list", { cache: "no-store" });
      const data = await res.json();
      setAll(data.clients ?? []);
    } catch {
      setAll([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // guard → si 0 client, on empêche la progression vers Step2
  function handleContinue() {
    if (!all.length) {
      setErrorMsg("Ajoutez d’abord au moins un client (import CSV).");
      // auto-hide après 3s
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    router.push("/app/onboarding/step2");
  }

  const filtered = useMemo(() => {
    if (!q.trim()) return all;
    const k = q.toLowerCase();
    return all.filter((c) =>
      [c.email ?? "", c.phone ?? "", c.first_name ?? "", c.last_name ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(k)
    );
  }, [q, all]);

  return (
    <main className="py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Clients</h1>
          <p className="mt-1 text-[var(--text-dim)]">
            Liste de vos clients importés. Recherche en direct, stats, et état clair.
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost">↻ Rafraîchir</button>
          <Link
            href="/app/onboarding/import-csv"
            className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white shadow-sm hover:opacity-90 active:opacity-100 transition"
          >
            Importer un CSV
          </Link>
        </div>
      </div>

      {/* Barre d’action */}
      <div className="mt-6 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (nom, email, téléphone)…"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-4 py-2 pr-9"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]">⌘K</span>
        </div>

        {/* Mini stat chips */}
        <div className="flex flex-wrap gap-2">
          <StatChip label="Total" value={all.length} />
          <StatChip label="Avec email" value={all.filter((c) => !!c.email).length} />
          <StatChip label="Avec téléphone" value={all.filter((c) => !!c.phone).length} />
        </div>
      </div>

      {/* Message d’erreur animé (guard onboarding) */}
      {errorMsg && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 px-4 py-3 animate-[fadeSlideIn_300ms_ease-out,wiggle_250ms_ease-out]"
        >
          {errorMsg}
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <SkeletonTable />
      ) : filtered.length === 0 ? (
        <EmptyState onContinue={handleContinue} />
      ) : (
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface)]/60">
              <tr className="text-left">
                <Th>Nom</Th>
                <Th>Email</Th>
                <Th>Téléphone</Th>
                <Th>Créé</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-[var(--border)] hover:bg-[var(--surface)]/60 transition-colors"
                >
                  <Td>
                    {c.first_name || c.last_name
                      ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()
                      : "—"}
                  </Td>
                  <Td>{c.email ?? "—"}</Td>
                  <Td className="font-mono">{c.phone ?? "—"}</Td>
                  <Td title={c.created_at}>
                    {new Date(c.created_at).toLocaleString()}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* keyframes locales (fade + slide + wiggle léger) */}
      <style jsx>{`
        @keyframes fadeSlideIn {
          0% { opacity: 0; transform: translateY(-6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes wiggle {
          0% { transform: translateY(0) rotate(0.1deg); }
          25% { transform: translateY(0) rotate(-0.4deg); }
          50% { transform: translateY(0) rotate(0.3deg); }
          75% { transform: translateY(0) rotate(-0.2deg); }
          100% { transform: translateY(0) rotate(0); }
        }
      `}</style>
    </main>
  );
}

/* ---------- UI bits ---------- */

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-1.5 text-sm">
      <span className="text-[var(--text-dim)]">{label}</span>{" "}
      <b className="tabular-nums">{value}</b>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-[var(--text-dim)] font-medium">{children}</th>;
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

function SkeletonTable() {
  return (
    <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-hidden">
      <div className="h-10 bg-[var(--surface)]/60" />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-12 border-t border-[var(--border)] animate-pulse bg-[var(--surface)]/40" />
      ))}
    </div>
  );
}

function EmptyState({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-10 text-center">
      <div className="flex flex-col items-center gap-4">
        {/* Icône */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          👥
        </div>

        {/* Texte */}
        <div>
          <h3 className="text-lg font-semibold">Aucun client importé</h3>
          <p className="mt-1 text-[var(--text-dim)] max-w-md mx-auto">
            Importez votre CSV depuis Shopify, WooCommerce… Nous normalisons automatiquement
            les téléphones (E.164) et fusionnons les doublons.
          </p>
        </div>

        {/* Boutons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Link
            href="/app/onboarding/import-csv"
            className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white shadow-sm hover:opacity-90 active:opacity-100 transition"
          >
            🚀 Importer un CSV
          </Link>

          <button
  type="button"
  onClick={onContinue}
  className="px-6 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface)]/80 transition cursor-pointer"
>
  Continuer l’onboarding
</button>

        </div>
      </div>
    </div>
  );
}
