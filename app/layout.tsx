// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import Link from "next/link";
import Script from "next/script";
import "../styles/tokens.css";
import "./globals.css";

import CookieBanner from "@/components/app/CookieBanner";
import ClientAnalytics from "@/components/app/ClientAnalytics";
import ActiveLink from "@/components/navigation/ActiveLink";
import ThemeToggle from "@/components/common/ThemeToggle";
import { ThemeProvider } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// ✅ Satoshi en local (fichiers placés dans app/fonts)
const satoshi = localFont({
  src: [
    { path: "./fonts/Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Satoshi-Medium.woff2",  weight: "500", style: "normal" },
    { path: "./fonts/Satoshi-Bold.woff2",    weight: "700", style: "normal" },
  ],
  variable: "--font-hr",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Relansia", template: "%s — Relansia" },
  description:
    "Relances post-achat Email/SMS/WhatsApp au bon moment, avec RGPD & unsubscribe.",
};

const NAV = [
  { label: "Produit", href: "/product" },
  { label: "Fonctionnement", href: "/how-it-works" },
  { label: "Templates", href: "/templates" },
  { label: "Tarifs", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact", exact: true as const },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${satoshi.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          {/* Skip link */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 rounded-lg bg-primary px-3 py-2 text-white"
          >
            Aller au contenu
          </a>

          {/* Header (marketing nav) */}
          <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
            <nav
              className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3"
              aria-label="Navigation principale"
            >
              <Link
                href="/"
                className="flex items-center gap-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Relansia — accueil"
              >
                <span className="inline-block h-8 w-8 rounded-full bg-primary" aria-hidden />
                <span className="text-lg font-semibold">Relansia</span>
              </Link>

              <div className="flex items-center gap-6 text-sm">
                {NAV.map((item) => (
                  <ActiveLink
                    key={item.href}
                    href={item.href}
                    exact={item.exact}
                    className="hover:underline rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm text-[var(--text-dim)] transition"
                    activeClassName="text-foreground font-medium"
                  >
                    {item.label}
                  </ActiveLink>
                ))}

                {/* Toggle dark/light */}
                <ThemeToggle />

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

          {/* RGPD / Analytics si besoin */}
          <Script id="gtm-consent-loader" strategy="afterInteractive">
            {`(function(){try{var g=window.localStorage.getItem('consent_analytics')==='granted';if(!g)return;var id='${process.env.NEXT_PUBLIC_GTM_ID ?? ""}';if(!id)return;window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'consent_loaded'});var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtm.js?id='+id;document.head.appendChild(s);}catch(e){}})();`}
          </Script>

          <CookieBanner />
          <ClientAnalytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
