# ArchiveFever.Work

Site personnel statique hébergé avec GitHub Pages : [archivefever.work](https://archivefever.work/).

## Concept : le zoom infini

L'accueil est un écran noir avec un seul point orange. Le défilement zoome dans ce point. Chaque niveau de profondeur (z0 → z7) révèle un projet, puis z8 retombe exactement sur z0 : le zoom boucle à l'infini, dans les deux sens.

- **Navigation sur l'accueil :** molette, glisser, flèches, touches `0`–`8` ou Tab.
- **Sous-pages :** chacune s'ouvre « par le point » ; le point en haut à gauche ramène à l'accueil, au niveau du projet (`index.html#z3`).
- **Repli :** sans JavaScript, ou avec « réduire les animations », l'accueil devient une simple liste verticale.

Design system : noir, blanc, un seul orange (`#ff981f`), angles droits, Geist et Geist Mono.

## Contenu

- `index.html` + `assets/zoom.js` — accueil et moteur du zoom infini ;
- `ABOUT/` — présentation du projet ;
- `QR/` — générateur de QR personnalisés et de QR Wi-Fi ;
- `TIMER/` — minuteur avec raccourcis et alerte sonore ;
- `Donations/` — options facultatives de soutien ;
- `BETA/` — recherche « Every Y Found » (Minecraft Beta 1.7.3) ;
- `COMPRESS/` — FeverCompress : images, vidéos et ZIP dans le navigateur ;
- `Jeromed.html` — expérience annexe (le piège à QR code de Jérôme) ;
- `assets/` — design system partagé (`site.css`, `site.js`) et styles propres à BETA et Jeromed ;
- `404.html` — page d’erreur personnalisée ;
- `IMG/` et `SOUND/` — médias du site ;
- `robots.txt` et `sitemap.xml` — fichiers d’indexation ;
- `CNAME` — domaine personnalisé GitHub Pages.

## Tester localement

Le site peut être parcouru en ouvrant `index.html` directement. Pour reproduire plus fidèlement le comportement de GitHub Pages, lancez un serveur statique depuis ce dossier :

```powershell
python -m http.server 8000
```

Puis ouvrez `http://localhost:8000/`.

## Publier sur GitHub Pages

1. Conserver exactement cette arborescence à la racine du dépôt.
2. Envoyer les fichiers sur la branche utilisée par GitHub Pages, généralement `main`.
3. Dans les paramètres du dépôt, vérifier que Pages publie depuis la racine de cette branche.
4. Conserver le fichier `CNAME` pour utiliser `archivefever.work`.

Les outils fonctionnent entièrement dans le navigateur. Les contenus saisis dans ColorQR ne sont pas envoyés à un serveur.
