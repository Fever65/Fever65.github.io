/* Accueil — textes FR/EN de la Carte. La caméra est dans map.js, la vie des pièces dans rooms.js. */
window.AFHome = AF.i18n({
  fr: {
    title: 'ArchiveFever.Work — La Carte',
    description: 'Une carte à explorer. Chaque pièce est un projet : compression, QR codes, minuteur, recherche Minecraft, Jérôme. Sans compte.',
    skip: 'Aller aux projets', mapLabel: 'La Carte', mapNav: 'Navigation de la carte',
    explored: 'explorées', prev: 'Pièce précédente', next: 'Pièce suivante', plan: 'Plan',
    hint: 'Glisse · zoome · explore',
    studio: 'studio personnel', here: 'vous êtes ici', start: 'Explorer', enter: 'Entrer',
    intro: 'Une carte bâtie sur une seule proportion. Chaque pièce est un projet. Perds-toi, puis reviens.',
    compressTag: 'images · vidéos · zip', compressDesc: 'Allège tes images et vidéos, ou crée un ZIP de tes dossiers.',
    qrTag: 'couleurs · wi-fi · png', qrDesc: 'Crée un QR personnalisé ou un QR Wi-Fi prêt à télécharger.', qrAlt: 'QR code vers ColorQR',
    timerTag: 'raccourcis · alerte sonore', timer: 'Minuteur', timerDesc: 'Un compte à rebours avec raccourcis clavier et alerte sonore.',
    betaDesc: 'Un seed de donjon hors Far Lands pour chaque hauteur de Minecraft Beta 1.7.3.',
    jerome: 'Jérôme', jeromeDesc: 'Jérôme t’attendait. Ne clique pas.',
    endTag: 'le fond', socials: 'Réseaux', surprise: 'Surprise',
    secretTag: 'pièce secrète', secretLocked: 'Fermée', secretHint: 'Visite les sept pièces pour l’ouvrir.',
    secretOpenT: 'Tu as tout vu.', secretOpenD: 'L’index des couleurs du site, une palette par pièce.', colorIndex: 'Index des couleurs',
    secretToast: 'La pièce secrète est ouverte.'
  },
  en: {
    title: 'ArchiveFever.Work — The Map',
    description: 'A map to explore. Every room is a project: compression, QR codes, a timer, Minecraft research, Jerome. No account.',
    skip: 'Skip to projects', mapLabel: 'The Map', mapNav: 'Map navigation',
    explored: 'explored', prev: 'Previous room', next: 'Next room', plan: 'Plan',
    hint: 'Drag · zoom · explore',
    studio: 'personal studio', here: 'you are here', start: 'Explore', enter: 'Enter',
    intro: 'A map built on a single proportion. Every room is a project. Get lost, then come back.',
    compressTag: 'images · videos · zip', compressDesc: 'Compress images and videos, or create a ZIP of your folders.',
    qrTag: 'colors · wi-fi · png', qrDesc: 'Create a custom QR code or a downloadable Wi-Fi QR code.', qrAlt: 'QR code to ColorQR',
    timerTag: 'shortcuts · sound alert', timer: 'Timer', timerDesc: 'A countdown with keyboard shortcuts and a final sound alert.',
    betaDesc: 'A dungeon seed outside the Far Lands for every height in Minecraft Beta 1.7.3.',
    jerome: 'Jerome', jeromeDesc: 'Jerome was waiting for you. Don’t click.',
    endTag: 'the bottom', socials: 'Socials', surprise: 'Surprise',
    secretTag: 'secret room', secretLocked: 'Locked', secretHint: 'Visit all seven rooms to open it.',
    secretOpenT: 'You saw everything.', secretOpenD: 'The site’s colour index, one palette per room.', colorIndex: 'Colour index',
    secretToast: 'The secret room is open.'
  }
}, { onChange: () => window.AFMap && window.AFMap.relabel() });
