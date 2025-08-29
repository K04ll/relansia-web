// app/pricing/page.tsx
export default function Pricing() {
  const tiers = [
    { id: "Starter", price: 19, tokens: 550, perks: ["Emails premium", "Unsubscribe & RGPD"] },
    { id: "Pro", price: 49, tokens: 1400, perks: ["Tout Starter", "Auto-recharge <20%"] },
    { id: "Business", price: 99, tokens: 2800, perks: ["Tout Pro", "Support prioritaire"] },
  ];
  const equiv = (t: number) => `≈ ${t} emails · ${Math.floor(t/8)} SMS · ${Math.floor(t/6)} WhatsApp`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Tarifs</h1>
      <p className="mt-2 text-text-dim">Packs mensuels en tokens. Auto-recharge activée par défaut quand le solde &lt; 20%.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {tiers.map((t) => (
          <div key={t.id} className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium">{t.id}</h2>
            </div>
            <div className="mt-2 text-3xl font-semibold">{t.price}€<span className="text-sm text-text-dim"> /mois</span></div>
            <div className="text-sm text-text-dim">{t.tokens} tokens · {equiv(t.tokens)}</div>
            <ul className="mt-4 space-y-2 text-sm">
              {t.perks.map((p) => <li key={p}>• {p}</li>)}
            </ul>
            <a href="/app" className="mt-6 inline-block w-full rounded-xl bg-primary px-4 py-2 text-center text-white">Choisir {t.id}</a>
          </div>
        ))}
      </div>
    </main>
  );
}
