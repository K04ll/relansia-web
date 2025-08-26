"use client";

import { motion } from "framer-motion";
import {
  Gauge,
  Sparkles,
  Mail,
  Clock,
  FileCheck2,
  BadgeCheck,
} from "lucide-react";

const features = [
  {
    icon: Gauge,
    title: "Gains visibles",
    body: "CA récupéré, clients revenus, messages envoyés.",
  },
  {
    icon: Sparkles,
    title: "Messages personnalisés",
    body: "Prénom, produit, contexte. Des messages qui vous ressemblent.",
  },
  {
    icon: Mail,
    title: "Tous les canaux",
    body: "Email, SMS et WhatsApp en un seul clic.",
  },
  {
    icon: Clock,
    title: "Toujours au bon moment",
    body: "Vos jours, vos horaires, votre fuseau.",
  },
  {
    icon: FileCheck2,
    title: "Relances back-office",
    body: "Factures, devis, paniers : finalisés au bon moment.",
  },
  {
    icon: BadgeCheck,
    title: "100 % automatique",
    body: "Vous importez une fois. Relansia s’occupe du reste.",
  },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl font-semibold tracking-tight"
        >
          Fonctionnalités clés
        </motion.h2>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="group rounded-2xl border border-[var(--border)] bg-white/70 dark:bg-black/40 backdrop-blur p-6 shadow-sm hover:shadow-lg transition"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 p-2">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-[var(--text-dim)]">{f.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
