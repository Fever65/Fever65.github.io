# ArchiveFever.Work

Site personnel statique hébergé avec GitHub Pages : [archivefever.work](https://archivefever.work/).

## Concept : le zoom infini

L'accueil est un écran noir avec un seul point orange. Le défilement zoome dans ce point. Chaque niveau de profondeur (z0 → z7) révèle un projet, puis z8 retombe exactement sur z0 : le zoom boucle à l'infini, dans les deux sens.

- **Navigation sur l'accueil :** molette, glisser, flèches, touches `0`–`8` ou Tab.
- **Sous-pages :** chacune s'ouvre « par le point » ; le point en haut à gauche ramène à l'accueil, au niveau du projet (`index.html#z3`).
- **Repli :** sans JavaScript, ou avec « réduire les animations », l'accueil devient une simple liste verticale.

## Design : Sanzo Wada × nombre d'or

- **Couleurs** — chaque niveau du zoom porte une combinaison du livre *A Dictionary of Color Combinations* de Sanzo Wada (1933), reprise telle quelle. Pendant le zoom, le fond interpole d'une combinaison à la suivante ; chaque page affiche le numéro de la sienne en haut à droite.

  | Niveau | Page | Wada | Fond · texte · point |
  |---|---|---|---|
  | z0 | Accueil (le point) | 256 | Black · Vinaceous Cinnamon · Orange |
  | z1 | ArchiveFever.Work | 190 | Black · Ivory Buff · English Red |
  | z2 | FeverCompress | 141 | Dark Tyrian Blue · Yellow Green · Orange |
  | z3 | ColorQR | 166 | Deep Slate Green · Naples Yellow · Grenadine Pink |
  | z4 | Minuteur | 253 | Cotinga Purple · Lemon Yellow · Apricot Orange |
  | z5 | Every Y Found | 340 | Black · Neutral Gray · Sea Green |
  | z6 | Jérôme | 265 | Dull Violet Black · Apricot Yellow · Old Rose |
  | z7 | À propos, Dons | 342 | Deep Slate Olive · Corinthian Pink · Cream Yellow |
  | — | 404 | 232 | Deep Indigo · Pinkish Cinnamon · Carmine |

  Les palettes de ColorQR sont, elles aussi, des paires foncé/clair tirées du livre. `node tools/wada-check.mjs` vérifie les contrastes WCAG de chaque palette.
- **Nombre d'or (φ = 1,618)** — espacements en 16 px × φⁿ, typographie par √φ, durées par φ, grilles 1 : φ (`.g-phi`), rectangles d'or. Le zoom avance d'un facteur φ⁴ par niveau, soit exactement un tour de la spirale d'or dessinée autour du point.
- Angles droits, filets d'un pixel, Geist et Geist Mono. Jetons : `assets/tokens.css`.

## Contenu

- `index.html` + `assets/zoom.js` — accueil et moteur du zoom infini ;
- `ABOUT/` — présentation du projet ;
- `QR/` — générateur de QR personnalisés et de QR Wi-Fi ;
- `TIMER/` — minuteur avec raccourcis et alerte sonore ;
- `Donations/` — options facultatives de soutien ;
- `BETA/` — recherche « Every Y Found » (Minecraft Beta 1.7.3) ;
- `COMPRESS/` — FeverCompress : images, vidéos et ZIP dans le navigateur ;
- `Jeromed.html` — expérience annexe (le piège à QR code de Jérôme) ;
- `assets/` — jetons (`tokens.css`), design system (`site.css`), socle JS commun (`site.js` : langue FR/EN partagée, palette, toast), accueil (`home.css`, `home.js`, `zoom.js`) et Jeromed ;
- `tools/wada-check.mjs` — vérification des contrastes des palettes ;
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
