# Dépendances de FeverCompress

## JSZip 3.10.1
Copyright Stuart Knightley, David Duponchel, Franz Buchinger, António Afonso.
Distribution utilisée sous licence MIT (choix parmi MIT / GPLv3).
La licence complète figure dans vendor/jszip-LICENSE.md.
Source : https://github.com/Stuk/jszip/tree/v3.10.1

## ffmpeg.wasm — wrapper 0.12.15
Copyright ffmpeg.wasm contributors. Licence MIT, texte dans vendor/ffmpeg/LICENSE.
Les sept modules de vendor/ffmpeg sont produits depuis les sources officielles
TypeScript du tag v12.15, transformées en JavaScript sans changement de logique.
Source : https://github.com/ffmpegwasm/ffmpeg.wasm/tree/v12.15/packages/ffmpeg/src

## Moteur vidéo externe @ffmpeg/core 0.12.10
Le binaire n'est pas inclus dans ce dossier. Le navigateur charge à la demande
ffmpeg-core.js et ffmpeg-core.wasm depuis le paquet officiel via jsDelivr :
https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/
Le moteur suit la licence GPL-2.0-or-later et les licences de ses composants.
Sources et construction : https://github.com/ffmpegwasm/ffmpeg.wasm/tree/v12.15
https://github.com/ffmpegwasm/ffmpeg.wasm-core
Informations : https://ffmpeg.org/legal.html
Ces téléchargements concernent uniquement le moteur : les fichiers des visiteurs
restent dans leur navigateur.
