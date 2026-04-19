# ODGG

Site statique pour GitHub Pages.

## Structure

- Le site public est dans `docs/`.
- La page d'entree est `docs/index.html`.
- Les ressources partagées sont dans `docs/assets/`.
- La page stats est `docs/stats.html`.

## Nouvelles fonctionnalités

- Historique des actions stocké dans `history/` (ajouts, suppressions, scores, etc.).
- Stats globales et historique recent dans `stats.html`.
- Mode lecture seule partageable via `?view=1` (ex: `stats.html?view=1`).
- Sauvegarde admin: export/import JSON depuis la page Stats.

## Déploiement GitHub Pages

Dans le dépôt GitHub:

1. Aller dans **Settings > Pages**.
2. Dans **Build and deployment**, choisir **Source: Deploy from a branch**.
3. Choisir la branche `main` (ou celle utilisee) et le dossier **`/docs`**.
4. Sauvegarder.

Le domaine personnalisé reste pris en charge via `docs/CNAME`.