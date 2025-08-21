"use client";

import { useEffect, useMemo, useState } from "react";

type Channel = "email" | "sms" | "whatsapp";

type Props = {
  clientEmail: string;
  defaultProduct?: string;
  onClose: VoidFunction;
  onCreated?: VoidFunction; // callback optionnel après création


};

export default function ReminderModal({ clientEmail, defaultProduct, onClose, onCreated }: Props) {
  const [product, setProduct] = useState(defaultProduct ?? "");
  const [delayDays, setDelayDays] = useState<number>(0);
  const [channel, setChannel] = useState<Channel>("email");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const [estimating, setEstimating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const canCreate = useMemo(
    () => !!clientEmail && !!channel && (!!scheduledAt || delayDays >= 0),
    [clientEmail, channel, scheduledAt, delayDays]
  );

  // 1) Pré-remplir scheduled_at via /api/estimate
  useEffect(() => {
    let abort = false;
    async function run() {
      setEstimating(true);
      setErr(null);
      try {
        const res = await fetch("/api/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: clientEmail,
            product: product || undefined,
            delay_days: delayDays,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Erreur estimation");
        if (!abort && data?.scheduled_at) {
          setScheduledAt(data.scheduled_at);
        }
      } catch (e: any) {
        if (!abort) setErr(e?.message || "Erreur estimation");
      } finally {
        if (!abort) setEstimating(false);
      }
    }
    run();
    return () => {
      abort = true;
    };
    // relance quand product ou delayDays changent
  }, [clientEmail, product, delayDays]);

  // 2) Générer un message via /api/reminders/generate
  async function generateMessage() {
    setGenerating(true);
    setErr(null);
    try {
      const res = await fetch("/api/reminders/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          first_name: undefined, // le backend peut aller chercher settings et/ou client si besoin
          product: product || undefined,
          delayDays,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur génération");
      setMessage(data?.message ?? "");
    } catch (e: any) {
      setErr(e?.message || "Erreur génération");
    } finally {
      setGenerating(false);
    }
  }

  // 3) Créer la relance via /api/reminders
  async function createReminder() {
    if (!canCreate) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_email: clientEmail,
          product: product || undefined,
          delay_days: delayDays,
          channel,
          scheduled_at: scheduledAt || undefined,
          message: message || undefined,
          status: "scheduled",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Erreur création");
      onCreated?.();
      onClose();
    } catch (e: any) {
      setErr(e?.message || "Erreur création");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1E3A5F]">Créer une relance</h2>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-sm bg-black/5">
            Fermer
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="text-sm">
            <div className="text-black/60">Client</div>
            <div className="font-medium">{clientEmail}</div>
          </div>

          <label className="block text-sm">
            Produit
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="Croquettes 10kg"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Délai (jours)
              <input
                type="number"
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={delayDays}
                onChange={(e) => setDelayDays(Number(e.target.value || 0))}
                min={0}
              />
            </label>

            <label className="block text-sm">
              Canal
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={channel}
                onChange={(e) => setChannel(e.target.value as Channel)}
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </label>
          </div>

          <label className="block text-sm">
            Date d’envoi (ISO, UTC)
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 font-mono text-sm"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              placeholder="2025-08-03T00:00:00.000Z"
            />
            <div className="mt-1 text-xs text-black/50">
              {estimating ? "Estimation…" : "Prérempli via /api/estimate"}
            </div>
          </label>

          <label className="block text-sm">
            Message
            <textarea
              className="mt-1 w-full min-h-[120px] rounded-xl border px-3 py-2"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Générer un message avec l’IA…"
            />
            <div className="mt-2">
              <button
                type="button"
                onClick={generateMessage}
                disabled={generating}
                className="rounded-xl bg-[#1E3A5F] px-3 py-2 text-white disabled:opacity-60"
              >
                {generating ? "Génération…" : "Générer avec l’IA"}
              </button>
            </div>
          </label>

          {err && <div className="text-sm text-red-600">❌ {String(err)}</div>}

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onClose} className="rounded-xl bg-black/10 px-4 py-2">
              Annuler
            </button>
            <button
              onClick={createReminder}
              disabled={!canCreate || saving}
              className="rounded-xl bg-[#4BC0A9] px-4 py-2 text-white disabled:opacity-60"
            >
              {saving ? "Création…" : "Créer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
