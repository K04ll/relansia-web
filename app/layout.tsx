import "./globals.css";
import Link from "next/link";

export const metadata = { title: "Relansia — Relances intelligentes" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-white text-[#2F2F2F]">
        <header className="border-b border-black/10 bg-white sticky top-0 z-40">
          <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-block w-8 h-8 rounded-full" style={{ background: "#4BC0A9" }} />
              <span className="font-semibold text-[#1E3A5F] text-lg">Relansia</span>
            </Link>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/features">Fonctionnalités</Link>
              <Link href="/pricing">Tarifs</Link>
              <Link href="/app" className="rounded-2xl px-4 py-2 text-white" style={{ background: "#F2B441" }}>
                Ouvrir l’app
              </Link>
            </div>
          </nav>
        </header>
        {children}
        <footer className="border-t border-black/10">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-black/60">
            © {new Date().getFullYear()} Relansia — Tous droits réservés.
          </div>
        </footer>
      </body>
    </html>
  );
}
