"use client";

import { useEffect, useState } from "react";

type Rule = {
  id: string;
  delay_days: number;
  channel: "email" | "sms" | "whatsapp";
  message_template: string | null;
};

export default function OnboardingStep3() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<string | null>(null);

  // Formulaire
  const [delayDays, setDelayDays] = useState<number>(1);
  const [channel, setChannel] = useState<"email" | "sms" | "whatsapp">("email");
  const [message, setMessage] = useState<string>("");

  async function loadRules() {
    setLoading(true);
    const res = await fetch("/api/reminder-rules");
    const data = await res.json();
    setRules(data);
    setLoading(false);
  }

  useEffect(() => {
    loadRules();
  }, []);

  async function addRule(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/reminder-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        delay_days: delayDays,
        channel,
        message_template: message,
      }),
    });
    if (res.ok) {
      await loadRules();
      setDelayDays(1);
      setChannel("email");
      setMessage("");
    }
  }

  async function deleteRule(id: string) {
    await fetch(`/api/reminder-rules?id=${id}`, { method: "DELETE" });
    await loadRules();
  }

  async function applyRules() {
    setApplying(true);
    setApplyResult(null);
    const res = await fetch("/api/reminder-rules/apply", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setApplying(false);

    if (!res.ok) {
      setApplyResult(data?.error || "Erreur lors de l'application des règles.");
      return;
    }
    setApplyResult(`Créées: ${data.created ?? 0} • Ignorées: ${data.skipped ?? 0}`);
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">
        Étape 3 : Règles de relances par défaut
      </h1>

      {/* Liste */}
      {loading ? (
        <p>Chargement...</p>
      ) : rules.length === 0 ? (
        <p className="text-gray-500">Aucune règle définie pour le moment.</p>
      ) : (
        <ul className="space-y-3 mb-6">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="flex justify-between items-center border p-3 rounded-lg"
            >
              <div>
                <p>
                  <span className="font-semibold">J+{rule.delay_days}</span> →{" "}
                  <span className="capitalize">{rule.channel}</span>
                </p>
                {rule.message_template && (
                  <p className="text-sm text-gray-600">{rule.message_template}</p>
                )}
              </div>
              <button
                onClick={() => deleteRule(rule.id)}
                className="text-red-500 hover:underline"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Formulaire ajout */}
      <form onSubmit={addRule} className="border p-4 rounded-lg space-y-4 bg-gray-50">
        <h2 className="text-lg font-semibold">Ajouter une règle</h2>

        <div>
          <label className="block text-sm font-medium">Délai (jours)</label>
          <input
            type="number"
            min="1"
            value={delayDays}
            onChange={(e) => setDelayDays(Number(e.target.value))}
            className="mt-1 p-2 border rounded w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Canal</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as any)}
            className="mt-1 p-2 border rounded w-full"
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Message par défaut</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 p-2 border rounded w-full"
            placeholder="Votre message personnalisé..."
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Ajouter la règle
        </button>
      </form>

      {/* Call-to-action : appliquer les règles */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={applyRules}
          disabled={applying}
          className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {applying ? "Application en cours..." : "Appliquer ces règles maintenant"}
        </button>
        {applyResult && <span className="text-sm text-gray-700">{applyResult}</span>}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <a
          href="/app/onboarding/step2"
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          ← Précédent
        </a>
        <a
          href="/app/onboarding/step4"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Suivant →
        </a>
      </div>
    </div>
  );
}
