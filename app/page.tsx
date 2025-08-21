import Link from "next/link";

export default function Home() {
  return (
    <main>
      {/* HERO */}
      <section
        className="py-20 md:py-28"
        style={{ background: "linear-gradient(135deg,#1E3A5F 0%,#4BC0A9 60%)" }}
      >
        <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-2 gap-12 items-center">
          {/* Texte */}
          <div className="text-white">
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
              Relancez vos clients.<br />Automatiquement. Intelligemment.
            </h1>
            <p className="mt-6 text-white/90 text-lg max-w-md">
              Email, SMS, WhatsApp — l’IA personnalise le message et le timing.
              Vous branchez, Relansia travaille pour vous.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/app"
                className="rounded-2xl px-6 py-3 text-white text-lg font-medium shadow-lg"
                style={{ background: "#F2B441" }}
              >
                Démarrer gratuitement
              </Link>
              <Link
                href="/features"
                className="rounded-2xl px-6 py-3 text-white/90 text-lg font-medium border border-white/30 hover:bg-white/10"
              >
                Voir les fonctionnalités
              </Link>
            </div>
          </div>

          {/* Aperçu UI (mock) */}
          <div className="rounded-2xl shadow-xl border border-black/10 bg-white/95 p-6">
            <div className="text-sm text-black/60">Aperçu</div>
            <div className="mt-1 font-semibold text-[#1E3A5F]">Relances de la semaine</div>
            <ul className="mt-4 space-y-3">
              <li className="rounded-xl bg-black/5 p-3 text-sm">
                Aucune relance pour l’instant — importez vos clients.
              </li>
              <li className="rounded-xl bg-black/5 p-3 text-sm">
                Exemple · Marie → Café 1kg • J+30
              </li>
              <li className="rounded-xl bg-black/5 p-3 text-sm">
                Exemple · Lucas → Shampooing • J+45
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* VALEURS */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 grid gap-8 md:grid-cols-3">
          {[
            {
              icon: "⚡",
              title: "Automatisation intelligente",
              text: "Relansia choisit quoi dire, à qui, quand — sans que vous ayez à y penser.",
            },
            {
              icon: "📲",
              title: "Multi-canal humain",
              text: "Email, SMS, WhatsApp — des messages naturels et personnalisés.",
            },
            {
              icon: "💰",
              title: "Plus de chiffre",
              text: "Réactivez vos clients au bon moment et augmentez le repeat.",
            },
          ].map((v) => (
            <div
              key={v.title}
              className="rounded-2xl bg-white shadow-lg p-8 border border-black/5 text-center"
            >
              <div className="text-3xl">{v.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-[#1E3A5F]">{v.title}</h3>
              <p className="mt-2 text-black/70 text-sm leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CAS D’USAGE */}
      <section className="bg-[#F7F9FB]">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-semibold text-center text-[#1E3A5F]">
            Cas d’usage concrets
          </h2>
          <p className="mt-3 text-center text-black/60 max-w-xl mx-auto">
            Relansia s’adapte à différents métiers de proximité et e-commerce.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Coffee shop",
                text: "Relance automatique pour ré-acheter le café après 30 jours.",
              },
              {
                title: "Salon de coiffure",
                text: "Proposez un nouveau rendez-vous ou shampooing après 45 jours.",
              },
              {
                title: "Animalerie",
                text: "Prévenez quand le stock de croquettes est presque fini.",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-2xl bg-white shadow-lg p-8 border border-black/5"
              >
                <h3 className="font-semibold text-[#1E3A5F] text-lg">{c.title}</h3>
                <p className="mt-2 text-black/70 text-sm leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-semibold text-center text-[#1E3A5F]">Tarifs simples</h2>
          <p className="mt-3 text-center text-black/60 max-w-xl mx-auto">
            Choisissez le plan adapté à votre activité. Rechargez vos tokens à la demande.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { name: "Starter", price: "19€", desc: "Idéal pour commencer" },
              { name: "Pro", price: "49€", desc: "Pour les commerces actifs" },
              { name: "Business", price: "99€", desc: "Pour un suivi intensif" },
            ].map((p) => (
              <div
                key={p.name}
                className="rounded-2xl bg-[#F7F9FB] shadow p-8 border border-black/5 flex flex-col"
              >
                <h3 className="font-semibold text-[#1E3A5F] text-lg">{p.name}</h3>
                <div className="mt-4 text-3xl font-bold text-[#1E3A5F]">{p.price}</div>
                <p className="mt-2 text-black/60 text-sm">{p.desc}</p>
                <ul className="mt-4 space-y-2 text-sm text-black/70 flex-1">
                  <li>✔ Relances intelligentes</li>
                  <li>✔ Email, SMS, WhatsApp</li>
                  <li>✔ Tableau de bord</li>
                </ul>
                <Link
                  href="/app"
                  className="mt-6 rounded-2xl px-5 py-3 text-center text-white font-medium shadow"
                  style={{ background: "#F2B441" }}
                >
                  Choisir {p.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section
        className="py-20 text-center"
        style={{ background: "linear-gradient(135deg,#4BC0A9 0%,#1E3A5F 60%)" }}
      >
        <h2 className="text-3xl font-semibold text-white">
          Prêt à relancer vos clients intelligemment ?
        </h2>
        <p className="mt-4 text-white/80 max-w-xl mx-auto">
          Importez votre base en 2 minutes. L’IA s’occupe du reste.
        </p>
        <div className="mt-8">
          <Link
            href="/app"
            className="rounded-2xl px-8 py-4 text-white text-lg font-medium shadow-lg"
            style={{ background: "#F2B441" }}
          >
            Démarrer gratuitement
          </Link>
        </div>
      </section>
    </main>
  );
}
