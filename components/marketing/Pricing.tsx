"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type Plan = {
  name: string;
  price: string;
  highlight?: boolean;
  bullets: string[];
  tokens: string; // affichage simple
  impact: { clients: string; ca: string };
  cta: { label: string; href: string };
};

const plans: Plan[] = [
  {
    name: "Starter",
    price: "19 € / mois",
    bullets: [
      "IA de timing prédictif",
      "Messages personnalisés",
      "Tableau de bord (CA & clients)",
    ],
    tokens: "Inclus : 550 tokens",
    impact: { clients: "~9–18", ca: "~540–1 080 €" },
    cta: { label: "Choisir Starter", href: "/signup?plan=starter" },
  },
  {
    name: "Pro",
    price: "49 € / mois",
    highlight: true,
    bullets: [
      "Email · SMS · WhatsApp",
      "Envois au bon moment",
      "Relances back-office",
    ],
    tokens: "Inclus : 1 400 tokens",
    impact: { clients: "~23–46", ca: "~1 380–2 760 €" },
    cta: { label: "Choisir Pro", href: "/signup?plan=pro" },
  },
  {
    name: "Business",
    price: "99 € / mois",
    bullets: [
      "Multi-boutiques & rôles",
      "KPIs temps réel & exports",
      "Onboarding assisté",
    ],
    tokens: "Inclus : 2 800 tokens",
    impact: { clients: "~46–93", ca: "~2 760–5 580 €" },
    cta: { label: "Parler à un expert", href: "/contact?topic=sales" },
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl font-semibold tracking-tight"
        >
          Tarifs simples, orientés résultats
        </motion.h2>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className={[
                "rounded-2xl border p-6 backdrop-blur",
                "border-[var(--border)] bg-white/70 dark:bg-black/40",
                p.highlight ? "shadow-xl ring-1 ring-indigo-500/20" : "shadow-sm",
              ].join(" ")}
            >
              {p.highlight && (
                <div className="mb-3 inline-flex items-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-0.5 text-xs">
                  Le plus populaire
                </div>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <div className="mt-1 text-2xl font-semibold">{p.price}</div>

              <ul className="mt-4 space-y-2 text-sm text-[var(--text-dim)]">
                {p.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span>•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 text-sm">{p.tokens}</div>

              <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 p-4">
                <div className="text-sm font-medium">Exemple d’impact (mois)</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-[var(--text-dim)]">Clients revenus</div>
                    <div className="font-medium">{p.impact.clients}</div>
                  </div>
                  <div>
                    <div className="text-[var(--text-dim)]">CA récupéré</div>
                    <div className="font-medium">{p.impact.ca}</div>
                  </div>
                </div>
              </div>

              <Link
                href={p.cta.href}
                className={[
                  "mt-6 inline-flex w-full justify-center rounded-xl px-5 py-3 font-medium transition",
                  p.highlight
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "border border-[var(--border)] hover:bg-[var(--surface)]/60",
                ].join(" ")}
              >
                {p.cta.label}
              </Link>

              <p className="mt-3 text-xs text-[var(--text-dim)]">
                Fonctionne par tokens (Email=1 · SMS=8 · WhatsApp=6). Équivalences en tooltip.
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
