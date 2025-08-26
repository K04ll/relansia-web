⚡ Perf Checklist — Relansia
1. Objectifs (budgets à respecter)
Lighthouse Score : ≥ 90 (Performance, Accessibilité, Best Practices, SEO).
Poids JS initial : ≤ 220 KB gzip par page app.
TTFB (Vercel prod) : p95 ≤ 300 ms.
LCP (Largest Contentful Paint) :
≤ 2.5 s sur desktop.
≤ 3.2 s sur mobile.
Images : toutes en AVIF ou WebP + responsive sizes.
Reminders/Logs pages : temps de rendu ≤ 1.2 s sur dataset de 1k+ reminders.
2. Mesures à lancer
Lighthouse (local)
npm run build && npm run start
npm run test:perf
➡ Rapport généré dans docs/lh-report.html.
PageSpeed Insights (prod)
Tester l’URL déployée (landing + app).
Exporter le rapport PDF et archiver dans docs/reports/.
3. Optimisations à vérifier
 Tree-shaking : libs lourdes côté client (React Email, Twilio, Supabase) bien marquées server-only.
 next/dynamic sur composants lourds (CSV parser, éditeur de texte).
 Compression : Gzip ou Brotli actif (Vercel auto).
 Caching :
Cache-Control headers sur assets statiques.
SWR (stale-while-revalidate) sur listes reminders/logs.
 Images marketing : optimisées (next/image, formats modernes).
 Fonts : hébergées localement, subset réduits.
 Bundle analyzer (ANALYZE=true next build) → vérifier chunks >100 KB.
 DB queries : index utilisées (reminders, clients), EXPLAIN ANALYZE ≤ 50 ms sur requêtes principales.
4. Validation finale
 Rapport Lighthouse ≥ 90 collé dans docs/perf.md.
 Screenshots avant/après optimisations conservés.
 Aucun chunk JS > 220 KB.
 LCP < 2.5s (desktop) et < 3.2s (mobile).
 Dataset reminders 1k+ rendu fluide (<1.2s).
👉 Definition of Done (DoD)
Tous les budgets respectés.
Rapport Lighthouse archivé.
Perf validée sur dataset réaliste.