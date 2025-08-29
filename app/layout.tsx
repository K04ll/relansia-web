// app/layout.tsx
import { Inter } from "next/font/google";
import "@/styles/tokens.css";
import "./globals.css";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "Relansia — Relances intelligentes",
  description: "Relances post-achat Email/SMS/WhatsApp au bon moment, avec RGPD & unsubscribe.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {/* Skip link */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 rounded-lg bg-primary px-3 py-2 text-white"
        >
          Aller au contenu
        </a>

        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
          <nav
            className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3"
            aria-label="Navigation principale"
          >
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-block h-8 w-8 rounded-full bg-primary" aria-hidden />
              <span className="text-lg font-semibold">Relansia</span>
            </Link>

            <div className="flex items-center gap-6 text-sm">
              <Link href="/features" className="hover:underline">Fonctionnalités</Link>
              <Link href="/pricing" className="hover:underline">Tarifs</Link>
              <Link
                href="/app"
                className="rounded-2xl bg-primary px-4 py-2 text-white shadow focus:outline-none focus:ring-2 focus:ring-ring"
              >
                Ouvrir l’app
              </Link>
            </div>
          </nav>
        </header>

        {/* Main */}
        <main id="main">{children}</main>

        {/* Footer */}
        <footer className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-text-dim">
            © {new Date().getFullYear()} Relansia — Tous droits réservés.
          </div>
        </footer>
      </body>
    </html>
  );
}
