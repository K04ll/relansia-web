// app/app/onboarding/settings/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useOnboardingStore } from "@/lib/stores/onboarding";

type SendWindow = { start: string; end: string; days: number[] };
type SettingsForm = {
  store_name: string;
  sender_name: string;
  timezone: string;
  send_window: SendWindow;
  signature: string;
};

const WEEK: { label: string; value: number }[] = [
  { label: "Lun", value: 1 },
  { label: "Mar", value: 2 },
  { label: "Mer", value: 3 },
  { label: "Jeu", value: 4 },
  { label: "Ven", value: 5 },
  { label: "Sam", value: 6 },
  { label: "Dim", value: 0 },
];

export default function SettingsStep() {
  const { filename, mapping, sample } = useOnboardingStore();

  const [form, setForm] = useState<SettingsForm>({
    store_name: "",
    sender_name: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris",
    send_window: { start: "09:00", end: "18:00", days: [1, 2, 3, 4, 5] },
    signature: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length) {
            setForm((f) => ({
              ...f,
              ...data,
              send_window: data.send_window ?? f.send_window,
            }));
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleDay = (d: number) =>
    setForm((f) => {
      const has = f.send_window.days.includes(d);
      return {
        ...f,
        send_window: {
          ...f.send_window,
          days: has ? f.send_window.days.filter((x) => x !== d) : [...f.send_window.days, d],
        },
      };
    });

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("✅ Paramètres sauvegardés");
      } else {
        setMsg(`❌ ${data?.error || "Erreur sauvegarde"}`);
      }
    } catch (e: any) {
      setMsg("❌ Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="py-10">
      <h1 className="text-2xl md:text-3xl font-semibold">Paramètres d’envoi</h1>
      <p className="mt-2 text-[var(--text-dim)]">
        Step 2 — Configurez votre boutique et vos fenêtres d’envoi.
      </p>

      {/* Récap import Step 1 */}
      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-5">
        <div className="text-sm">
          <div>
            Fichier importé : <span className="font-medium">{filename ?? "—"}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-lg border px-2 py-1 text-sm">
              email → <b>{mapping?.email ?? "—"}</b>
            </span>
            <span className="rounded-lg border px-2 py-1 text-sm">
              phone → <b>{mapping?.phone ?? "—"}</b>
            </span>
            <span className="rounded-lg border px-2 py-1 text-sm">
              first_name → <b>{mapping?.first_name ?? "—"}</b>
            </span>
            <span className="rounded-lg border px-2 py-1 text-sm">
              last_name → <b>{mapping?.last_name ?? "—"}</b>
            </span>
          </div>
          <div className="mt-2 text-[var(--text-dim)]">Aperçu stocké : {sample.length} lignes.</div>
        </div>
      </div>

      {/* Form Settings */}
      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-5">
        {loading ? (
          <div className="animate-pulse text-sm text-[var(--text-dim)]">Chargement…</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Nom de la boutique</span>
                <input
                  className="input"
                  value={form.store_name}
                  onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                  placeholder="Ex. Croquettes & Co"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Nom expéditeur</span>
                <input
                  className="input"
                  value={form.sender_name}
                  onChange={(e) => setForm({ ...form, sender_name: e.target.value })}
                  placeholder="Ex. Équipe Relansia"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Fuseau horaire</span>
                <input
                  className="input"
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  placeholder="Ex. Europe/Paris"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Heure début</span>
                  <input
                    className="input"
                    value={form.send_window.start}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        send_window: { ...form.send_window, start: e.target.value },
                      })
                    }
                    placeholder="09:00"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Heure fin</span>
                  <input
                    className="input"
                    value={form.send_window.end}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        send_window: { ...form.send_window, end: e.target.value },
                      })
                    }
                    placeholder="18:00"
                  />
                </label>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Jours d’envoi</div>
              <div className="flex flex-wrap gap-2">
                {WEEK.map((d) => {
                  const active = form.send_window.days.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      className={`px-3 py-1 rounded-lg border ${
                        active ? "bg-[var(--primary)] text-white" : "bg-transparent"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="mt-4 flex flex-col gap-2">
              <span className="text-sm font-medium">Signature</span>
              <textarea
                className="input min-h-[100px]"
                value={form.signature}
                onChange={(e) => setForm({ ...form, signature: e.target.value })}
                placeholder={"Ex.\n— L’équipe " + (form.store_name || "Votre boutique")}
              />
            </label>

            <div className="mt-4 text-sm">{msg && <span>{msg}</span>}</div>
          </>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Link href="/app/onboarding/import-csv" className="btn-ghost">
          Retour
        </Link>
        <button onClick={save} disabled={saving || loading} className="btn-primary">
          {saving ? "Sauvegarde…" : "Sauvegarder"}
        </button>
        <Link href="/app/onboarding/rules" className="btn-primary">
          Continuer → Règles
        </Link>
      </div>
    </main>
  );
}
