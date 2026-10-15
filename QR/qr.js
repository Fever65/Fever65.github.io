/* ColorQR — QR coloré ou Wi-Fi, généré localement (qrcode@1.4.4).
   Les couleurs proposées sont des paires foncé / clair tirées des combinaisons de Sanzo Wada,
   avec au moins 7:1 de contraste ; la saisie libre reste possible et reste vérifiée (≥ 4,5:1). */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  // Toutes les paires lisibles du livre : [n° de combinaison, modules, fond].
  const WADA_PAIRS = [
    [6, '#051230', '#f48067'], [22, '#1c4286', '#fff200'], [50, '#4e1d4c', '#ebd3a2'], [52, '#111314', '#f5ecc2'],
    [60, '#12354e', '#ffefae'], [61, '#501345', '#c7d14f'], [62, '#111314', '#fff200'], [69, '#111314', '#a1a39a'],
    [84, '#112f2c', '#fdd4bd'], [109, '#42533e', '#ffefae'], [112, '#111314', '#f48067'], [113, '#4b3317', '#fdd4bd'],
    [119, '#12354e', '#a5c8d1'], [139, '#051230', '#97acc8'], [139, '#051230', '#b6bfc1'], [141, '#12354e', '#afd472'],
    [145, '#1e0e3f', '#b2b73e'], [149, '#112f2c', '#d6b43e'], [151, '#064f6e', '#f5ecc2'], [166, '#112f2c', '#fbe6a0'],
    [168, '#064f6e', '#f8ed43'], [173, '#762c19', '#f8ed43'], [189, '#253122', '#f8ed43'], [190, '#111314', '#ebd3a2'],
    [192, '#4b3317', '#fdbf68'], [207, '#111314', '#b4cdc2'], [211, '#051230', '#f68c50'], [221, '#111314', '#b6bfc1'],
    [229, '#253122', '#b6bfc1'], [232, '#051230', '#eeb480'], [242, '#111314', '#f37f94'], [247, '#1c4286', '#ffdd00'],
    [251, '#34454c', '#fff200'], [253, '#34454c', '#f8ed43'], [253, '#501345', '#f8ed43'], [255, '#111314', '#cab356'],
    [255, '#111314', '#78cdd0'], [256, '#111314', '#eea78c'], [265, '#1e0e3f', '#ffdd00'], [268, '#253122', '#bce4e5'],
    [271, '#112f2c', '#96d1aa'], [276, '#111314', '#fdd4bd'], [276, '#111314', '#afd472'], [284, '#004f46', '#ffdd00'],
    [288, '#111314', '#f99d1b'], [289, '#40456a', '#f8ed43'], [289, '#1e0e3f', '#f8ed43'], [289, '#1e0e3f', '#c7d14f'],
    [290, '#6d4145', '#ffefae'], [295, '#1e0e3f', '#fdbf68'], [295, '#1e0e3f', '#fff200'], [296, '#34454c', '#f5ecc2'],
    [298, '#111314', '#f8ed43'], [303, '#253122', '#fbe6a0'], [310, '#253122', '#f5ecc2'], [310, '#253122', '#eeb480'],
    [323, '#111314', '#fdc57e'], [323, '#111314', '#b2b73e'], [325, '#112f2c', '#e2b540'], [329, '#501345', '#fdbf68'],
    [336, '#793327', '#ffefae'], [337, '#111314', '#ca92a8'], [340, '#111314', '#00b49b'], [341, '#253122', '#a5c8d1'],
    [342, '#253122', '#f8b6ba'], [342, '#253122', '#fdbf68'], [348, '#253122', '#c1c494'], [348, '#501345', '#c1c494']
  ];
  // Huit palettes nommées, prises dans la liste ci-dessus.
  const PRESETS = [
    ['Ambre', 'Amber', 336, '#793327', '#ffefae'], ['Nuit', 'Night', 60, '#12354e', '#ffefae'],
    ['Forêt', 'Forest', 166, '#112f2c', '#fbe6a0'], ['Océan', 'Ocean', 22, '#1c4286', '#fff200'],
    ['Prune', 'Plum', 253, '#501345', '#f8ed43'], ['Garance', 'Madder', 173, '#762c19', '#f8ed43'],
    ['Café', 'Coffee', 113, '#4b3317', '#fdd4bd'], ['Encre', 'Ink', 52, '#111314', '#f5ecc2']
  ];

  const MODAL = {
    fr: `<p><b>Créé par Fever</b> — projet publié sur <b>ArchiveFever.Work</b>.</p>
      <p class="muted">Cet outil génère les QR codes <b>localement dans ton navigateur</b>. Les données saisies ne sont pas envoyées à un serveur.</p>
      <ul>
        <li><b>Vie privée :</b> aucune collecte des contenus saisis.</li>
        <li><b>Usage :</b> tu es responsable du contenu encodé.</li>
        <li><b>Sécurité :</b> un QR peut pointer vers du contenu risqué. Vérifie avant de partager.</li>
        <li><b>Responsabilité :</b> Fever / ArchiveFever.Work ne peuvent être tenus responsables d'un usage malveillant par un tiers.</li>
      </ul>
      <p class="muted">Conseil : teste ton QR sur plusieurs téléphones avant de le diffuser.</p>`,
    en: `<p><b>Made by Fever</b> — a project on <b>ArchiveFever.Work</b>.</p>
      <p class="muted">This tool generates QR codes <b>locally in your browser</b>. The data you enter is not sent to a server.</p>
      <ul>
        <li><b>Privacy:</b> no collection of the content you enter.</li>
        <li><b>Usage:</b> you are responsible for what you encode.</li>
        <li><b>Security:</b> QR codes can link to risky content. Always verify before sharing.</li>
        <li><b>Liability:</b> Fever / ArchiveFever.Work cannot be held responsible for malicious use by third parties.</li>
      </ul>
      <p class="muted">Tip: test your QR on multiple phones before sharing publicly.</p>`
  };

  const DICT = {
    fr: {
      title: 'ColorQR — Générateur de QR personnalisés et Wi-Fi',
      description: 'Crée gratuitement des QR codes personnalisés ou des QR Wi-Fi, avec contrôle automatique du contraste et téléchargement PNG.',
      info: 'Infos', close: 'Fermer', modal: MODAL.fr,
      heading: 'QR — Couleur & Wi-Fi',
      lead: 'Un QR code à tes couleurs, ou un QR qui connecte au Wi-Fi en un seul scan. Tout se passe dans ton navigateur.',
      pillLocal: '100 % local', pillWada: 'Palettes harmonieuses',
      sType: 'Type de QR', sContent: 'Contenu', sColors: 'Couleurs', sOptions: 'Options', sNetwork: 'Réseau',
      lUrl: 'Lien', hUrl: 'Ce lien sera encodé dans le QR.',
      palettes: 'Palettes harmonieuses',
      lDark: 'Couleur des modules', lLight: 'Couleur du fond',
      hRand: '« Aléatoire » tire une paire lisible parmi des combinaisons de couleurs classiques.',
      lMargin: 'Bordure (marge) — améliore la détection',
      gen: 'Générer', swap: 'Inverser', rand: 'Aléatoire',
      lSsid: 'Nom du Wi-Fi (SSID)', ssidPh: 'MonWifi', hSsid: 'Le QR proposera la connexion à ce réseau.',
      lPass: 'Mot de passe', hPass: 'Si « Aucune », le mot de passe est ignoré.',
      lSec: 'Sécurité', hSec: "Définit comment l'appareil se connecte.", none: 'Aucune',
      preview: 'Aperçu', empty: 'Ton QR apparaîtra ici', download: 'Télécharger',
      statusEmpty: 'Rien à afficher. Clique sur « Générer ».',
      statusGen: 'Génération…',
      statusReady: 'QR prêt — tu peux télécharger.',
      statusErr: 'Erreur lors de la génération.',
      errUrl: 'Entre un lien valide (https://…).',
      errSsid: 'Entre un nom de réseau (SSID).',
      errPass: 'Entre un mot de passe ou choisis « Aucune » comme sécurité.',
      errContrast: 'Contraste insuffisant : choisis des modules plus foncés et un fond plus clair.',
      contrastGood: 'Contraste vérifié : bonne lisibilité.',
      contrastBad: 'Contraste insuffisant : utilise des modules foncés sur un fond clair.',
      wadaPair: 'Paire',
      tips: 'Conseils', tipsTitle: 'Trois règles pour un QR fiable',
      t1: 'Contraste d’abord', t1d: 'Modules foncés sur fond clair : c’est ce que les téléphones lisent le mieux. L’outil vérifie pour toi.',
      t2: 'Garde la marge', t2d: 'La bordure autour du QR aide l’appareil photo à le repérer, surtout imprimé.',
      t3: 'Teste avant d’imprimer', t3d: 'Scanne-le avec deux ou trois téléphones différents avant de le diffuser.'
    },
    en: {
      title: 'ColorQR — Custom and Wi-Fi QR code generator',
      description: 'Create custom or Wi-Fi QR codes for free, with automatic contrast validation and PNG download.',
      info: 'Info', close: 'Close', modal: MODAL.en,
      heading: 'QR — Color & Wi-Fi',
      lead: 'A QR code in your colors, or one that joins a Wi-Fi network in a single scan. Everything happens in your browser.',
      pillLocal: '100% local', pillWada: 'Harmonious palettes',
      sType: 'QR type', sContent: 'Content', sColors: 'Colors', sOptions: 'Options', sNetwork: 'Network',
      lUrl: 'Link', hUrl: 'This link will be encoded inside the QR code.',
      palettes: 'Harmonious palettes',
      lDark: 'Module color', lLight: 'Background color',
      hRand: '“Random” picks a readable pair from classic colour combinations.',
      lMargin: 'Border (margin) — improves scanning reliability',
      gen: 'Generate', swap: 'Swap', rand: 'Random',
      lSsid: 'Wi-Fi name (SSID)', ssidPh: 'MyWifi', hSsid: 'The QR code will suggest joining this network.',
      lPass: 'Password', hPass: 'If “None”, the password field is ignored.',
      lSec: 'Security', hSec: 'Defines how the device connects.', none: 'None',
      preview: 'Preview', empty: 'Your QR will appear here', download: 'Download',
      statusEmpty: 'Nothing to show yet. Click “Generate”.',
      statusGen: 'Generating…',
      statusReady: 'QR ready — you can download it.',
      statusErr: 'Generation error.',
      errUrl: 'Please enter a valid link (https://…).',
      errSsid: 'Please enter a network name (SSID).',
      errPass: 'Enter a password or choose “None” as the security type.',
      errContrast: 'Low contrast: choose darker modules and a lighter background.',
      contrastGood: 'Contrast checked: good scan reliability.',
      contrastBad: 'Low contrast: use dark modules on a light background.',
      wadaPair: 'Pair',
      tips: 'Tips', tipsTitle: 'Three rules for a reliable QR',
      t1: 'Contrast first', t1d: 'Dark modules on a light background is what phones read best. The tool checks it for you.',
      t2: 'Keep the margin', t2d: 'The quiet zone around the QR helps the camera find it, especially in print.',
      t3: 'Test before printing', t3d: 'Scan it with two or three different phones before sharing it.'
    }
  };
  let T = {}; // textes de la langue courante, fournis par AF.i18n (onChange)
  const t = key => T[key];

  // ---------- Infos ----------
  const modal = $('infoModal');
  const main = document.querySelector('main');
  let previousFocus = null;
  function openInfo() {
    previousFocus = document.activeElement;
    main.inert = true;
    modal.setAttribute('aria-hidden', 'false');
    $('closeInfo').focus();
  }
  function closeInfo() {
    modal.setAttribute('aria-hidden', 'true');
    main.inert = false;
    if (previousFocus && previousFocus.focus) previousFocus.focus();
  }
  $('infoBtn').addEventListener('click', openInfo);
  $('closeInfo').addEventListener('click', closeInfo);
  modal.addEventListener('click', e => { if (e.target === modal) closeInfo(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeInfo(); });

  // ---------- Statut et aperçu ----------
  const status = $('status');
  function setStatus(state) { status.dataset.state = state; renderStatus(); }
  function renderStatus() {
    const s = status.dataset.state || 'empty';
    status.textContent = t('status' + s[0].toUpperCase() + s.slice(1)) || t('statusEmpty');
  }
  function fail(key) {
    AF.toast(t(key));
    setStatus('err');
    status.textContent = t(key);
  }

  // ---------- Onglets ----------
  function setMode(mode) {
    const isColor = mode === 'color';
    $('tabColor').setAttribute('aria-selected', String(isColor));
    $('tabWifi').setAttribute('aria-selected', String(!isColor));
    $('panelColor').hidden = !isColor;
    $('panelWifi').hidden = isColor;
    $('tabColor').tabIndex = isColor ? 0 : -1;
    $('tabWifi').tabIndex = isColor ? -1 : 0;
    $('previewBox').hidden = true;
    $('dl').hidden = true;
    setStatus('empty');
  }
  $('tabColor').addEventListener('click', () => setMode('color'));
  $('tabWifi').addEventListener('click', () => setMode('wifi'));
  $('tabColor').addEventListener('keydown', e => { if (e.key === 'ArrowRight') { setMode('wifi'); $('tabWifi').focus(); } });
  $('tabWifi').addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { setMode('color'); $('tabColor').focus(); } });

  // ---------- Couleurs ----------
  const isHex = v => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test((v || '').trim());
  const norm = v => AF.toHex(AF.toRgb(v.trim()));
  const luminance = v => {
    const c = AF.toRgb(v).map(x => x / 255).map(x => (x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4));
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
  };
  const contrast = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const isScannable = (dark, light) => isHex(dark) && isHex(light) && luminance(dark) < luminance(light) && contrast(dark, light) >= 4.5;

  const fields = {
    color: { p1: $('c1'), t1: $('c1t'), p2: $('c2'), t2: $('c2t'), hint: $('contrastColor') },
    wifi: { p1: $('w1'), t1: $('w1t'), p2: $('w2'), t2: $('w2t'), hint: $('contrastWifi') }
  };

  // Le champ texte prend sa propre couleur ; le texte suit la couleur la plus lisible de la paire.
  function paint(input) {
    const v = input.value.trim();
    if (!isHex(v)) return;
    input.style.background = v;
    input.style.color = luminance(v) > .2 ? '#111314' : '#f5ecc2';
  }

  function updateContrast(mode) {
    const f = fields[mode];
    const valid = isScannable(f.p1.value, f.p2.value);
    f.hint.textContent = valid ? t('contrastGood') : t('contrastBad');
    f.hint.classList.toggle('good', valid);
    f.hint.classList.toggle('bad', !valid);
    return valid;
  }

  function setPair(mode, dark, light) {
    const f = fields[mode];
    f.p1.value = f.t1.value = dark;
    f.p2.value = f.t2.value = light;
    f.t1.removeAttribute('aria-invalid');
    f.t2.removeAttribute('aria-invalid');
    paint(f.t1); paint(f.t2);
    updateContrast(mode);
  }

  function markPreset(mode, dark, light) {
    document.querySelectorAll(`.palette[data-target="${mode === 'color' ? 'c' : 'w'}"] .swatch`).forEach(s => {
      s.setAttribute('aria-pressed', String(s.dataset.d === dark && s.dataset.l === light));
    });
  }

  Object.entries(fields).forEach(([mode, f]) => {
    [[f.p1, f.t1], [f.p2, f.t2]].forEach(([picker, text]) => {
      picker.addEventListener('input', () => {
        text.value = picker.value;
        text.removeAttribute('aria-invalid');
        paint(text);
        updateContrast(mode);
        markPreset(mode, f.p1.value, f.p2.value);
      });
      text.addEventListener('input', () => {
        const valid = isHex(text.value);
        text.setAttribute('aria-invalid', String(!valid));
        if (valid) { picker.value = norm(text.value); paint(text); }
        updateContrast(mode);
        markPreset(mode, f.p1.value, f.p2.value);
      });
      paint(text);
    });
  });

  $('swapC').addEventListener('click', () => { const f = fields.color; setPair('color', f.p2.value, f.p1.value); markPreset('color', '', ''); });
  $('swapW').addEventListener('click', () => { const f = fields.wifi; setPair('wifi', f.p2.value, f.p1.value); markPreset('wifi', '', ''); });

  function randomPair(mode) {
    const f = fields[mode];
    let pick;
    do { pick = WADA_PAIRS[Math.floor(Math.random() * WADA_PAIRS.length)]; }
    while (pick[1] === f.p1.value && pick[2] === f.p2.value);
    setPair(mode, pick[1], pick[2]);
    markPreset(mode, pick[1], pick[2]);
    AF.toast(`${t('wadaPair')} #${pick[0]}`);
  }
  $('randC').addEventListener('click', () => randomPair('color'));
  $('randW').addEventListener('click', () => randomPair('wifi'));

  // Pastilles des huit palettes nommées.
  document.querySelectorAll('.palette').forEach(palette => {
    const mode = palette.dataset.target === 'w' ? 'wifi' : 'color';
    PRESETS.forEach(([fr, en, n, d, l], i) => {
      const s = document.createElement('button');
      s.type = 'button';
      s.className = 'swatch';
      s.style.setProperty('--d', d);
      s.style.setProperty('--l', l);
      Object.assign(s.dataset, { fr, en, n, d, l });
      s.setAttribute('aria-pressed', String(i === 0));
      s.addEventListener('click', () => { setPair(mode, d, l); markPreset(mode, d, l); });
      palette.append(s);
    });
  });
  function labelSwatches() {
    document.querySelectorAll('.swatch').forEach(s => {
      const name = `${document.documentElement.lang === 'en' ? s.dataset.en : s.dataset.fr} · #${s.dataset.n}`;
      s.setAttribute('aria-label', name);
      s.title = name;
    });
  }
  // ---------- Génération ----------
  const safeName = s => (s || 'qrcode').replace(/https?:\/\//gi, '').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'qrcode';

  async function renderQR(data, mode, margin, filename) {
    const f = fields[mode];
    const dark = isHex(f.p1.value) ? f.p1.value : '#111314';
    const light = isHex(f.p2.value) ? f.p2.value : '#f5ecc2';
    if (!isScannable(dark, light)) return fail('errContrast');
    $('dl').hidden = true;
    setStatus('gen');
    try {
      await QRCode.toCanvas($('canvas'), data, { width: 256, margin: margin ? 1 : 0, color: { dark, light } });
      $('previewBox').hidden = false;
      // La sérigraphie : la raclette repasse et la feuille se cale (qr.css, .is-printed).
      $('previewBox').classList.remove('is-printed');
      void $('previewBox').offsetWidth;
      $('previewBox').classList.add('is-printed');
      $('dl').href = $('canvas').toDataURL('image/png');
      $('dl').download = filename;
      $('dl').hidden = false;
      setStatus('ready');
    } catch (err) {
      console.error(err);
      fail('statusErr');
    }
  }

  $('formColor').addEventListener('submit', e => {
    e.preventDefault();
    const url = $('url').value.trim();
    try { new URL(url); } catch (_) { $('url').setAttribute('aria-invalid', 'true'); return fail('errUrl'); }
    $('url').removeAttribute('aria-invalid');
    renderQR(url, 'color', $('m1').checked, `ColorQR_${safeName(url)}.png`);
  });

  function syncPasswordState() {
    const none = $('sec').value === 'nopass';
    $('pass').disabled = none;
    $('pass').required = !none;
  }
  $('sec').addEventListener('change', syncPasswordState);
  syncPasswordState();

  $('formWifi').addEventListener('submit', e => {
    e.preventDefault();
    const ssid = $('ssid').value.trim();
    const pass = $('pass').value.trim();
    const sec = $('sec').value;
    if (!ssid) return fail('errSsid');
    if (sec !== 'nopass' && !pass) return fail('errPass');
    const esc = v => v.replace(/([\\;,:"])/g, '\\$1');
    const data = `WIFI:T:${sec};S:${esc(ssid)};${sec !== 'nopass' ? `P:${esc(pass)};` : ''};`;
    renderQR(data, 'wifi', $('m2').checked, `WiFiQR_${safeName(ssid)}.png`);
  });

  AF.i18n(DICT, { onChange: (_, dict) => { T = dict; renderStatus(); updateContrast('color'); updateContrast('wifi'); labelSwatches(); } });
  setMode('color');
})();
