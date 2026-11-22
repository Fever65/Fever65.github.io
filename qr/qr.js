/* ColorQR — QR coloré ou Wi-Fi, généré localement (qrcode@1.4.4).
   Palettes douces foncé / clair ; n'importe quelle couleur est acceptée. */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  // Palettes : [nom fr, nom en, modules (foncé), fond (clair)].
  const PRESETS = [
    ['Encre', 'Ink', '#1a1917', '#f7f5f0'], ['Fever', 'Fever', '#0a0a0a', '#ff7a1a'], ['Ardoise', 'Slate', '#2b2f36', '#eceff3'],
    ['Nuit', 'Night', '#1e2a3a', '#e6edf5'], ['Océan', 'Ocean', '#14365a', '#e1eff6'],
    ['Forêt', 'Forest', '#1f3a2e', '#e7efe8'], ['Olive', 'Olive', '#33361f', '#eff0e2'],
    ['Terre', 'Earth', '#3d2a1f', '#f4ece2'], ['Prune', 'Plum', '#3b2440', '#f3e9f1'],
    ['Bordeaux', 'Burgundy', '#4a1d24', '#f7e8e6'], ['Sable', 'Sand', '#2e2a24', '#efe6d4']
  ];
  const presetName = p => document.documentElement.lang === 'en' ? p[1] : p[0];

  const MODAL = {
    fr: `<p><b>Créé par Fever</b> — projet publié sur <b>ArchiveFever.Work</b>.</p>
      <p>Cet outil génère les QR codes <b>localement dans ton navigateur</b>. Les données saisies ne sont pas envoyées à un serveur.</p>
      <ul>
        <li><b>Vie privée :</b> aucune collecte des contenus saisis.</li>
        <li><b>Usage :</b> tu es responsable du contenu encodé.</li>
        <li><b>Sécurité :</b> un QR peut pointer vers du contenu risqué. Vérifie avant de partager.</li>
        <li><b>Responsabilité :</b> Fever / ArchiveFever.Work ne peuvent être tenus responsables d'un usage malveillant par un tiers.</li>
      </ul>
      <p>Conseil : teste ton QR sur plusieurs téléphones avant de le diffuser.</p>`,
    en: `<p><b>Made by Fever</b> — a project on <b>ArchiveFever.Work</b>.</p>
      <p>This tool generates QR codes <b>locally in your browser</b>. The data you enter is not sent to a server.</p>
      <ul>
        <li><b>Privacy:</b> no collection of the content you enter.</li>
        <li><b>Usage:</b> you are responsible for what you encode.</li>
        <li><b>Security:</b> QR codes can link to risky content. Always verify before sharing.</li>
        <li><b>Liability:</b> Fever / ArchiveFever.Work cannot be held responsible for malicious use by third parties.</li>
      </ul>
      <p>Tip: test your QR on multiple phones before sharing publicly.</p>`
  };

  const DICT = {
    fr: {
      title: 'ColorQR — Générateur de QR personnalisés et Wi-Fi',
      description: 'Crée gratuitement des QR codes personnalisés (lien ou texte) ou des QR Wi-Fi, avec téléchargement PNG.',
      info: 'Infos', close: 'Fermer', modal: MODAL.fr,
      lead: 'Un QR code à tes couleurs pour un lien ou du texte, ou un QR qui connecte au Wi-Fi en un seul scan. Tout se passe dans ton navigateur.',
      sColors: 'Couleurs', palettes: 'Palettes', lText: 'Lien ou texte', textPh: "https://… ou n'importe quel texte",
      lDark: 'Couleur des modules', lLight: 'Couleur du fond',
      lMargin: 'Bordure (marge) — améliore la détection',
      gen: 'Générer', swap: 'Inverser', rand: 'Aléatoire',
      lSsid: 'Nom du Wi-Fi (SSID)', ssidPh: 'MonWifi', lPass: 'Mot de passe', lSec: 'Sécurité', none: 'Aucune',
      preview: 'Aperçu', empty: 'Ton QR apparaîtra ici', download: 'Télécharger',
      statusEmpty: 'Rien à afficher. Clique sur « Générer ».',
      statusGen: 'Génération…',
      statusReady: 'QR prêt — tu peux télécharger.',
      statusErr: 'Erreur lors de la génération.',
      errText: 'Entre un lien ou du texte.',
      errLong: 'Texte trop long pour un QR code : raccourcis-le.',
      errSsid: 'Entre un nom de réseau (SSID).',
      errPass: 'Entre un mot de passe ou choisis « Aucune » comme sécurité.'
    },
    en: {
      title: 'ColorQR — Custom and Wi-Fi QR code generator',
      description: 'Create custom QR codes (link or text) or Wi-Fi QR codes for free, with PNG download.',
      info: 'Info', close: 'Close', modal: MODAL.en,
      lead: 'A QR code in your colors for a link or any text, or one that joins a Wi-Fi network in a single scan. Everything happens in your browser.',
      sColors: 'Colors', palettes: 'Palettes', lText: 'Link or text', textPh: 'https://… or any text',
      lDark: 'Module color', lLight: 'Background color',
      lMargin: 'Border (margin) — improves scanning reliability',
      gen: 'Generate', swap: 'Swap', rand: 'Random',
      lSsid: 'Wi-Fi name (SSID)', ssidPh: 'MyWifi', lPass: 'Password', lSec: 'Security', none: 'None',
      preview: 'Preview', empty: 'Your QR will appear here', download: 'Download',
      statusEmpty: 'Nothing to show yet. Click “Generate”.',
      statusGen: 'Generating…',
      statusReady: 'QR ready — you can download it.',
      statusErr: 'Generation error.',
      errText: 'Please enter a link or some text.',
      errLong: 'Too much text for a QR code: please shorten it.',
      errSsid: 'Please enter a network name (SSID).',
      errPass: 'Enter a password or choose “None” as the security type.',
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

  const fields = {
    color: { p1: $('c1'), t1: $('c1t'), p2: $('c2'), t2: $('c2t') },
    wifi: { p1: $('w1'), t1: $('w1t'), p2: $('w2'), t2: $('w2t') }
  };


  function setPair(mode, dark, light) {
    const f = fields[mode];
    f.p1.value = f.t1.value = dark;
    f.p2.value = f.t2.value = light;
    f.t1.removeAttribute('aria-invalid');
    f.t2.removeAttribute('aria-invalid');
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
        markPreset(mode, f.p1.value, f.p2.value);
      });
      text.addEventListener('input', () => {
        const valid = isHex(text.value);
        text.setAttribute('aria-invalid', String(!valid));
        if (valid) { picker.value = norm(text.value); }
        markPreset(mode, f.p1.value, f.p2.value);
      });
    });
  });

  $('swapC').addEventListener('click', () => { const f = fields.color; setPair('color', f.p2.value, f.p1.value); markPreset('color', '', ''); });
  $('swapW').addEventListener('click', () => { const f = fields.wifi; setPair('wifi', f.p2.value, f.p1.value); markPreset('wifi', '', ''); });

  function randomPair(mode) {
    const f = fields[mode];
    let pick;
    do { pick = PRESETS[Math.floor(Math.random() * PRESETS.length)]; }
    while (pick[2] === f.p1.value && pick[3] === f.p2.value);
    setPair(mode, pick[2], pick[3]);
    markPreset(mode, pick[2], pick[3]);
    AF.toast(presetName(pick));
  }
  $('randC').addEventListener('click', () => randomPair('color'));
  $('randW').addEventListener('click', () => randomPair('wifi'));

  // Étiquettes des palettes : un point de la couleur qui caractérise la palette + son nom.
  // Le point prend le fond s'il est vif (ex. Fever = orange), sinon les modules.
  const chroma = v => { const c = AF.toRgb(v); return Math.max(...c) - Math.min(...c); };
  document.querySelectorAll('.palette').forEach(palette => {
    const mode = palette.dataset.target === 'w' ? 'wifi' : 'color';
    PRESETS.forEach((preset, i) => {
      const [, , d, l] = preset;
      const s = document.createElement('button');
      s.type = 'button';
      s.className = 'swatch';
      s.innerHTML = '<span class="dot" aria-hidden="true"></span><span class="name"></span>';
      s.style.setProperty('--dot', chroma(l) > 80 ? l : d);
      Object.assign(s.dataset, { d, l, i });
      s.setAttribute('aria-pressed', String(i === 0));
      s.addEventListener('click', () => { setPair(mode, d, l); markPreset(mode, d, l); });
      palette.insertBefore(s, palette.querySelector('.swatch-rand')); // le « ? » reste en dernier
    });
  });
  function labelSwatches() {
    document.querySelectorAll('.swatch').forEach(s => {
      s.querySelector('.name').textContent = presetName(PRESETS[s.dataset.i]);
    });
  }
  // ---------- Génération ----------
  const safeName = s => (s || 'qrcode').replace(/https?:\/\//gi, '').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'qrcode';

  async function renderQR(data, mode, margin, filename) {
    const f = fields[mode];
    const dark = isHex(f.p1.value) ? f.p1.value : '#111314';
    const light = isHex(f.p2.value) ? f.p2.value : '#f5ecc2';
    $('dl').hidden = true;
    setStatus('gen');
    try {
      await QRCode.toCanvas($('canvas'), data, { width: 256, margin: margin ? 1 : 0, color: { dark, light } });
      $('previewBox').hidden = false;
      // Petite apparition du QR (qr.css, .is-printed).
      $('previewBox').classList.remove('is-printed');
      void $('previewBox').offsetWidth;
      $('previewBox').classList.add('is-printed');
      $('dl').href = $('canvas').toDataURL('image/png');
      $('dl').download = filename;
      $('dl').hidden = false;
      setStatus('ready');
      // En une colonne, l'aperçu est sous le formulaire : on l'amène à l'écran.
      if (matchMedia('(max-width: 859px)').matches) {
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        $('previewBox').closest('.qr-out').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      }
    } catch (err) {
      console.error(err);
      fail(/too big|amount of data/i.test(String(err && err.message)) ? 'errLong' : 'statusErr');
    }
  }

  $('formColor').addEventListener('submit', e => {
    e.preventDefault();
    const text = $('text').value.trim();
    if (!text) { $('text').setAttribute('aria-invalid', 'true'); return fail('errText'); }
    $('text').removeAttribute('aria-invalid');
    renderQR(text, 'color', $('m1').checked, `ColorQR_${safeName(text)}.png`);
  });
  $('text').addEventListener('input', () => $('text').removeAttribute('aria-invalid'));
  // Entrée génère, Maj+Entrée fait un retour à la ligne.
  $('text').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('formColor').requestSubmit(); }
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

  AF.i18n(DICT, { onChange: (_, dict) => { T = dict; renderStatus(); labelSwatches(); } });
  setMode('color');
})();
