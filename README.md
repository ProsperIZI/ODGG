# ODGG

Site statique pour GitHub Pages.

## Structure

- Le site public est dans `docs/`.
- La page d'entree est `docs/index.html`.
- Les ressources partagées sont dans `docs/assets/`.
- La page stats est `docs/stats.html`.

## Organisation du code

- L'initialisation Firebase est centralisée dans `docs/assets/js/odgg-tools.js` via `window.ODGG.getDb()`.
- L'auth admin est factorisée via `window.ODGG.createAdminAuth(...)`.
- L'escaping HTML partagé est fourni par `window.ODGG.escHtml(...)`.
- Le code JS de chaque page est externalisé dans `docs/assets/js/*-page.js` (ex: `index-page.js`, `cruche-page.js`, `empereur-page.js`).
- Les pages (`index.html`, `cruche.html`, `empereur.html`, `dette.html`, `congele.html`, `galere.html`, `stats.html`) ne doivent plus redéfinir les blocs communs Firebase/auth/utils.

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