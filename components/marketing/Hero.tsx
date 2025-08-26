"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, MessageSquare, MessageCircleMore, Timer } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden py-24 md:py-32">
      {/* Background gradient */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[72rem] h-[72rem] rounded-full bg-gradient-to-b from-indigo-500/20 via-violet-500/10 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Texte Hero */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h1 className="text-4xl/tight sm:text-5xl/tight font-semibold tracking-tight">
              N’oubliez plus jamais un client.
            </h1>
            <p className="text-base md:text-lg text-[var(--text-dim)] max-w-xl">
              Relansia{" "}
              <span className="font-medium text-[var(--foreground)]">
                prédit le moment exact
              </span>{" "}
              où le besoin revient et relance par Email/SMS/WhatsApp —{" "}
              <span className="font-medium">sans spam</span>.
              <span className="block mt-2 text-sm md:text-base opacity-90">
                Ex. : croquettes 10 kg ≈ 34 jours → relance intelligente avant
                la fin.
              </span>
            </p>

            {/* Boutons */}
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/app/onboarding/import-csv" className="btn-primary">
                Récupérer mes clients
              </Link>
              <Link href="#features" className="btn-ghost">
                Voir comment ça marche
              </Link>
            </div>

            {/* Chips */}
            <ul className="mt-2 flex flex-wrap gap-2 text-sm text-[var(--text-dim)]">
              <li className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-1 backdrop-blur">
                <Timer className="h-3.5 w-3.5" /> IA prédictive
              </li>
              <li className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-1 backdrop-blur">
                <Mail className="h-3.5 w-3.5" /> Multicanal
              </li>
              <li className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-1 backdrop-blur">
                <MessageSquare className="h-3.5 w-3.5" /> Sans spam
              </li>
            </ul>
          </motion.div>

          {/* Mockup à droite */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="relative"
          >
            <div className="mx-auto w-full max-w-lg rounded-2xl border border-[var(--border)] bg-white/70 dark:bg-black/40 backdrop-blur-md shadow-xl">
              <div className="flex items-center justify-between px-5 pt-5">
                <div className="text-sm text-[var(--text-dim)]">
                  Relance programmée
                </div>
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-xs">
                  dans 2 jours
                </span>
              </div>
              <div className="px-5 pb-5 pt-3">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium">
                        Croquettes 10 kg — Adulte stérilisé
                      </div>
                      <div className="mt-1 text-xs text-[var(--text-dim)]">
                        Client : Marie Dupont
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--text-dim)]">
                      <Mail className="h-4 w-4" />
                      <MessageSquare className="h-4 w-4" />
                      <MessageCircleMore className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Progression */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-[var(--text-dim)]">
                      <span>Sac consommé</span>
                      <span>90 %</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-black/5 dark:bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "90%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      />
                    </div>
                  </div>

                  {/* Message preview */}
                  <div className="mt-4 rounded-lg border border-[var(--border)] bg-white/70 dark:bg-black/40 p-3 text-sm">
                    <p>
                      Bonjour <span className="font-medium">{"{{first_name}}"}</span>, votre sac arrive à la fin.
                      <span className="block opacity-80">
                        Cliquez pour recommander avant la rupture.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
