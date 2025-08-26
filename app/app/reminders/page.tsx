"use client";

import { useEffect, useMemo, useState } from "react";

/* ===============================
   Types
=================================*/
type Row = {
  id: string;
  user_id: string;
  client_id: string | null;
  channel: "email" | "sms" | "whatsapp";
  status: "draft" | "scheduled" | "sending" | "sent" | "failed" | "canceled";
  scheduled_at: string | null;
  sent_at: string | null;
  retry_count: number | null;

  client_email?: string | null;
  client_phone?: string | null;
  client_first_name?: string | null;
  client_last_name?: string | null;
};

type Overview = {
  sent: number;
  failed: number;
  scheduled: number;
  canceled: number;
};

type LogItem = {
  channel: "email" | "sms" | "whatsapp";
  status: "success" | "failed";
  provider_id: string | null;
  error_detail: { code?: string; message?: string } | null;
  created_at: string;
};

const STATUS_OPTIONS = ["tous", "scheduled", "sending", "sent", "failed", "canceled"] as const;
const CHANNEL_OPTIONS = ["tous", "email", "sms", "whatsapp"] as const;

/* ===============================
   Page
=================================*/
export default function RemindersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [overview, setOverview] = useState<Overview>({ sent: 0, failed: 0, scheduled: 0, canceled: 0 });
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // filtres
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("tous");
  const [channel, setChannel] = useState<(typeof CHANNEL_OPTIONS)[number]>("tous");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const queryParams = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("page", String(page));
    sp.set("pageSize", String(pageSize));
    if (q.trim()) sp.set("q", q.trim());
    if (status !== "tous") sp.append("status[]", status);
    if (channel !== "tous") sp.append("channel[]", channel);
    return sp.toString();
  }, [page, pageSize, q, status, channel]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const [listRes, ovRes, logRes] = await Promise.all([
        fetch(`/api/reminders?${queryParams}`, { cache: "no-store" }),
        fetch(`/api/reminders/overview?${queryParams}`, { cache: "no-store" }),
        fetch(`/api/reminders/logs?limit=10`, { cache: "no-store" }),
      ]);

      if (!listRes.ok) throw new Error(`chargement_liste ${listRes.status}`);
      if (!ovRes.ok) throw new Error(`chargement_stats ${ovRes.status}`);
      if (!logRes.ok) throw new Error(`chargement_logs ${logRes.status}`);

      const listJson = await listRes.json();
      const ovJson = await ovRes.json();
      const logJson = await logRes.json();

      setRows(listJson.rows || []);
      setTotal(listJson.total || 0);
      setOverview(ovJson || { sent: 0, failed: 0, scheduled: 0, canceled: 0 });
      setLogs(logJson.logs || []);
    } catch (e: any) {
      setError(e?.message || "chargement_impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const onSendNow = async (id: string) => {
    try {
      setLoadingAction(id);
      setError(null);
      const res = await fetch(`/api/reminders/send-now`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || "envoi_immediat_echec");
      await fetchAll();
    } catch (e: any) {
      setError(e?.message || "envoi_immediat_echec");
    } finally {
      setLoadingAction(null);
    }
  };

  const onCancel = async (id: string) => {
    try {
      if (!confirm("Confirmer l’annulation ?")) return;
      setLoadingAction(id);
      setError(null);
      const res = await fetch(`/api/reminders/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || "annulation_echec");
      await fetchAll();
    } catch (e: any) {
      setError(e?.message || "annulation_echec");
    } finally {
      setLoadingAction(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-6 md:p-8 space-y-8 min-h-[100dvh]">
      {/* Header “Apple-like” */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Relances
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Suivez vos relances, envoyez maintenant ou annulez en un geste.
          </p>
        </div>

        {/* Barre d’outils moderne (fond transparent + verre) */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/50 supports-[backdrop-filter]:backdrop-blur px-2 py-1">
            <IconSearch className="size-4 opacity-60" />
            <input
              value={q}
              onChange={(e) => { setPage(1); setQ(e.target.value); }}
              placeholder="Rechercher (nom, email, téléphone)"
              className="bg-transparent outline-none text-sm px-1 py-1 w-[200px]"
              aria-label="Rechercher"
            />
          </div>

          <Segmented
            value={status}
            options={STATUS_OPTIONS.map(s => s === "tous" ? "tous" : s)}
            onChange={(v) => { setPage(1); setStatus(v as any); }}
            ariaLabel="Filtre statut"
          />

          <Segmented
            value={channel}
            options={CHANNEL_OPTIONS.map(c => c === "tous" ? "tous" : c)}
            onChange={(v) => { setPage(1); setChannel(v as any); }}
            ariaLabel="Filtre canal"
          />

          <Button onClick={() => fetchAll()} variant="primary" ariaLabel="Rafraîchir">
            <IconRefresh className="size-4 -ms-0.5 me-1" /> Rafraîchir
          </Button>
        </div>
      </header>

      {/* Stat cards — verre dépoli subtil, contraste AA en clair et sombre */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Envoyés"   value={overview.sent}      tone="success" />
        <StatCard label="Échoués"   value={overview.failed}    tone="danger" />
        <StatCard label="Planifiés" value={overview.scheduled} tone="info" />
        <StatCard label="Annulés"   value={overview.canceled}  tone="muted" />
      </section>

      {/* Message d'erreur */}
      {error && (
        <div className="rounded-2xl border border-red-300/60 bg-red-50/80 dark:bg-red-900/25 text-red-800 dark:text-red-200 px-4 py-3">
          ❌ {error}
        </div>
      )}

      {/* Table — conteneur verre dépoli transparent (pas de “bande” sombre) */}
<section className="rounded-2xl border border-gray-200/40 dark:border-neutral-800/40 bg-white/30 dark:bg-neutral-900/20 supports-[backdrop-filter]:backdrop-blur-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50/80 dark:bg-neutral-900/60 supports-[backdrop-filter]:backdrop-blur">
              <tr className="text-left">
                <Th>Statut</Th>
                <Th>Canal</Th>
                <Th>Client</Th>
                <Th>Planifié</Th>
                <Th>Envoyé</Th>
                <Th>Relances</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80 dark:divide-neutral-800/80">
              {loading ? (
                <SkeletonRows />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-500">
                    Aucun reminder pour ces filtres.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/70 dark:hover:bg-neutral-900/60 transition-colors">
                    <Td><BadgeStatus status={r.status} /></Td>
                    <Td><BadgeChannel channel={r.channel} /></Td>
                    <Td>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {r.client_first_name || r.client_last_name
                            ? `${r.client_first_name ?? ""} ${r.client_last_name ?? ""}`.trim()
                            : (r.client_email || r.client_phone || "—")}
                        </span>
                        <span className="text-xs text-gray-500">
                          {r.client_email || r.client_phone || "—"}
                        </span>
                      </div>
                    </Td>
                    <Td>{fmtDate(r.scheduled_at)}</Td>
                    <Td>{fmtDate(r.sent_at)}</Td>
                    <Td>{r.retry_count ?? 0}</Td>
                    <Td className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
  size="sm"
  variant="ghost"
  onClick={() => onSendNow(r.id)}
  disabled={loadingAction === r.id || r.status === "sent" || r.status === "canceled"}
  ariaLabel="Envoyer maintenant"
>
  <IconSend className="size-4 -ms-0.5 me-1" /> Envoyer
</Button>

<Button
  size="sm"
  variant="dangerGhost"
  onClick={() => onCancel(r.id)}
  disabled={loadingAction === r.id || r.status === "sent" || r.status === "canceled"}
  ariaLabel="Annuler"
>
  <IconBan className="size-4 -ms-0.5 me-1" /> Annuler
</Button>

                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Logs récents */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Derniers logs</h2>
        <ul className="space-y-2">
          {logs.length === 0 ? (
            <li className="text-gray-500">Aucun log pour le moment.</li>
          ) : logs.map((l, i) => (
            <li
              key={i}
              className="text-sm rounded-2xl border border-gray-200/70 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-900/40 supports-[backdrop-filter]:backdrop-blur p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <BadgeChannel channel={l.channel} />
                <span className={l.status === "success" ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                  {l.status === "success" ? "succès" : "échec"}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {(l.error_detail?.code || "—")} — {(l.error_detail?.message || "—")}
                </span>
              </div>
              <span className="text-xs text-gray-500">{fmtDate(l.created_at)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Pagination */}
      <footer className="flex items-center justify-between pt-2">
        <span className="text-sm text-gray-500">Total : {total}</span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            ariaLabel="Page précédente"
          >
            ← Précédent
          </Button>
          <span className="text-sm self-center px-2 rounded-full border border-gray-200/70 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-900/50">
            Page {page} / {Math.max(1, Math.ceil(total / pageSize))}
          </span>
          <Button
            size="sm"
            variant="ghost"
            disabled={page >= Math.max(1, Math.ceil(total / pageSize))}
            onClick={() => setPage((p) => p + 1)}
            ariaLabel="Page suivante"
          >
            Suivant →
          </Button>
        </div>
      </footer>
    </div>
  );
}

/* ===============================
   UI bits
=================================*/
function Th({ children, className = "" }: { children: any; className?: string }) {
  return (
    <th className={`px-4 py-3 text-[11px] uppercase tracking-wider font-semibold text-gray-600 dark:text-gray-300 ${className}`}>
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: any; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}

function StatCard({ label, value, tone = "info" }: { label: string; value: number; tone?: "success"|"danger"|"info"|"muted" }) {
  const map = {
    success: "from-emerald-500/10 to-emerald-500/0 border-emerald-200/50 dark:border-emerald-900/40",
    danger:  "from-rose-500/10 to-rose-500/0 border-rose-200/50 dark:border-rose-900/40",
    info:    "from-blue-500/10 to-blue-500/0 border-blue-200/50 dark:border-blue-900/40",
    muted:   "from-gray-500/10 to-gray-500/0 border-gray-200/60 dark:border-neutral-800/70",
  }[tone];

  return (
    <div className={`rounded-2xl border bg-gradient-to-b ${map} supports-[backdrop-filter]:backdrop-blur p-5`}>
      <div className="text-[28px] md:text-[32px] font-semibold leading-none">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function Segmented({
  value, options, onChange, ariaLabel,
}: { value: string; options: readonly string[]; onChange: (v: string) => void; ariaLabel?: string }) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/50 supports-[backdrop-filter]:backdrop-blur" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={[
              "px-3 py-1.5 rounded-xl text-sm transition",
              active
                ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-neutral-800/70",
            ].join(" ")}
            aria-pressed={active}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function BadgeStatus({ status }: { status: Row["status"] }) {
  // Fond plein + texte blanc partout, avec teintes adaptées par statut
  const bg: Record<Row["status"], string> = {
    draft:    "bg-neutral-500  border-neutral-700",
    scheduled:"bg-blue-600     border-blue-700",
    sending:  "bg-amber-600    border-amber-700",
    sent:     "bg-emerald-600  border-emerald-700",
    failed:   "bg-rose-600     border-rose-700",
    canceled: "bg-neutral-600  border-neutral-700",
  };
  const label: Record<Row["status"], string> = {
    draft: "Brouillon",
    scheduled: "Planifié",
    sending: "Envoi…",
    sent: "Envoyé",
    failed: "Échoué",
    canceled: "Annulé",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs border text-white shadow-sm ${bg[status]}`}
      style={{ WebkitTextStroke: "0.35px rgba(0,0,0,0.7)" }} // liseré noir autour du texte
    >
      {label[status]}
    </span>
  );
}


function BadgeChannel({ channel }: { channel: Row["channel"] }) {
  // Couleurs "pleines" par canal
  const map: Record<Row["channel"], string> = {
    email:    "bg-indigo-600 border-indigo-700",
    sms:      "bg-cyan-600 border-cyan-700",
    whatsapp: "bg-emerald-600 border-emerald-700",
  };
  const label = channel === "email" ? "Email" : channel === "sms" ? "SMS" : "WhatsApp";
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs border text-white shadow-sm ${map[channel]}`}
      style={{ WebkitTextStroke: "0.35px rgba(0,0,0,0.7)" }} // liseré noir autour des lettres
    >
      {label}
    </span>
  );
}


function Button({
  children, onClick, variant = "ghost", size = "md", disabled, ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "ghost" | "primary" | "dangerGhost";
  size?: "sm" | "md";
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl transition select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/30";
  const styles =
    variant === "primary"
      ? "bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:opacity-85 border border-transparent shadow-sm"
      : variant === "dangerGhost"
      ? "bg-rose-600 text-white hover:brightness-110 active:brightness-105 border border-transparent shadow-sm"
      : // ghost → totalement transparent, pas de halo blanc
        "bg-transparent text-current border border-transparent hover:bg-black/5 dark:hover:bg-white/10";

  const padd = size === "sm" ? "px-3 py-1.5 text-sm" : "px-3.5 py-2";
  const opacity = disabled ? "opacity-50 pointer-events-none" : "";

  return (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel} className={`${base} ${styles} ${padd} ${opacity}`}>
      {children}
    </button>
  );
}


function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <Td><div className="h-6 w-24 rounded-full bg-gray-200/60 dark:bg-neutral-800/60" /></Td>
          <Td><div className="h-6 w-16 rounded-full bg-gray-200/60 dark:bg-neutral-800/60" /></Td>
          <Td><div className="h-6 w-44 rounded-md bg-gray-200/60 dark:bg-neutral-800/60" /></Td>
          <Td><div className="h-5 w-32 rounded-md bg-gray-200/60 dark:bg-neutral-800/60" /></Td>
          <Td><div className="h-5 w-32 rounded-md bg-gray-200/60 dark:bg-neutral-800/60" /></Td>
          <Td><div className="h-5 w-10 rounded-md bg-gray-200/60 dark:bg-neutral-800/60" /></Td>
          <Td><div className="h-8 w-44 rounded-xl bg-gray-200/60 dark:bg-neutral-800/60 ms-auto" /></Td>
        </tr>
      ))}
    </>
  );
}

/* ===============================
   Icons (inline SVG)
=================================*/
function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-3.5-3.5" />
    </svg>
  );
}
function IconRefresh(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props} aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}
function IconSend(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props} aria-hidden="true">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}
function IconBan(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </svg>
  );
}

/* ===============================
   Utils
=================================*/
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
  } catch {
    return iso;
  }
}
