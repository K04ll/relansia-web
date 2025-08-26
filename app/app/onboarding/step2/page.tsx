// app/app/onboarding/step2/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/stores/onboarding";

type SendWindow = {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
  days: number[]; // ISO 1..7
};

/* ---------- Helpers temps ---------- */
function parseTime(t: string): { h: string; m: string } {
  const [h = "09", m = "00"] = (t || "").split(":");
  return { h: h.padStart(2, "0"), m: m.padStart(2, "0") };
}
function mergeTime(h: string, m: string): string {
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

export default function SettingsStep() {
  const router = useRouter();
  const { filename, mapping, sample } = useOnboardingStore();

  const defaultTz =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "Europe/Paris";

  const [storeName, setStoreName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [timezone, setTimezone] = useState(defaultTz);
  const [sendWindow, setSendWindow] = useState<SendWindow>({
    start: "09:00",
    end: "18:00",
    days: [1, 2, 3, 4, 5],
  });
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [signature, setSignature] = useState("L’équipe Relansia");

  // Reconnaissance du mapping -> capsules
  const recognition = useMemo(() => {
    const has = (k?: string) => !!k;
    return {
      email: has(mapping?.email),
      phone: has(mapping?.phone),
      first_name: has(mapping?.first_name),
      last_name: has(mapping?.last_name),
    };
  }, [mapping]);

  useEffect(() => {
    // (plus tard) préremplir depuis Supabase si dispo
  }, []);

  const days = [
    { id: 1, label: "Lun" },
    { id: 2, label: "Mar" },
    { id: 3, label: "Mer" },
    { id: 4, label: "Jeu" },
    { id: 5, label: "Ven" },
    { id: 6, label: "Sam" },
    { id: 7, label: "Dim" },
  ];

  function toggleDay(d: number) {
    setSendWindow((w) => {
      const has = w.days.includes(d);
      const next = has ? w.days.filter((x) => x !== d) : [...w.days, d];
      next.sort((a, b) => a - b);
      return { ...w, days: next };
    });
  }

  function onSave() {
    // TODO: persist Supabase
    setSavedAt(new Date());
    setTimeout(() => setSavedAt(null), 1800);
  }
  function onContinue() {
    // TODO: validations + persist
    router.push("/app/onboarding/rules");
  }

  // valeurs contrôlées pour les selects heure/minute
  const { h: startH, m: startM } = parseTime(sendWindow.start);
  const { h: endH, m: endM } = parseTime(sendWindow.end);

  return (
    <main className="py-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Paramètres d’envoi</h1>
        <p className="mt-1 text-[var(--text-dim)]">
          Step 2 — Configurez votre boutique et vos fenêtres d’envoi.
        </p>
      </div>

      <CapsulesHeader
        filename={filename ?? "—"}
        sampleCount={sample.length}
        recognition={recognition}
      />

      <section className="mt-6 rounded-2xl border border-[var(--border)]/80 bg-[var(--surface)]/60 p-5 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Nom de la boutique">
            <Input
              placeholder="Ex. Croquettes & Co"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value ?? "")}
            />
          </Field>

          <Field label="Nom expéditeur">
            <Input
              placeholder="Ex. Équipe Relansia"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value ?? "")}
            />
          </Field>

          <Field label="Fuseau horaire" full>
            <Input
              placeholder="Ex. Europe/Paris"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value ?? "")}
            />
          </Field>

          {/* Heures — menus déroulants */}
          <Field label="Heure début">
  <div className="flex items-center gap-2">
    <Select
      value={startH}
      onChange={(e) =>
        setSendWindow((w) => ({ ...w, start: mergeTime(e.target.value, startM) }))
      }
      className="w-16"   // ⬅️ largeur réduite
    >
      {HOURS.map((h) => (
        <option key={h} value={h}>{h}</option>
      ))}
    </Select>
    <span className="text-[var(--text-dim)]">:</span>
    <Select
      value={startM}
      onChange={(e) =>
        setSendWindow((w) => ({ ...w, start: mergeTime(startH, e.target.value) }))
      }
      className="w-20"   // ⬅️ largeur minutes un peu plus large
    >
      {MINUTES.map((m) => (
        <option key={m} value={m}>{m}</option>
      ))}
    </Select>
  </div>
</Field>

<Field label="Heure fin">
  <div className="flex items-center gap-2">
    <Select
      value={endH}
      onChange={(e) =>
        setSendWindow((w) => ({ ...w, end: mergeTime(e.target.value, endM) }))
      }
      className="w-16"
    >
      {HOURS.map((h) => (
        <option key={h} value={h}>{h}</option>
      ))}
    </Select>
    <span className="text-[var(--text-dim)]">:</span>
    <Select
      value={endM}
      onChange={(e) =>
        setSendWindow((w) => ({ ...w, end: mergeTime(endH, e.target.value) }))
      }
      className="w-20"
    >
      {MINUTES.map((m) => (
        <option key={m} value={m}>{m}</option>
      ))}
    </Select>
  </div>
</Field>


          <Field label="Jours d’envoi" full>
            <div className="flex flex-wrap gap-2">
              {days.map((d) => {
                const active = sendWindow.days.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    className={[
                      "cursor-pointer rounded-xl px-3 py-1.5 text-sm transition",
                      active
                        ? "bg-[var(--primary)] text-white shadow-sm hover:opacity-90"
                        : "border border-[var(--border)]/80 bg-[var(--surface)]/60 hover:bg-[var(--surface)]/80",
                    ].join(" ")}
                    aria-pressed={active}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Signature" full>
            <Textarea
              rows={5}
              value={signature}
              onChange={(e) => setSignature(e.target.value ?? "")}
              placeholder="Ex. L’équipe Relansia"
            />
          </Field>
        </div>
      </section>

      <div className="mt-6 flex items-center justify-between">
        <Link href="/app/onboarding/import-csv" className="btn-ghost cursor-pointer">
          Retour
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 rounded-xl border border-[var(--border)]/80 bg-[var(--surface)]/60 hover:bg-[var(--surface)]/80 transition cursor-pointer"
          >
            Sauvegarder
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="px-5 py-2 rounded-xl bg-[var(--primary)] text-white shadow-sm hover:opacity-90 active:opacity-100 transition cursor-pointer"
          >
            Continuer → Règles
          </button>
        </div>
      </div>

      {savedAt && (
        <div
          role="status"
          className="fixed bottom-6 right-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-4 py-2 text-sm animate-[fadeSlideIn_240ms_ease-out]"
        >
          ✓ Paramètres sauvegardés
        </div>
      )}

      <style jsx>{`
        @keyframes fadeSlideIn {
          0% { opacity: 0; transform: translateY(6px) }
          100% { opacity: 1; transform: translateY(0) }
        }
      `}</style>
    </main>
  );
}

/* ---------- Capsules “statut” — lisibles & propres ---------- */

function CapsulesHeader({
  filename,
  sampleCount,
  recognition,
}: {
  filename: string;
  sampleCount: number;
  recognition: { email: boolean; phone: boolean; first_name: boolean; last_name: boolean };
}) {
  return (
    <section className="mt-6 rounded-2xl border border-[var(--border)]/80 bg-[var(--surface)]/60 p-5">
      <div className="mb-3 text-sm text-[var(--text-dim)]">
        Fichier importé : <b>{filename}</b> — Aperçu : {sampleCount} ligne{sampleCount > 1 ? "s" : ""}.
      </div>

      <div className="flex flex-wrap gap-8">
        <StatusPill ok={recognition.email} label="Mail" />
        <StatusPill ok={recognition.phone} label="Téléphone" />
        <StatusPill ok={recognition.first_name} label="Prénom" />
        <StatusPill ok={recognition.last_name} label="Nom" />
      </div>
    </section>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className={[
        "inline-flex items-center gap-2 h-9 rounded-full pl-2 pr-3 text-sm font-medium select-none transition",
        ok
          ? "bg-emerald-500 text-white shadow-sm"
          : "bg-transparent border border-[var(--border)] text-[var(--text-dim)]",
      ].join(" ")}
      role="status"
      aria-label={`${label} ${ok ? "confirmé" : "non détecté"}`}
      title={ok ? `${label} confirmé` : `${label} non détecté`}
    >
      <span
        className={[
          "inline-flex h-6 w-6 items-center justify-center rounded-full",
          ok ? "bg-white/20 text-white" : "bg-transparent text-[var(--text-dim)]",
        ].join(" ")}
        aria-hidden
      >
        {ok ? (
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 10h10" strokeLinecap="round" />
          </svg>
        )}
      </span>
      <span>{label}</span>
    </div>
  );
}

/* ---------- UI primitives ---------- */

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {children}
    </div>
  );
}

function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }
) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={[
        "w-full rounded-xl border border-[var(--border)]/80 bg-white/70 dark:bg-white/[0.03] backdrop-blur-sm",
        "px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50",
        "transition",
        className,
      ].join(" ")}
    />
  );
}

function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & { className?: string }
) {
  const { className = "", children, ...rest } = props;
  return (
    <select
      {...rest}
      className={[
        // ⬇️ encadré resserré
        "rounded-lg border border-[var(--border)]/80 bg-white/70 dark:bg-white/[0.05] backdrop-blur-sm",
        "px-2 py-1 outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50",
        "transition text-sm cursor-pointer",
        className,
      ].join(" ")}
    >
      {children}
    </select>
  );
}




function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }
) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      {...rest}
      className={[
        "w-full rounded-xl border border-[var(--border)]/80 bg-white/70 dark:bg-white/[0.03] backdrop-blur-sm",
        "px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50",
        "transition",
        className,
      ].join(" ")}
    />
  );
}
