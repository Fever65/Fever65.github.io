# ArchiveFever.Work

Site personnel statique hébergé avec GitHub Pages : [archivefever.work](https://archivefever.work/).

## Contenu

- `index.html` — accueil et navigation principale ;
- `ABOUT/` — présentation du projet ;
- `QR/` — générateur de QR personnalisés et de QR Wi-Fi ;
- `TIMER/` — minuteur avec raccourcis et alerte sonore ;
- `Donations/` — options facultatives de soutien ;
- `H2O/` et `Jeromed.html` — expériences annexes ;
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
