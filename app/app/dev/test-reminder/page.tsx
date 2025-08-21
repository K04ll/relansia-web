"use client";

import { useState } from "react";
import { useReminders } from "@/lib/reminders";
import type { Client, Channel } from "@/lib/types";

export default function TestReminderPage() {
  const { addAndSaveReminder } = useReminders();
  const [email, setEmail] = useState("marie@test.com");
  const [product, setProduct] = useState("Croquettes 10kg");
  const [channel, setChannel] = useState<Channel>("email");
  const [delayDays, setDelayDays] = useState(0);
  const [scheduledAt, setScheduledAt] = useState(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString()
  );
  const [message, setMessage] = useState("Message de test");
  const [out, setOut] = useState<string>("");

  async function run() {
    setOut("⏳ En cours…");
    const client: Client = {
      first_name: "Marie",
      last_name: "Test",
      email,
      phone: "",
      product,
      quantity: "10 kg",
      purchased_at: new Date().toISOString(),
    };

    const res = await addAndSaveReminder(client, {
      product,
      delayDays,
      channel,
      scheduledAt,
      message,
    });

    if (res) setOut("✅ OK — créé local + DB (reminders).");
    else setOut("❌ Échec — voir console pour l’erreur (addAndSaveReminder).");
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-[#1E3A5F]">Test addAndSaveReminder</h1>
      <div className="mt-6 grid gap-3">
        <label className="text-sm">
          Email client
          <input className="mt-1 w-full rounded-xl border px-3 py-2"
            value={email} onChange={e=>setEmail(e.target.value)} />
        </label>
        <label className="text-sm">
          Produit
          <input className="mt-1 w-full rounded-xl border px-3 py-2"
            value={product} onChange={e=>setProduct(e.target.value)} />
        </label>
        <label className="text-sm">
          Canal
          <select className="mt-1 w-full rounded-xl border px-3 py-2"
            value={channel} onChange={e=>setChannel(e.target.value as Channel)}>
            <option value="email">email</option>
            <option value="sms">sms</option>
            <option value="whatsapp">whatsapp</option>
          </select>
        </label>
        <label className="text-sm">
          Delay (jours)
          <input type="number" className="mt-1 w-full rounded-xl border px-3 py-2"
            value={delayDays} onChange={e=>setDelayDays(Number(e.target.value))} />
        </label>
        <label className="text-sm">
          scheduledAt (ISO)
          <input className="mt-1 w-full rounded-xl border px-3 py-2"
            value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} />
        </label>
        <label className="text-sm">
          Message
          <textarea className="mt-1 w-full min-h-[90px] rounded-xl border px-3 py-2"
            value={message} onChange={e=>setMessage(e.target.value)} />
        </label>
        <button onClick={run}
          className="mt-2 px-4 py-2 rounded-xl bg-[#4BC0A9] text-white">
          Créer (store → Supabase)
        </button>
        {out && <div className="text-sm mt-2">{out}</div>}
      </div>
    </div>
  );
}
