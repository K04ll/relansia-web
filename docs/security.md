🔒 Security Checklist — Relansia
1. Authentification & Autorisation
 RLS (Row Level Security) actif sur toutes les tables (clients, reminders, dispatch_logs, settings, reminder_rules).
 Toutes les requêtes filtrées par user_id.
 Aucune donnée d’un autre utilisateur accessible.
2. API & Endpoints
 app/api/reminders/dispatch accepte uniquement :
x-vercel-cron: 1 (cron Vercel).
ou Authorization: Bearer <CRON_SECRET> (cron GitHub Actions).
 Endpoints sensibles protégés par rate-limit (ex. 10 req/min/user).
 Toutes les réponses erreurs normalisées en { code, message } (pas d’objets bruts [object Object]).
 Pas de PII dans les logs (jamais d’email ou téléphone en clair).
3. Secrets & Variables d’environnement
 Jamais exposés côté client (seuls NEXT_PUBLIC_* autorisés).
 Rotation des clés planifiée post-V1 (Resend, Twilio, OpenAI, Supabase service key).
 Playbook de rotation disponible (docs/ops/keys-rotation.md).
4. Communications & Stockage
 TLS actif (https:// uniquement).
 Données chiffrées au repos (DB provider).
 Données sensibles (tokens, secrets) jamais loggées.
5. Headers & Protection navigateur
 Strict-Transport-Security: max-age=63072000; includeSubDomains; preload.
 X-Content-Type-Options: nosniff.
 X-Frame-Options: DENY.
 Referrer-Policy: no-referrer.
 Content-Security-Policy stricte (aucun unsafe-inline côté app).
6. Anti-abus & RGPD
 Opt-out obligatoire (STOP SMS / désabonnement email).
 Suppression/export des données client sur demande.
 Données minimisées, jamais revendues.
 Logs conservés uniquement sans PII.
7. Validation finale
 Audit endpoints avec OWASP Zap ou équivalent.
 Test d’inondation (bruteforce API) → rate-limit OK.
 Rapport archivé dans docs/reports/security.md.
👉 Definition of Done (DoD)
Aucun accès inter-user possible.
Secrets sécurisés.
Headers sécurité actifs.
Opt-out RGPD opérationnel.
🎯 Avec cette checklist, tu as maintenant Sprint 10 complet :
QA ✅
Perf ✅
A11y ✅
Sécurité ✅