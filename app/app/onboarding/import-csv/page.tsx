// app/app/onboarding/import-csv/page.tsx
"use client";

import CSVDrop from "@/components/app/import/CSVDrop";
import Link from "next/link";

export default function ImportCSVPage() {
  return (
    <main className="py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Étape 1 · Import CSV</h1>
          <p className="mt-2 text-[var(--text-dim)]">
            Uploadez votre CSV, mappez les colonnes, puis importez vos clients.
          </p>
        </div>
        <Link href="/app/onboarding/step2" className="px-4 py-2 rounded-xl border border-[var(--border)]">
          Passer (déjà importé)
        </Link>
      </div>

      <div className="mt-6">
        <CSVDrop />
      </div>
    </main>
  );
}
