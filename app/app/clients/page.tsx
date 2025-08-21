"use client";

import { useStore } from "@/lib/store";

export default function ClientsPage() {
  const clients = useStore((s) => s.clients);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-[#1E3A5F]">Clients</h1>

      {/* Empty state */}
      {clients.length === 0 ? (
        <div className="rounded-2xl bg-white shadow p-6 border border-black/5 text-black/70">
          Aucun client importé pour l’instant. <br />
          <a href="/app/onboarding/step1" className="underline text-[#1E3A5F] font-medium">
            Importer un CSV
          </a>
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow p-6 border border-black/5">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm bg-white rounded-xl border border-black/10">
              <thead className="bg-[#F7F9FB] text-[#1E3A5F]">
                <tr className="text-left">
                  <th className="px-3 py-2 border-b border-black/10">Nom</th>
                  <th className="px-3 py-2 border-b border-black/10">Email</th>
                  <th className="px-3 py-2 border-b border-black/10">Téléphone</th>
                  <th className="px-3 py-2 border-b border-black/10">Produit</th>
                  <th className="px-3 py-2 border-b border-black/10">Quantité</th>
                  <th className="px-3 py-2 border-b border-black/10">Dernier achat</th>
                </tr>
              </thead>
              <tbody className="text-black/80">
                {clients.map((c, i) => (
                  <tr key={i} className="odd:bg-black/[0.02] hover:bg-black/[0.04] transition">
                    <td className="px-3 py-2 border-b border-black/10">
                      {(c.first_name || "").trim()} {(c.last_name || "").trim()}
                    </td>
                    <td className="px-3 py-2 border-b border-black/10">{c.email || ""}</td>
                    <td className="px-3 py-2 border-b border-black/10">{c.phone || ""}</td>
                    <td className="px-3 py-2 border-b border-black/10">{c.product || ""}</td>
                    <td className="px-3 py-2 border-b border-black/10">{c.quantity ?? ""}</td>
                    <td className="px-3 py-2 border-b border-black/10">{c.purchased_at || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-sm text-black/60">
            {clients.length} client(s) importé(s).
          </div>
        </div>
      )}
    </div>
  );
}
