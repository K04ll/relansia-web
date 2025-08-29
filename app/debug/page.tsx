"use client";

import { useState } from "react";
import ReminderModal, { ClientLite } from "@/components/ReminderModal";
import { useStore } from "@/lib/store";

export default function DebugReminderPage() {
  const clients = useStore((s) => s.clients) as ClientLite[];
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Debug Reminder</h1>

      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          Programmer une relance
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
        clients={clients}
        onConfirm={(payload) => {
          console.log("Nouvelle relance programmée ✅", payload);
        }}
      />
    </div>
  );
}
