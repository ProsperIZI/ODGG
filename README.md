# ODGG

Site statique pour GitHub Pages.

## Structure

- Le site public est dans `docs/`.
- La page d'entree est `docs/index.html`.
- Les ressources partagées sont dans `docs/assets/`.

## Déploiement GitHub Pages

Dans le dépôt GitHub:

1. Aller dans **Settings > Pages**.
2. Dans **Build and deployment**, choisir **Source: Deploy from a branch**.
3. Choisir la branche `main` (ou celle utilisee) et le dossier **`/docs`**.
4. Sauvegarder.

Le domaine personnalisé reste pris en charge via `docs/CNAME`.