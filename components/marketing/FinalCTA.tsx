"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-[var(--border)] bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-cyan-500/10 backdrop-blur p-10 text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Prêt à faire revenir vos clients automatiquement ?
          </h2>
          <p className="mt-3 text-base text-[var(--text-dim)]">
            Activez vos relances en quelques minutes.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/app/onboarding/import-csv" className="btn-primary">
              Récupérer mes clients
            </Link>
            <Link href="#features" className="btn-ghost">
              Voir comment ça marche
            </Link>
          </div>

          <p className="mt-4 text-sm text-[var(--text-dim)]">
            RGPD • Essai gratuit • Sans code • Annulable
          </p>
        </motion.div>
      </div>
    </section>
  );
}
