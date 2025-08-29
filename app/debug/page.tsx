"use client";

import { useState } from "react";
import ReminderModal from "@/components/ReminderModal";
import { useStore } from "@/lib/store";

export default function DebugReminderPage() {
  const clients = useStore((s) => s.clients);
  const [open, setOpen] = useState(false);
  const [prefillEmail, setPrefillEmail] = useState<string>("");

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Debug Reminder</h1>

      <div className="mb-4 flex items-center gap-3">
        <select
          className="rounded-lg border px-3 py-2"
          value={prefillEmail}
          onChange={(e) => setPrefillEmail(e.target.value)}
        >
          <option value="">— choisir un client —</option>
          {clients.map((c) => (
            <option key={c.email ?? ""} value={c.email as string}>
              {c.first_name || c.last_name ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() : c.email}
            </option>
          ))}
        </select>

        <button
          onClick={() => setOpen(true)}
          disabled={!prefillEmail}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          Ouvrir le ReminderModal
        </button>
      </div>

      <p className="text-sm text-gray-600">
        Astuce : importe d’abord quelques clients (via ton écran d’import) pour
        les voir ici. Ensuite ouvre le modal, génère le message avec l’IA, puis
        enregistre la relance → ton cron pourra la dépiler.
      </p>

      <ReminderModal
        open={open}
        onClose={() => setOpen(false)}
        clientEmail={prefillEmail}
      />
    </div>
  );
}
