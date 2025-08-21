"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Settings = {
  shop_name: string;
  default_channel: "email" | "sms" | "whatsapp";
  default_country: string;
  send_start_hour: number; // 0-23
  send_end_hour: number;   // 0-23
  signature: string;
};

const DEFAULTS: Settings = {
  shop_name: "",
  default_channel: "email",
  default_country: "FR",
  send_start_hour: 9,
  send_end_hour: 19,
  signature: "",
};

export default function OnboardingStep2() {
  const [form, setForm] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Charger settings existants
  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg(null);
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Erreur chargement settings");
        // Normalise valeurs
        setForm({
          shop_name: data.shop_name ?? "",
          default_channel: (data.default_channel ?? "email") as Settings["default_channel"],
          default_country: data.default_country ?? "FR",
          send_start_hour: Number.isFinite(data.send_start_hour) ? data.send_start_hour : 9,
          send_end_hour: Number.isFinite(data.send_end_hour) ? data.send_end_hour : 19,
          signature: data.signature ?? "",
        });
      } catch (e: any) {
        setMsg("❌ " + (e?.message || "Erreur chargement"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function set<K extends keyof Settings>(key: K, v: Settings[K]) {
    setForm((f) => ({ ...f, [key]: v }));
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      // validations simples
      if (form.send_start_hour < 0 || form.send_start_hour > 23) {
        throw new Error("Heure de début invalide (0–23).");
      }
      if (form.send_end_hour < 0 || form.send_end_hour > 23) {
        throw new Error("Heure de fin invalide (0–23).");
      }
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur sauvegarde");
      setMsg("✅ Préférences sauvegardées.");
      // rafraîchir les valeurs normalisées retournées
      setForm({
        shop_name: data.shop_name ?? form.shop_name,
        default_channel: (data.default_channel ?? form.default_channel) as Settings["default_channel"],
        default_country: data.default_country ?? form.default_country,
        send_start_hour: Number.isFinite(data.send_start_hour) ? data.send_start_hour : form.send_start_hour,
        send_end_hour: Number.isFinite(data.send_end_hour) ? data.send_end_hour : form.send_end_hour,
        signature: data.signature ?? form.signature,
      });
    } catch (e: any) {
      setMsg("❌ " + (e?.message || "Erreur sauvegarde"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-[#1E3A5F]">Étape 2 — Configuration de la boutique</h1>
      <p className="mt-2 text-black/60">
        Ces réglages alimentent la génération IA (nom, signature) et le cron (fenêtre d’envoi, heure Europe/Paris côté UX).
      </p>

      <div className="mt-6 rounded-2xl border bg-white p-5">
        {loading ? (
          <div className="text-sm text-black/60">Chargement…</div>
        ) : (
          <div className="grid gap-4">
            <label className="text-sm">
              Nom de la boutique
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={form.shop_name}
                onChange={(e) => set("shop_name", e.target.value)}
                placeholder="Ex: Relansia Pet Store"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="text-sm">
                Canal par défaut
                <select
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={form.default_channel}
                  onChange={(e) => set("default_channel", e.target.value as Settings["default_channel"])}
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </label>

              <label className="text-sm">
                Pays par défaut
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={form.default_country}
                  onChange={(e) => set("default_country", e.target.value.toUpperCase())}
                  placeholder="FR"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Envoi — début (0–23)
                  <input
                    type="number"
                    min={0}
                    max={23}
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    value={form.send_start_hour}
                    onChange={(e) => set("send_start_hour", Number(e.target.value || 0))}
                  />
                </label>
                <label className="text-sm">
                  Envoi — fin (0–23)
                  <input
                    type="number"
                    min={0}
                    max={23}
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    value={form.send_end_hour}
                    onChange={(e) => set("send_end_hour", Number(e.target.value || 0))}
                  />
                </label>
              </div>
            </div>

            <label className="text-sm">
              Signature
              <textarea
                className="mt-1 w-full min-h-[100px] rounded-xl border px-3 py-2"
                value={form.signature}
                onChange={(e) => set("signature", e.target.value)}
                placeholder={"L’équipe Relansia\n01 23 45 67 89"}
              />
            </label>

            <div className="flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="rounded-xl bg-[#4BC0A9] px-4 py-2 text-white disabled:opacity-60"
              >
                {saving ? "Sauvegarde…" : "Sauvegarder"}
              </button>
              {msg && <div className="text-sm">{msg}</div>}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <Link href="/app/onboarding/step1" className="px-4 py-2 rounded-xl bg-black/10">
          ⟵ Retour
        </Link>
        <Link href="/app/app/reminders" className="px-4 py-2 rounded-xl bg-[#1E3A5F] text-white">
          Continuer → Créer des relances
        </Link>
      </div>
    </div>
  );
}
