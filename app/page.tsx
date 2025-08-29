// app/page.tsx
export default function Home() {
  return (
    <main id="main" className="min-h-[70vh] bg-background text-foreground">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-10 text-center">
        <p className="inline-block rounded-full border border-border px-3 py-1 text-xs text-text-dim">
          Relances post-achat pour e-commerce
        </p>
        <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
          Faites revenir vos clients, automatiquement.
        </h1>
        <p className="mt-4 text-text-dim">
          Email · SMS · WhatsApp — envois au bon moment, fenêtres horaires et fuseaux intégrés, RGPD compris.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a href="/app" className="rounded-xl bg-primary px-5 py-2.5 text-white shadow focus:outline-none focus:ring-2 focus:ring-ring">
            Démarrer l’essai gratuit
          </a>
          <a href="/pricing" className="rounded-xl border border-border px-5 py-2.5 hover:bg-surface">
            Voir les tarifs
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 grid gap-4 md:grid-cols-3">
        {[
          { t: "Relances intelligentes", d: "J+1 · J+7 · J+30, fenêtres horaires & fuseaux par boutique." },
          { t: "Emails premium + IA", d: "Templates 2025, aperçu instantané, bouton “Améliorer avec IA”." },
          { t: "RGPD & Unsubscribe", d: "Désinscription 1 clic via Supabase, logs {code,message}." },
        ].map((f) => (
          <div key={f.t} className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="text-lg font-medium">{f.t}</h3>
            <p className="mt-1 text-sm text-text-dim">{f.d}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-14">
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <h2 className="text-2xl font-semibold">Prêt à faire revenir vos clients automatiquement ?</h2>
          <p className="mt-2 text-text-dim">Essai gratuit · sans carte · RGPD & unsubscribe intégrés.</p>
          <a href="/app" className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-white shadow focus:outline-none focus:ring-2 focus:ring-ring">
            Commencer maintenant
          </a>
        </div>
      </section>
    </main>
  );
}
