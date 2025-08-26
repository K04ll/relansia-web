"use client";

import { motion } from "framer-motion";

const faqs = [
  {
    q: "Est-ce que Relansia va spammer mes clients ?",
    a: "Non. Relansia respecte vos créneaux (jours/horaires) et ajoute toujours STOP/UNSUB. Des messages utiles, au bon moment.",
  },
  {
    q: "Dois-je écrire moi-même les emails/SMS ?",
    a: "Non. L’IA génère vos relances automatiquement. Vous pouvez ajouter vos offres (ex. -30%) et Relansia adapte le message.",
  },
  {
    q: "Combien de temps pour installer ?",
    a: "En moyenne 10 minutes : import CSV, paramètres de base, vos offres. Pas de code, pas de complexité.",
  },
  {
    q: "C’est sécurisé ?",
    a: "Oui : RGPD, données chiffrées, fournisseurs certifiés (Resend, Twilio). Vos secrets ne quittent jamais le serveur.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl font-semibold tracking-tight text-center"
        >
          Questions fréquentes
        </motion.h2>

        <div className="mt-10 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-white/70 dark:bg-black/40 backdrop-blur">
          {faqs.map((item, idx) => (
            <details
              key={item.q}
              className="group open:bg-[var(--surface)]/70 transition"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-5">
                <span className="font-medium">{item.q}</span>
                <span className="text-sm text-[var(--text-dim)] group-open:hidden">+</span>
                <span className="text-sm text-[var(--text-dim)] hidden group-open:block">−</span>
              </summary>
              <div className="px-6 pb-5 text-sm text-[var(--text-dim)]">{item.a}</div>
              {idx < faqs.length - 1 && <div className="h-px w-full bg-[var(--border)]" />}
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
