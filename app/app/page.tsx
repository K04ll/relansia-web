"use client";
import { useEffect } from "react";
import { useSettingsStore } from "@/lib/stores/settings";

export default function SettingsPage() {
  const { settings, load, setSettings, save } = useSettingsStore();

  useEffect(() => {
    load();
  }, [load]);

  if (!settings) return <div className="p-6">Chargement…</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-[#1E3A5F]">Paramètres</h1>
      <p className="mt-2 text-black/60">
        Nom boutique, canal par défaut, fenêtre d’envoi, signature.
      </p>

      <div className="mt-6 grid gap-4">
        <label className="text-sm">
          Nom de la boutique
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={settings.shop_name ?? ""}
            onChange={(e) => setSettings({ shop_name: e.target.value })}
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="text-sm">
            Canal par défaut
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={settings.default_channel ?? "email"}
              onChange={(e) =>
                setSettings({ default_channel: e.target.value as any })
              }
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </label>

          <label className="text-sm">
            Pays par défaut (E.164)
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={settings.default_country ?? "FR"}
              onChange={(e) =>
                setSettings({ default_country: e.target.value })
              }
            />
          </label>

          <label className="text-sm">
            Début (h)
            <input
              type="number"
              min={0}
              max={23}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={settings.send_start_hour ?? 9}
              onChange={(e) =>
                setSettings({ send_start_hour: Number(e.target.value) })
              }
            />
          </label>

          <label className="text-sm">
            Fin (h)
            <input
              type="number"
              min={1}
              max={24}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={settings.send_end_hour ?? 19}
              onChange={(e) =>
                setSettings({ send_end_hour: Number(e.target.value) })
              }
            />
          </label>
        </div>

        <label className="text-sm">
          Signature
          <textarea
            className="mt-1 w-full min-h-[100px] rounded-xl border px-3 py-2"
            value={settings.signature ?? ""}
            onChange={(e) => setSettings({ signature: e.target.value })}
          />
        </label>
      </div>

      <div className="mt-6">
        <button
          onClick={save}
          className="px-4 py-2 rounded-xl bg-[#4BC0A9] text-white"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}
