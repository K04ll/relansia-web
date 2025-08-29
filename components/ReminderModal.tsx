"use client";

import { useEffect, useMemo, useState } from "react";

/** Type minimal côté UI : pas de `product` ici */
export type ClientLite = {
  id: string;
  email: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  clients: ClientLite[];
  /** Optionnel : préremplir un produit par client si dispo */
  prefillByClientId?: Record<string, string | undefined>;
  /** Callback quand on confirme l’envoi */
  onConfirm: (payload: {
    clientId: string;
    channel: "email" | "sms" | "whatsapp";
    product: string;
    sendAtISO: string; // ISO string (UTC) depuis <input type="datetime-local">
  }) => Promise<void> | void;
};

export default function ReminderModal({
  open,
  onClose,
  clients,
  prefillByClientId,
  onConfirm,
}: Props) {
  const [clientId, setClientId] = useState<string>("");
  const [channel, setChannel] = useState<"email" | "sms" | "whatsapp">("email");
  const [product, setProduct] = useState<string>("");
  const [sendAt, setSendAt] = useState<string>(""); // datetime-local value
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // options triées : nom affiché ou email
  const options = useMemo(() => {
    return (clients ?? []).map((c) => {
      const name = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim();
      return {
        id: c.id,
        label: name || c.email || "— sans email —",
        value: c.id,
        email: c.email ?? "",
      };
    });
  }, [clients]);

  // Préremplir le produit si prefillByClientId existe
  useEffect(() => {
    if (!clientId || !prefillByClientId) return;
    const pre = prefillByClientId[clientId];
    if (pre && !product) setProduct(pre);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, prefillByClientId]);

  if (!open) return null;

  const canSubmit = clientId && product && sendAt;

  const onSubmit = async () => {
    setError(null);
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // convert local datetime to ISO (assume local timezone -> ISO)
      const iso = new Date(sendAt).toISOString();
      await onConfirm({
        clientId,
        channel,
        product,
        sendAtISO: iso,
      });
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => !submitting && onClose()}
      />
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl border border-black/10 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="reminder-title" className="text-lg font-semibold">
            Programmer une relance
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            aria-label="Fermer"
            className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Client */}
          <div className="grid gap-1">
            <label className="text-sm font-medium">Client</label>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">— choisir un client —</option>
              {options.map((o) => (
                <option key={o.id} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Canal */}
          <div className="grid gap-1">
            <label className="text-sm font-medium">Canal</label>
            <div className="flex gap-2">
              {(["email", "sms", "whatsapp"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChannel(c)}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    channel === c
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  aria-pressed={channel === c}
                >
                  {c.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Produit */}
          <div className="grid gap-1">
            <label className="text-sm font-medium">Produit</label>
            <input
              type="text"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="Nom du produit (ex: Coffret soin visage)"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Date/heure */}
          <div className="grid gap-1">
            <label className="text-sm font-medium">Date & heure d’envoi</label>
            <input
              type="datetime-local"
              value={sendAt}
              onChange={(e) => setSendAt(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500">
              L’envoi respecte les fenêtres horaires définies dans vos
              paramètres.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit || submitting}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {submitting ? "Programmation..." : "Programmer"}
          </button>
        </div>
      </div>
    </div>
  );
}
