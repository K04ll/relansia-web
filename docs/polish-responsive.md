🎨 Sprint 11 — Polish & Responsive Checklist
1. Micro-interactions
 Transitions fluides (180–320 ms) uniquement sur opacity/transform.
 Hover sur boutons & cartes → légère élévation (shadow-md → shadow-lg).
 Feedback visuel clair (loading spinner, toasts succès/erreur).
 Dark/Light mode : transitions douces, pas de flash blanc.
2. États UI soignés
Empty states
 /app/clients : texte pédagogique + CTA “Importer un CSV”.
 /app/reminders : message “Aucune relance pour l’instant” + bouton “Activer mes relances”.
 /app/logs : message clair “Aucun envoi récent”.
Loading states
 Skeletons ou shimmer (cards, table rows) pour éviter écran vide.
 Boutons → disabled + spinner inline pendant actions async.
Error states
 Messages utilisateurs courts & clairs (jamais d’erreur technique brute).
 CTA “Réessayer” ou retour à l’action précédente.
3. Responsive
 Mobile (375px)
Sidebar → repliée (icônes seules).
Grilles → 1 colonne.
Form inputs 100% largeur.
 Tablette (768px)
Sidebar semi-ouverte (icônes + labels).
Grilles → 2 colonnes.
 Desktop (≥1024px)
Sidebar ouverte.
Grilles → 3 colonnes+.
4. Finitions Design System
 Cohérence paddings/margins (8/16/24 px).
 Coins arrondis 2xl pour cartes, boutons.
 Ombres douces (type Apple-like).
 Police, interlignage, hiérarchie titres cohérents.
 Icônes Lucide cohérentes (taille, couleur, hover).
5. Validation finale
 Parcours complet testé sur desktop, tablette, mobile.
 Lighthouse Mobile score ≥ 90.
 Dark/Light mode validé sur toutes les pages.
 Vidéo démo fluide (marketing → onboarding → reminders/logs).
👉 Definition of Done (DoD)
UI nickel sur desktop + mobile.
États (empty, loading, error) élégants.
Micro-interactions homogènes.
Démo publique prête.