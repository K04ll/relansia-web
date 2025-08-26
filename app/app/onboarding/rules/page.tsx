// app/app/onboarding/rules/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Channel = "email" | "sms" | "whatsapp";
type Rule = {
  id?: string;
  delay_days: number;
  channel: Channel;
  template?: string | null;
  position: number;
  enabled: boolean;
};

function cls(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

export default function RulesStep() {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Charger règles
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("/api/reminder-rules", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || "Erreur chargement");
        setRules((data.rules || []).map((r: any, i: number) => ({ ...r, position: i })));
      } catch (e: any) {
        setErr(e.message || "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function normalizePositions(list: Rule[]) {
    return list
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((r, i) => ({ ...r, position: i }));
  }

  // DnD (HTML5)
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  function onDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  function onDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const arr = [...rules];
    const [moved] = arr.splice(dragIndex, 1);
    arr.splice(index, 0, moved);
    setRules(normalizePositions(arr));
    setDragIndex(null);
  }

  function addRule(preset?: Partial<Rule>) {
    const arr = [...rules, {
      delay_days: preset?.delay_days ?? 1,
      channel: preset?.channel ?? "email",
      template: preset?.template ?? null,
      position: rules.length,
      enabled: true,
    }];
    setRules(normalizePositions(arr));
  }

  function duplicate(index: number) {
    const src = rules[index];
    const arr = [...rules];
    const copy: Rule = { ...src, id: undefined, position: index + 1 };
    arr.splice(index + 1, 0, copy);
    setRules(normalizePositions(arr));
  }

  function remove(index: number) {
    const arr = [...rules];
    arr.splice(index, 1);
    setRules(normalizePositions(arr));
  }

  async function toggle(index: number, enabled: boolean) {
    const r = rules[index];
    setRules(rules.map((x, i) => i === index ? { ...x, enabled } : x));
    // Option optimiste: appeler PATCH pour toggle
    try {
      await fetch("/api/reminder-rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "toggle", id: r.id, enabled }),
      });
    } catch { /* ignore */ }
  }

  function setRule(index: number, patch: Partial<Rule>) {
    setRules(rules.map((r, i) => i === index ? { ...r, ...patch } : r));
  }

  async function saveAll() {
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const payload = { rules: normalizePositions(rules).map((r) => ({
        id: r.id,
        delay_days: Number(r.delay_days),
        channel: r.channel,
        template: r.template ?? null,
        position: r.position,
        enabled: !!r.enabled,
      })) };
      const res = await fetch("/api/reminder-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Erreur sauvegarde");
      setRules((data.rules || []).map((r: any, i: number) => ({ ...r, position: i })));
      setMsg("✅ Règles sauvegardées");
    } catch (e: any) {
      setErr(e.message || "Erreur");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 2500);
    }
  }

  async function preset(type: "J1" | "J2" | "J7") {
    if (!confirm("Remplacer les règles par le preset ?")) return;
    const map = {
      J1: [{ delay_days: 1, channel: "email" as Channel }],
      J2: [{ delay_days: 2, channel: "whatsapp" as Channel }],
      J7: [{ delay_days: 7, channel: "sms" as Channel }],
    }[type];
    const arr: Rule[] = map.map((r, i) => ({
      delay_days: r.delay_days,
      channel: r.channel,
      template: null,
      position: i,
      enabled: true,
    }));
    setRules(arr);
    await saveAll();
  }

  async function reorderOnServer(fromIndex: number, toIndex: number) {
    await fetch("/api/reminder-rules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "reorder", fromIndex, toIndex }),
    });
  }

  if (loading) return <div className="p-6">Chargement…</div>;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Règles de relance</h1>
        <div className="flex gap-2">
          <button onClick={() => preset("J1")} className="px-3 py-2 rounded-md border">Preset J+1</button>
          <button onClick={() => preset("J2")} className="px-3 py-2 rounded-md border">Preset J+2</button>
          <button onClick={() => preset("J7")} className="px-3 py-2 rounded-md border">Preset J+7</button>
          <button onClick={saveAll} disabled={saving} className="px-4 py-2 rounded-md bg-blue-600 text-white">
            {saving ? "Sauvegarde…" : "Sauvegarder"}
          </button>
        </div>
      </header>

      {msg && <div className="rounded-md bg-green-50 text-green-800 px-3 py-2">{msg}</div>}
      {err && <div className="rounded-md bg-red-50 text-red-800 px-3 py-2">{err}</div>}

      <div className="space-y-3">
        {rules.map((r, i) => (
          <div
            key={r.id ?? `tmp-${i}`}
            className={cls(
              "rounded-xl border p-4 bg-white/70 dark:bg-neutral-900/60 shadow-sm",
              "flex items-start gap-3"
            )}
            draggable
            onDragStart={(e) => onDragStart(e, i)}
            onDragOver={onDragOver}
            onDrop={(e) => { onDrop(e, i); reorderOnServer(dragIndex ?? i, i).catch(()=>{}); }}
          >
            <div className="cursor-grab select-none px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800">
              ⋮⋮
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <label className="text-sm">Délai (jours)</label>
                <input
                  type="number"
                  min={0}
                  value={r.delay_days}
                  onChange={(e) => setRule(i, { delay_days: Number(e.target.value || 0) })}
                  className="mt-1 w-full rounded-md border px-2 py-2 bg-white dark:bg-neutral-900"
                />
              </div>

              <div>
                <label className="text-sm">Canal</label>
                <select
                  value={r.channel}
                  onChange={(e) => setRule(i, { channel: e.target.value as Channel })}
                  className="mt-1 w-full rounded-md border px-2 py-2 bg-white dark:bg-neutral-900"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm">Message (optionnel)</label>
                <input
                  placeholder="Laisser vide pour template par défaut"
                  value={r.template ?? ""}
                  onChange={(e) => setRule(i, { template: e.target.value || null })}
                  className="mt-1 w-full rounded-md border px-2 py-2 bg-white dark:bg-neutral-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id={`enabled-${i}`}
                  type="checkbox"
                  checked={r.enabled}
                  onChange={(e) => toggle(i, e.target.checked)}
                />
                <label htmlFor={`enabled-${i}`} className="text-sm">Activer</label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={() => duplicate(i)} className="px-3 py-1 rounded-md border">Dupliquer</button>
              <button onClick={() => remove(i)} className="px-3 py-1 rounded-md border text-red-700">Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2">
        <button onClick={() => addRule()} className="px-4 py-2 rounded-md border">
          + Ajouter une règle
        </button>
      </div>

      <footer className="flex justify-end gap-2 pt-6">
  <button
    onClick={() => router.push("/app/onboarding/step2")}
    className="px-3 py-2 rounded-md border"
  >
    Retour
  </button>

  <button
    onClick={saveAll}
    disabled={saving}
    className="px-4 py-2 rounded-md bg-blue-600 text-white"
  >
    {saving ? "Sauvegarde…" : "Continuer"}
  </button>

  <button
    onClick={async () => {
      const res = await fetch("/api/reminders/generate", { method: "POST" });
      if (res.ok) {
        alert("✅ Relances activées et générées !");
        router.push("/app/reminders"); // redirige vers la page Reminders (Sprint 7)
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`❌ Erreur: ${data?.error?.message || "unknown"}`);
      }
    }}
    className="px-4 py-2 rounded-md bg-emerald-600 text-white"
  >
    Activer mes relances
  </button>
</footer>
    </div>
  );
}
