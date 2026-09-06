(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const copy = {
    fr: { eyebrow: 'Petite vérification de routine', introTitle: 'Merci d’avoir scanné ce QR code.', introCopy: 'Encore un clic. Ça devrait bien se passer.', allClear: '✓ Rien à signaler. Vous pouvez respirer.', speech: 'On m’a appelé ?', punchline: 'Le seul bug, c’était Jérôme.', replayBtn: 'Je me ferai pas avoir deux fois →', supportLink: 'Offrir un café à l’imposteur ↗', homeLink: '← Retour à l’accueil', escapeHint: 'Échap pour recommencer', soundOn: 'Son : activé', soundOff: 'Son : coupé', language: 'Langue', progress: 'Vérification', steps: ['Initialisation…', 'Recherche de trucs suspects…', 'Négociation avec le dernier pixel…', 'Toujours le dernier pixel. Il est têtu.', 'Vérification terminée.'] },
    en: { eyebrow: 'Just a routine check', introTitle: 'Thank you for scanning this QR code.', introCopy: 'One more click. What could possibly go wrong?', allClear: '✓ All clear. You can relax now.', speech: 'You rang?', punchline: 'The only bug was Jerome.', replayBtn: 'I won’t fall for it twice →', supportLink: 'Buy the impostor a coffee ↗', homeLink: '← Back to home', escapeHint: 'Escape to start over', soundOn: 'Sound: on', soundOff: 'Sound: off', language: 'Language', progress: 'Verification', steps: ['Initializing…', 'Checking for suspicious things…', 'Negotiating with the last pixel…', 'Still the last pixel. It’s stubborn.', 'Verification complete.'] }
  };
  let lang = 'fr';
  let soundEnabled = true;
  let state = 'idle';
  let step = 0;
  let round = 0;
  let timers = [];
  let audioContext;
  let source;
  let soundBuffer;
  let soundRequest;
  const soundData = fetch('SOUND/o-o.mp3').then(response => {
    if (!response.ok) throw new Error('Audio unavailable');
    return response.arrayBuffer();
  }).catch(() => null);

  function stopSound() {
    if (source) { try { source.stop(); } catch (_) {} source.disconnect(); source = null; }
  }
  function prepareSound() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!soundEnabled || !Context) return;
    try {
      if (!audioContext) audioContext = new Context();
      audioContext.resume().catch(() => {});
      if (!soundRequest) soundRequest = soundData.then(data => data && audioContext.decodeAudioData(data)).then(buffer => { soundBuffer = buffer; }).catch(() => {});
    } catch (_) { /* The visual joke also works when audio is unavailable. */ }
  }
  function playSound() {
    if (!soundEnabled || !soundBuffer || !audioContext || audioContext.state !== 'running') return;
    stopSound();
    const gain = audioContext.createGain();
    gain.gain.value = .42;
    gain.connect(audioContext.destination);
    source = audioContext.createBufferSource();
    source.buffer = soundBuffer;
    source.connect(gain);
    source.onended = () => gain.disconnect();
    source.start();
    source.stop(audioContext.currentTime + Math.min(soundBuffer.duration, 4));
  }
  function setLang(value) {
    lang = copy[value] ? value : 'fr';
    document.documentElement.lang = lang;
    const text = copy[lang];
    for (const id of ['eyebrow', 'introTitle', 'introCopy', 'allClear', 'speech', 'punchline', 'replayBtn', 'supportLink', 'homeLink', 'escapeHint']) $(id).textContent = text[id];
    $('soundBtn').textContent = soundEnabled ? text.soundOn : text.soundOff;
    $('soundBtn').setAttribute('aria-pressed', String(soundEnabled));
    $('langGroup').setAttribute('aria-label', text.language);
    $('loadingBar').setAttribute('aria-label', text.progress);
    $('loadingTxt').textContent = text.steps[step];
    $('btnFR').setAttribute('aria-pressed', String(lang === 'fr'));
    $('btnEN').setAttribute('aria-pressed', String(lang === 'en'));
    try { localStorage.setItem('af_lang', lang); } catch (_) {}
  }
  function reset(focus = true) {
    round++;
    timers.forEach(clearTimeout);
    timers = [];
    stopSound();
    state = 'idle';
    step = 0;
    $('chaos').hidden = true;
    $('mainPage').hidden = false;
    $('loadingWrap').hidden = true;
    $('allClear').hidden = true;
    $('goBtn').disabled = false;
    $('loadingBar').setAttribute('aria-valuenow', '0');
    $('barFill').style.width = '0%';
    if (focus) $('goBtn').focus({ preventScroll: true });
  }
  function start() {
    if (state === 'loading') return;
    reset(false);
    prepareSound(); // Resume within the user's click, including on mobile browsers.
    state = 'loading';
    const currentRound = round;
    $('goBtn').disabled = true;
    $('loadingWrap').hidden = false;
    $('loadingTxt').textContent = copy[lang].steps[0];
    function schedule(delay, callback) {
      timers.push(setTimeout(() => { if (round === currentRound) callback(); }, delay));
    }
    [[200, 18, 0], [900, 63, 1], [1800, 99, 2], [2800, 99, 3], [3500, 100, 4]].forEach(([delay, percent, index]) => schedule(delay, () => {
      step = index;
      $('barFill').style.width = percent + '%';
      $('loadingBar').setAttribute('aria-valuenow', String(percent));
      $('loadingTxt').textContent = copy[lang].steps[index];
      if (percent === 100) $('allClear').hidden = false;
    }));
    schedule(4800, () => {
      state = 'revealed';
      $('mainPage').hidden = true;
      $('chaos').hidden = false;
      $('revealTitle').focus({ preventScroll: true });
      playSound();
    });
  }
  $('goBtn').addEventListener('click', start);
  $('replayBtn').addEventListener('click', start);
  $('soundBtn').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (!soundEnabled) stopSound(); else prepareSound();
    setLang(lang);
  });
  $('btnFR').addEventListener('click', () => setLang('fr'));
  $('btnEN').addEventListener('click', () => setLang('en'));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') reset(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(false); });
  window.addEventListener('pagehide', () => reset(false));
  try { lang = localStorage.getItem('af_lang') || 'fr'; } catch (_) {}
  setLang(lang);
})();
