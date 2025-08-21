"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

// Import dynamique du modal (désactive SSR) + fallback très permissif
const ReminderModal: any = dynamic(
  () => import("@/components/ReminderModal").then((m) => m.default ?? m),
  { ssr: false }
);

// Types minimas, tolérants (évite les erreurs de props)
type Reminder = {
  id: string;
  client_id: string;
  channel: "email" | "sms" | "whatsapp";
  message: string | null;
  status: "scheduled" | "sent" | "canceled" | "draft" | "failed";
  scheduled_at: string | null;
  created_at: string;
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Si ton ReminderModal attend un "reminder" complet, on stocke simplement le Reminder sélectionné
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);

  // Récupération de la liste
  async function loadReminders() {
    try {
      setLoading(true);
      const res = await fetch("/api/reminders");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur de chargement");
      setReminders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReminders();
  }, []);

  // Actions Patch (cancel / send_now)
  async function patchReminder(id: string, action: "cancel" | "send_now" | "draft") {
    try {
      await fetch(`/api/reminders?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      await loadReminders();
    }
  }

  // --- 📊 Stats
  const stats = useMemo(() => {
    const base = { scheduled: 0, sent: 0, failed: 0, canceled: 0 };
    for (const r of reminders) {
      if (r.status === "scheduled") base.scheduled++;
      else if (r.status === "sent") base.sent++;
      else if (r.status === "failed") base.failed++;
      else if (r.status === "canceled") base.canceled++;
    }
    return base;
  }, [reminders]);

  // Format date sûr
  function fmt(dateISO: string | null) {
    if (!dateISO) return "—";
    const d = new Date(dateISO);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  }

  // Badge statut
  function badge(status: Reminder["status"]) {
    const base = "px-2 py-1 rounded text-xs";
    if (status === "sent") return <span className={`${base} bg-green-100 text-green-700`}>sent</span>;
    if (status === "scheduled") return <span className={`${base} bg-blue-100 text-blue-700`}>scheduled</span>;
    if (status === "failed") return <span className={`${base} bg-red-100 text-red-700`}>failed</span>;
    if (status === "canceled") return <span className={`${base} bg-gray-200 text-gray-700`}>canceled</span>;
    return <span className={`${base} bg-gray-100 text-gray-700`}>{status}</span>;
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold mb-6">📌 Dashboard des relances</h1>

      {/* 📊 Cartes de stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-blue-100 text-blue-700 text-center">
          <p className="text-2xl font-bold">{stats.scheduled}</p>
          <p className="text-sm">Planifiées</p>
        </div>
        <div className="p-4 rounded-xl bg-green-100 text-green-700 text-center">
          <p className="text-2xl font-bold">{stats.sent}</p>
          <p className="text-sm">Envoyées</p>
        </div>
        <div className="p-4 rounded-xl bg-red-100 text-red-700 text-center">
          <p className="text-2xl font-bold">{stats.failed}</p>
          <p className="text-sm">Échecs</p>
        </div>
        <div className="p-4 rounded-xl bg-gray-200 text-gray-700 text-center">
          <p className="text-2xl font-bold">{stats.canceled}</p>
          <p className="text-sm">Annulées</p>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <p>Chargement…</p>
      ) : reminders.length === 0 ? (
        <p className="text-gray-500">Aucune relance trouvée.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">Canal</th>
                <th className="p-2 border">Message</th>
                <th className="p-2 border">Statut</th>
                <th className="p-2 border">Planifié</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reminders.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="p-2 border capitalize">{r.channel}</td>
                  <td className="p-2 border text-xs md:text-sm truncate max-w-xs">
                    {r.message ?? "—"}
                  </td>
                  <td className="p-2 border">{badge(r.status)}</td>
                  <td className="p-2 border">{fmt(r.scheduled_at)}</td>
                  <td className="p-2 border">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSelectedReminder(r)}
                        className="text-blue-600 hover:underline"
                      >
                        Voir
                      </button>

                      {r.status === "scheduled" && (
                        <>
                          <button
                            onClick={() => patchReminder(r.id, "send_now")}
                            className="text-green-600 hover:underline"
                          >
                            Envoyer maintenant
                          </button>
                          <button
                            onClick={() => patchReminder(r.id, "cancel")}
                            className="text-red-600 hover:underline"
                          >
                            Annuler
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal (permissif sur les props pour éviter les erreurs de types) */}
      {selectedReminder && !!ReminderModal && (
        <ReminderModal
          reminder={selectedReminder}
          onClose={() => setSelectedReminder(null)}
          onUpdated={loadReminders}
        />
      )}
    </div>
  );
}
