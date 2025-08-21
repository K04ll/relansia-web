"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store"; // ton store clients existant

type Channel = "email" | "sms" | "whatsapp";

type Props = {
  open: boolean;
  onClose: VoidFunction;
  // si tu l’ouvres déjà sur un client précis
  clientEmail?: string;
};

export default function ReminderModal({ open, onClose, clientEmail }: Props) {
  const clients = useStore((s) => s.clients);

  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const [channel, setChannel] = useState<Channel>("email");
  const [product, setProduct] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loadingGen, setLoadingGen] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const selClient = useMemo(
    () => clients.find((c) => c.email === selectedEmail),
    [clients, selectedEmail]
  );

  // initialise si un email est donné
  useEffect(() => {
    if (clientEmail) setSelectedEmail(clientEmail);
  }, [clientEmail]);

  // préremplir produit si client trouvé
  useEffect(() => {
    if (selClient?.product) setProduct(selClient.product);
  }, [selClient?.product]);

  // helper: datetime-local ISO
  function nowPlus(minutes = 5) {
    const d = new Date(Date.now() + minutes * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return local;
  }
  useEffect(() => {
    if (!scheduledAt) setScheduledAt(nowPlus(5));
  }, [scheduledAt]);

  async function handleGenerate() {
    try {
      setError("");
      setLoadingGen(true);

      const body = {
        channel,
        first_name: selClient?.first_name ?? "",
        last_name: selClient?.last_name ?? "",
        product: product || selClient?.product || "",
        purchased_at: selClient?.purchased_at ?? null,
        shopName: undefined,     // optionnel: on peut l’injecter depuis /api/settings si tu veux
        signature: undefined,    // idem
        delayDays: undefined,
      };

      const res = await fetch("/api/reminders/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Échec génération IA");
      setMessage(data.message ?? "");
    } catch (e: any) {
      setError(e?.message || "Erreur inattendue (IA)");
    } finally {
      setLoadingGen(false);
    }
  }

  async function handleSave() {
    try {
      setError("");
      if (!selectedEmail) throw new Error("Choisis un client valide.");
      if (!scheduledAt) throw new Error("Choisis une date d’envoi.");
      if (!channel) throw new Error("Choisis un canal.");

      setSaving(true);

      // convertir datetime-local en ISO
      const iso = new Date(scheduledAt).toISOString();

      const payload = {
  client_email: selectedEmail,
  product: product || null,
  delay_days: null,
  channel,
  scheduled_at: iso,
  message: message || null,
  status: "scheduled" as const,
};


      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Échec création relance");

      // reset & close
      setMessage("");
      onClose();
    } catch (e: any) {
      setError(e?.message || "Erreur inattendue (save)");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Créer une relance</h2>
          <button
            onClick={onClose}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Client */}
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">Client</span>
            <select
              className="rounded-lg border px-3 py-2"
              value={selectedEmail}
              onChange={(e) => setSelectedEmail(e.target.value)}
            >
              <option value="">— choisir —</option>
              {clients.map((c) => (
                <option key={c.email} value={c.email}>
                  {c.first_name || c.last_name ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() : c.email}
                </option>
              ))}
            </select>
          </label>

          {/* Canal */}
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">Canal</span>
            <select
              className="rounded-lg border px-3 py-2"
              value={channel}
              onChange={(e) => setChannel(e.target.value as Channel)}
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </label>

          {/* Produit */}
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-sm text-gray-600">Produit</span>
            <input
              className="rounded-lg border px-3 py-2"
              placeholder="Ex: Croquettes 10kg"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
            />
          </label>

          {/* Date/heure d’envoi */}
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">Envoi prévu</span>
            <input
              type="datetime-local"
              className="rounded-lg border px-3 py-2"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </label>

          {/* Génération IA */}
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={loadingGen || !selectedEmail}
              className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {loadingGen ? "Génération..." : "Générer avec IA"}
            </button>
          </div>

          {/* Message */}
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-sm text-gray-600">Message</span>
            <textarea
              className="min-h-[140px] rounded-lg border px-3 py-2"
              placeholder="Le message généré apparaîtra ici (modifiable)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedEmail || !scheduledAt || !channel}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer la relance"}
          </button>
        </div>
      </div>
    </div>
  );
}
