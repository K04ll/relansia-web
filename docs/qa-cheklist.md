✅ QA Checklist — Relansia
1. Préparation
 Base de données seedée avec :
50–200 clients (emails valides, quelques invalides).
3–5 règles de relance (email / SMS / WhatsApp).
Paramètres utilisateur (boutique, expéditeur, timezone, fenêtre d’envoi).
 Variables d’environnement correctement configurées (SUPABASE_*, RESEND_API_KEY, TWILIO_*).
2. Parcours Onboarding
 Import d’un CSV → aperçu 20 lignes OK.
 Déduplication email/téléphone correcte.
 Mapping auto FR correct (email, prénom, nom, téléphone).
 Step 2 : paramètres boutique sauvegardés et rechargés après refresh.
 Step 3 : création/édition/suppression de règles fonctionnelle.
 Step 3 : duplication/réorganisation (drag & drop) fonctionne.
 Bouton “Activer mes relances” génère bien des reminders.
3. Gestion des reminders
 Page /app/reminders affiche :
Liste avec statuts (scheduled, sent, failed, canceled).
Filtres par statut et canal.
Recherche (email/téléphone).
 Bouton Send Now force l’éligibilité et envoi au tick suivant.
 Bouton Cancel annule un reminder (plus d’envoi possible).
 StatCards en haut reflètent bien les filtres (envoyés, échoués, planifiés, annulés).
4. Logs & Observabilité
 Chaque envoi écrit dans dispatch_logs avec {code, message}.
 Panneau “10 derniers logs” lisible (pas de [object Object]).
 Logs jamais de PII (pas d’email brut ni téléphone complet).
5. Email & SMS/WhatsApp
 Email reçu avec le template premium 600px.
 Affichage correct Gmail, Apple Mail, mobile.
 Lien de désabonnement → met bien unsubscribed = true.
 SMS et WhatsApp envoyés via Twilio (clients avec téléphone uniquement).
 Retry/backoff appliqué en cas d’échec temporaire.
6. Sécurité & Garde-fous
 Un client marqué unsubscribed ne reçoit plus aucune relance.
 Aucun endpoint accessible sans user_id (RLS actif).
 reminders/dispatch n’accepte que Authorization: Bearer <CRON_SECRET> ou x-vercel-cron.
7. Tests de bord
 CSV avec colonnes manquantes → message d’erreur clair.
 CSV avec doublons → déduplication correcte.
 Email invalide (foo@bar) → status failed loggé.
 Téléphone invalide → rejet clair dans l’UI.
 Envoi hors fenêtre d’envoi (ex : nuit) → reminder reste en scheduled.
👉 DoD (Definition of Done) :
Tous les scénarios ci-dessus passent avec succès.
Aucun envoi intempestif (pas de doublon, pas d’envoi hors créneau).
Logs exploitables pour 100% des tentatives.