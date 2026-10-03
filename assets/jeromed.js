/* Le test anti-Jérôme — petit jeu humoristique d'ArchiveFever.Work.
   0. Choix de la langue. 1. Faux captcha et quiz absurde. 2. Mesure de « jérômitude ». 3. Screamer. 4. Résultats.
   Les textes viennent de assets/jeromed-i18n.js (window.JEROMED_I18N). */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const rand = (min, max) => min + Math.random() * (max - min);
  const I18N = window.JEROMED_I18N || {};
  const LANGS = Object.keys(I18N);
  const fill = (text, vars = {}) => String(text).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  };

  let lang = 'en';
  let soundEnabled = true;
  let state = 'lang';       // lang | idle | captcha | quiz | launch | scanning | scare | revealed
  let round = 0;
  let timers = [];
  let quizIndex = 0;
  let scanStep = 0;
  let replays = 0;
  let result = null;        // { fear, react, rankIndex, localCount, punchline, speech, at }
  let scareAt = 0;
  let reactSeconds = null;

  // Textes de la langue courante, complétés par l'anglais si une clé manque.
  function t() {
    const base = I18N.en || {};
    const cur = I18N[lang] || {};
    return { ...base, ...cur, diploma: { ...(base.diploma || {}), ...(cur.diploma || {}) } };
  }
  const locale = () => ({ zh: 'zh-CN', pt: 'pt-PT', en: 'en-GB' }[lang] || lang);

  /* ---------- Son : Web Audio, décodé à l'avance, passé dans un compresseur ---------- */
  let audioContext;
  let master;
  let soundBuffer;
  let decoding;
  let voices = [];
  let drone;
  const soundData = fetch('SOUND/o-o.mp3').then(response => {
    if (!response.ok) throw new Error('Audio unavailable');
    return response.arrayBuffer();
  }).catch(() => null);
  // Secours : en fichier local (file://), fetch est bloqué mais un élément <audio> peut lire le MP3.
  const fallbackAudio = new Audio('SOUND/o-o.mp3');
  fallbackAudio.preload = 'auto';

  function prepareSound() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!soundEnabled || !Context) return;
    try {
      if (!audioContext) {
        audioContext = new Context();
        // Le compresseur garde le cri fort sans saturer ni écrêter.
        const limiter = audioContext.createDynamicsCompressor();
        limiter.threshold.value = -10;
        limiter.knee.value = 6;
        limiter.ratio.value = 12;
        limiter.attack.value = .002;
        limiter.release.value = .25;
        master = audioContext.createGain();
        master.gain.value = .95;
        master.connect(limiter).connect(audioContext.destination);
      }
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      // Débloque l'élément <audio> pendant le geste de l'utilisateur (lecture muette immédiatement stoppée).
      if (!fallbackAudio.dataset.unlocked) {
        fallbackAudio.dataset.unlocked = '1';
        fallbackAudio.muted = true;
        const p = fallbackAudio.play();
        if (p && p.then) p.then(() => { fallbackAudio.pause(); fallbackAudio.currentTime = 0; fallbackAudio.muted = false; }).catch(() => { fallbackAudio.muted = false; });
      }
      if (!decoding) decoding = soundData.then(data => data && audioContext.decodeAudioData(data)).then(buffer => { soundBuffer = buffer; }).catch(() => {});
    } catch (_) { /* La blague visuelle fonctionne aussi sans son. */ }
  }
  const canPlay = () => soundEnabled && audioContext && audioContext.state === 'running';
  function track(node) { voices.push(node); node.onended = () => { voices = voices.filter(v => v !== node); }; return node; }
  function stopSound() {
    try { fallbackAudio.pause(); fallbackAudio.currentTime = 0; } catch (_) {}
    voices.forEach(v => { try { v.stop(); } catch (_) {} });
    voices = [];
    drone = null;
  }

  // Grondement grave qui monte pendant l'analyse, puis coupé net avant le cri.
  function startDrone() {
    if (!canPlay()) return;
    const t = audioContext.currentTime;
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    gain.gain.setValueAtTime(.0001, t);
    gain.gain.exponentialRampToValueAtTime(.09, t + 7.5);
    filter.connect(gain).connect(master);
    const a = track(audioContext.createOscillator());
    const b = track(audioContext.createOscillator());
    a.type = 'sawtooth'; a.frequency.value = 73.4;
    b.type = 'sine'; b.frequency.value = 77.8; // léger battement inquiétant
    a.connect(filter); b.connect(filter);
    a.start(t); b.start(t);
    drone = { gain, a, b };
  }
  function stopDrone(fade = .5) {
    if (!drone || !audioContext) return;
    const t = audioContext.currentTime;
    const { gain, a, b } = drone;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, .0001), t);
    gain.gain.exponentialRampToValueAtTime(.0001, t + fade);
    try { a.stop(t + fade + .05); b.stop(t + fade + .05); } catch (_) {}
    drone = null;
  }

  // Cri synthétisé : bruit filtré + scies dissonantes saturées. Puis le son du site par-dessus.
  function playScream() {
    if (!soundBuffer && soundEnabled) {
      try { fallbackAudio.muted = false; fallbackAudio.currentTime = 0; fallbackAudio.volume = 1; const p = fallbackAudio.play(); if (p && p.catch) p.catch(() => {}); } catch (_) {}
    }
    if (!canPlay()) return;
    const ctx = audioContext;
    const t = ctx.currentTime + .005;
    const dur = 1.25;

    const env = ctx.createGain();
    env.gain.setValueAtTime(.0001, t);
    env.gain.exponentialRampToValueAtTime(1, t + .01);
    env.gain.setValueAtTime(1, t + .45);
    env.gain.exponentialRampToValueAtTime(.0001, t + dur);
    env.connect(master);

    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 6); }
    shaper.curve = curve;
    const tone = ctx.createGain();
    tone.gain.value = .5;
    shaper.connect(tone).connect(env);

    const lfo = track(ctx.createOscillator());
    const lfoDepth = ctx.createGain();
    lfo.frequency.value = 31;
    lfoDepth.gain.value = 70;
    lfo.connect(lfoDepth);
    [[1046, 262, 'sawtooth'], [1108, 277, 'square'], [523, 131, 'sawtooth']].forEach(([from, to, type]) => {
      const osc = track(ctx.createOscillator());
      osc.type = type;
      osc.frequency.setValueAtTime(from, t);
      osc.frequency.exponentialRampToValueAtTime(to, t + dur);
      lfoDepth.connect(osc.frequency);
      osc.connect(shaper);
      osc.start(t);
      osc.stop(t + dur);
    });
    lfo.start(t);
    lfo.stop(t + dur);

    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = track(ctx.createBufferSource());
    noise.buffer = noiseBuffer;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = .9;
    band.frequency.setValueAtTime(3200, t);
    band.frequency.exponentialRampToValueAtTime(600, t + dur);
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = .8;
    noise.connect(band).connect(noiseGain).connect(env);
    noise.start(t);
    noise.stop(t + dur);

    if (soundBuffer) {
      const gain = ctx.createGain();
      gain.gain.value = .9;
      gain.connect(master);
      const source = track(ctx.createBufferSource());
      source.buffer = soundBuffer;
      source.connect(gain);
      source.start(t + .08);
      source.stop(t + .08 + Math.min(soundBuffer.duration, 4));
    }
  }

  /* ---------- Outils ---------- */
  function schedule(delay, callback) {
    const current = round;
    timers.push(setTimeout(() => { if (round === current) callback(); }, delay));
  }
  function clearTimers() { round++; timers.forEach(clearTimeout); timers = []; }
  function show(id) {
    for (const act of ['langPage', 'mainPage', 'scanPage', 'chaos']) $(act).hidden = act !== id;
  }
  function focus(id) { const el = $(id); if (el) el.focus({ preventScroll: true }); }
  let toastTimer;
  function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3600);
  }

  /* ---------- Étape 0 : choix de la langue ---------- */
  function detectLanguage() {
    const saved = store.get('jeromed_lang');
    if (I18N[saved]) return saved;
    for (const code of navigator.languages || [navigator.language || '']) {
      const short = String(code).toLowerCase().split('-')[0];
      if (I18N[short]) return short;
    }
    const site = store.get('af_lang');
    return I18N[site] ? site : 'en';
  }

  function buildLanguageGrid() {
    const grid = $('langGrid');
    grid.replaceChildren();
    for (const code of LANGS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lang-option';
      button.lang = code;
      button.dir = I18N[code].dir || 'ltr';
      button.dataset.code = code;
      button.textContent = I18N[code].name;
      button.addEventListener('click', () => { setLang(code); startGame(); });
      grid.append(button);
    }
  }

  function openLanguagePicker() {
    clearTimers();
    stopDrone(.05);
    stopSound();
    hardReset();
    state = 'lang';
    show('langPage');
    document.querySelectorAll('.lang-option').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.code === lang)));
    focus('pickTitle');
  }

  function startGame() {
    store.set('jeromed_lang', lang);
    if (lang === 'fr' || lang === 'en') store.set('af_lang', lang);
    reset();
  }

  /* ---------- Étape 1 : captcha et quiz ---------- */
  function onCaptcha() {
    if (state !== 'idle') return;
    prepareSound(); // premier geste : on débloque et décode le son dès maintenant
    state = 'captcha';
    const button = $('goBtn');
    button.classList.add('loading');
    button.setAttribute('aria-busy', 'true');
    schedule(1000, () => {
      button.classList.remove('loading');
      button.removeAttribute('aria-busy');
      button.setAttribute('aria-checked', 'true');
      schedule(600, () => {
        state = 'quiz';
        quizIndex = 0;
        $('mainPage').classList.add('quizzing');
        $('stepQuiz').hidden = false;
        renderQuiz();
      });
    });
  }

  function quizItems() {
    const x = t();
    return [
      { q: x.q1, hint: x.q1hint, grid: true },
      { q: x.q2, options: x.q2a },
      { q: x.q3, options: x.q3a }
    ];
  }

  function renderQuiz() {
    const x = t();
    const items = quizItems();
    const item = items[quizIndex];
    $('quizCount').textContent = `${x.question} ${quizIndex + 1}/${items.length}`;
    document.querySelectorAll('.quiz-dots i').forEach((dot, i) => dot.classList.toggle('on', i <= quizIndex));
    $('quizQ').textContent = item.q;
    $('quizHint').textContent = item.hint || '';
    $('quizFeedback').textContent = '';
    $('quizNext').hidden = true;
    $('quizNext').textContent = x.next;
    const grid = $('quizGrid');
    const options = $('quizOptions');
    grid.replaceChildren();
    options.replaceChildren();
    grid.hidden = !item.grid;

    if (item.grid) {
      for (let i = 0; i < 9; i++) {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'tile';
        tile.setAttribute('aria-pressed', 'false');
        tile.setAttribute('aria-label', String(i + 1));
        const img = document.createElement('img');
        img.src = 'IMG/Jerome.webp';
        img.alt = '';
        img.width = 100;
        img.height = 100;
        img.decoding = 'async';
        tile.append(img);
        tile.addEventListener('click', () => tile.setAttribute('aria-pressed', String(tile.getAttribute('aria-pressed') !== 'true')));
        grid.append(tile);
      }
      const validate = document.createElement('button');
      validate.type = 'button';
      validate.className = 'go-btn primary';
      validate.textContent = x.validate;
      validate.addEventListener('click', () => {
        const tiles = [...grid.querySelectorAll('.tile')];
        const selected = tiles.filter(tile => tile.getAttribute('aria-pressed') === 'true').length;
        validate.remove();
        grid.hidden = true; // la grille se replie pour laisser la place à la réponse
        $('quizHint').textContent = '';
        const y = t();
        answer(selected === 9 ? y.q1all : selected === 0 ? y.q1none : fill(y.q1some, { n: 9 - selected }));
      });
      options.append(validate);
    } else {
      item.options.forEach(([label, reply], i) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'option';
        option.dataset.key = String.fromCharCode(65 + i);
        option.setAttribute('aria-pressed', 'false');
        option.textContent = label;
        option.addEventListener('click', () => {
          option.setAttribute('aria-pressed', 'true');
          options.querySelectorAll('.option').forEach(o => { o.disabled = true; });
          answer(reply);
        });
        options.append(option);
      });
    }
    focus('quizQ');
  }

  function answer(reply) {
    $('quizFeedback').textContent = reply;
    $('quizNext').hidden = false;
    $('quizNext').focus({ preventScroll: true });
    $('quizNext').scrollIntoView({ block: 'nearest' });
  }

  function nextQuestion() {
    quizIndex++;
    if (quizIndex < quizItems().length) { renderQuiz(); return; }
    state = 'launch';
    $('stepQuiz').hidden = true;
    $('stepLaunch').hidden = false;
    focus('launchTitle');
  }

  function launch(withSound) {
    if (state !== 'launch') return;
    soundEnabled = withSound;
    if (withSound) prepareSound(); else { stopDrone(.05); stopSound(); }
    renderTexts();
    startScan();
  }

  /* ---------- Étape 2 : la mesure ---------- */
  // [délai, pourcentage, étape, vitesse de la barre, ambiance]
  const timeline = [[300, 12, 0, '.6s'], [1400, 31, 1, '.8s'], [2700, 58, 2, '1.2s', 'uneasy'], [4300, 74, 3, '1.6s'], [5700, 81, 4, '.4s', 'alarm'], [7000, 93, 5, '1.4s', 'calm-down'], [8100, 100, 6, '.6s']];

  function startScan({ early = false } = {}) {
    prepareSound();
    state = 'scanning';
    scanStep = 0;
    body.classList.remove('uneasy', 'alarm', 'calm', 'snap');
    show('scanPage');
    $('allClear').hidden = true;
    setProgress(0);
    $('loadingTxt').textContent = t().steps[0];
    focus('scanTitle');
    requestAnimationFrame(() => requestAnimationFrame(() => body.classList.add('tense')));
    startDrone();

    // Au deuxième essai, Jérôme n'attend plus la fin de la mesure.
    const cutAt = early ? Math.floor(rand(1, 4)) : Infinity;
    for (const [delay, percent, index, speed, mood] of timeline) {
      if (index > cutAt) break;
      schedule(delay, () => {
        scanStep = index;
        $('barFill').style.setProperty('--bar-speed', speed);
        setProgress(percent);
        $('loadingTxt').textContent = t().steps[index];
        if (mood === 'uneasy') body.classList.add('uneasy');
        if (mood === 'alarm') body.classList.add('alarm');
        if (mood === 'calm-down') body.classList.remove('alarm', 'uneasy');
        if (index === cutAt) schedule(rand(500, 1300), scare);
        if (percent === 100) {
          // Le moment de calme : tout va bien… silence… puis Jérôme.
          $('allClear').hidden = false;
          body.classList.add('calm');
          stopDrone(.35);
          schedule(rand(1300, 2600), scare);
        }
      });
    }
  }
  function snapAmbience() {
    body.classList.add('snap');
    body.classList.remove('tense', 'uneasy', 'alarm', 'calm');
  }
  function setProgress(percent) {
    $('barFill').style.width = percent + '%';
    $('loadingBar').setAttribute('aria-valuenow', String(percent));
    $('loadingPct').textContent = percent + '%';
  }

  /* ---------- Étape 3 : le screamer ---------- */
  function scare() {
    if (state !== 'scanning') return;
    state = 'scare';
    stopDrone(.02);
    const overlay = $('scare');
    overlay.classList.remove('out', 'go');
    overlay.hidden = false;
    void overlay.offsetWidth; // relance les animations à chaque partie
    if (!reducedMotion.matches) overlay.classList.add('go');
    playScream();
    scareAt = performance.now();
    reactSeconds = null;
    snapAmbience();
    schedule(1750, () => {
      overlay.classList.add('out');
      reveal();
      schedule(450, () => { overlay.hidden = true; overlay.classList.remove('out', 'go'); });
    });
  }

  /* ---------- Étape 4 : résultats ---------- */
  function reveal() {
    state = 'revealed';
    body.classList.remove('snap');
    const localCount = Number(store.get('jeromed_victims') || 0) + 1;
    store.set('jeromed_victims', String(localCount));
    const fear = Math.round(rand(replays ? 74 : 86, 100));
    result = {
      fear,
      react: reactSeconds !== null ? reactSeconds : rand(.11, .34),
      rankIndex: fear >= 98 ? 2 : fear >= 90 ? 1 : 0,
      localCount,
      punchline: Math.floor(Math.random() * (t().punchlines || ['']).length),
      speech: Math.floor(Math.random() * (t().speech || ['']).length),
      at: new Date()
    };
    renderResult();
    show('chaos');
    focus('revealTitle');
    rain();
  }

  function renderResult() {
    if (!result) return;
    const x = t();
    const nf = new Intl.NumberFormat(locale());
    $('victim').textContent = result.localCount > 1 ? fill(x.victimN, { n: nf.format(result.localCount) }) : x.victimFirst;
    $('punchline').textContent = x.punchlines[result.punchline % x.punchlines.length];
    $('speech').textContent = x.speech[result.speech % x.speech.length];
    $('fearPct').textContent = new Intl.NumberFormat(locale(), { style: 'percent' }).format(result.fear / 100);
    $('reactTime').textContent = `${new Intl.NumberFormat(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(result.react)} s`;
    $('rank').textContent = x.ranks[result.rankIndex];
  }

  function rain() {
    if (reducedMotion.matches) return;
    const layer = $('rain');
    layer.replaceChildren();
    const count = window.innerWidth < 600 ? 12 : 22;
    for (let i = 0; i < count; i++) {
      const img = document.createElement('img');
      img.src = 'IMG/Jerome.webp';
      img.alt = '';
      img.className = 'drop';
      const size = Math.round(rand(28, 76));
      img.width = size;
      img.height = size;
      img.style.left = rand(-4, 98) + 'vw';
      img.style.setProperty('--d', rand(2.2, 4.2).toFixed(2) + 's');
      img.style.setProperty('--delay', rand(0, 1.6).toFixed(2) + 's');
      img.style.setProperty('--r', Math.round(rand(-540, 540)) + 'deg');
      img.addEventListener('animationend', () => img.remove(), { once: true });
      layer.append(img);
    }
  }

  /* ---------- Diplôme téléchargeable ---------- */
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function downloadDiploma() {
    if (!result) return;
    const x = t();
    const d = x.diploma;
    const button = $('diplomaBtn');
    button.disabled = true;
    try {
      if (document.fonts) await Promise.all(['700 80px "Inter"', '600 40px "Inter"', '400 28px "Inter"'].map(f => document.fonts.load(f))).catch(() => {});
      const face = await loadImage('IMG/Jerome.webp');
      const W = 1600, H = 1130;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const c = canvas.getContext('2d');
      const font = '"Inter", system-ui, "Noto Sans", "Segoe UI", sans-serif';
      c.direction = x.dir === 'rtl' ? 'rtl' : 'ltr';

      c.fillStyle = '#0d0d0d';
      c.fillRect(0, 0, W, H);
      c.strokeStyle = '#ff981f';
      c.lineWidth = 4;
      c.strokeRect(48, 48, W - 96, H - 96);
      c.strokeStyle = '#2a2a2a';
      c.lineWidth = 1.5;
      c.strokeRect(66, 66, W - 132, H - 132);

      c.textAlign = 'center';
      c.fillStyle = '#878787';
      c.font = `500 24px ${font}`;
      c.fillText(x.introTitle, W / 2, 150);
      c.fillStyle = '#ededed';
      c.font = `700 80px ${font}`;
      c.fillText(d.title, W / 2, 250);
      c.fillStyle = '#ff981f';
      c.font = `600 40px ${font}`;
      c.fillText(d.subtitle, W / 2, 312);

      c.save();
      c.beginPath();
      c.arc(W / 2, 460, 100, 0, Math.PI * 2);
      c.clip();
      c.drawImage(face, W / 2 - 100, 360, 200, 200);
      c.restore();

      c.fillStyle = '#a1a1a1';
      c.font = `400 28px ${font}`;
      c.fillText(d.attest, W / 2, 630);
      c.fillStyle = '#ededed';
      c.font = `700 68px ${font}`;
      c.fillText(d.got, W / 2, 715);
      const date = result.at.toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
      const time = result.at.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
      c.fillStyle = '#a1a1a1';
      c.font = `400 28px ${font}`;
      c.fillText(fill(d.on, { d: date, t: time }), W / 2, 770);

      const stats = [[d.fear, $('fearPct').textContent], [d.rank, x.ranks[result.rankIndex]], [d.count, String(result.localCount)]];
      stats.forEach(([label, value], i) => {
        const cx = W / 2 + (i - 1) * 420;
        c.fillStyle = '#878787';
        c.font = `500 22px ${font}`;
        c.fillText(label, cx, 870);
        c.fillStyle = '#ff981f';
        c.font = `600 36px ${font}`;
        c.fillText(value, cx, 918);
      });

      c.save();
      c.translate(W - 240, H - 220);
      c.rotate(-.26);
      c.strokeStyle = 'rgba(255,107,94,.85)';
      c.fillStyle = 'rgba(255,107,94,.85)';
      c.lineWidth = 5;
      c.beginPath(); c.arc(0, 0, 110, 0, Math.PI * 2); c.stroke();
      c.font = `700 26px ${font}`;
      c.fillText(d.stamp[0], 0, -4);
      c.fillText(d.stamp[1], 0, 30);
      c.restore();

      c.fillStyle = '#878787';
      c.font = `400 20px ${font}`;
      c.textAlign = 'left';
      c.fillText(d.sign, 140, 1010);
      c.textAlign = 'center';
      c.fillText('archivefever.work', W / 2, H - 80);

      const blob = await new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png'));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `jeromed-${lang}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (_) {
      toast(t().diplomaFail);
    } finally {
      button.disabled = false;
    }
  }

  /* ---------- Partage ---------- */
  async function share() {
    const x = t();
    const url = location.href.split('#')[0];
    if (navigator.share) {
      try { await navigator.share({ title: x.shareTitle, text: x.shareText, url }); return; }
      catch (error) { if (error && error.name === 'AbortError') return; }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast(x.copied);
    } catch (_) {
      toast(x.copyFail + url);
    }
  }

  /* ---------- Réinitialisation et textes ---------- */
  function hardReset() {
    snapAmbience();
    requestAnimationFrame(() => requestAnimationFrame(() => body.classList.remove('snap')));
    $('scare').hidden = true;
    $('scare').classList.remove('go', 'out');
    $('rain').replaceChildren();
    $('mainPage').classList.remove('quizzing');
    $('stepCaptcha').hidden = false;
    $('stepQuiz').hidden = true;
    $('stepLaunch').hidden = true;
    const captcha = $('goBtn');
    captcha.classList.remove('loading');
    captcha.removeAttribute('aria-busy');
    captcha.setAttribute('aria-checked', 'false');
    $('allClear').hidden = true;
    $('barFill').style.width = '0%';
    $('loadingBar').setAttribute('aria-valuenow', '0');
    scanStep = 0;
    quizIndex = 0;
  }

  function reset(focusStart = true) {
    clearTimers();
    stopDrone(.05);
    stopSound();
    hardReset();
    state = 'idle';
    show('mainPage');
    if (focusStart) focus('introTitle');
  }

  function renderTexts() {
    const x = t();
    document.title = x.docTitle;
    for (const id of ['pickTitle', 'eyebrow', 'introTitle', 'introCopy', 'captchaLabel', 'captchaBrand', 'launchTitle', 'launchCopy', 'launchSound', 'launchMute', 'scanTitle', 'allClear', 'fearLabel', 'reactLabel', 'rankLabel', 'diplomaBtn', 'shareBtn', 'replayBtn', 'supportLink', 'homeLink', 'escapeHint', 'footerNote', 'langBtnLabel']) {
      const key = { launchSound: 'launchSound', footerNote: 'footer', langBtnLabel: 'langBtn' }[id] || id;
      if ($(id)) $(id).textContent = x[key];
    }
    $('pickGo').textContent = fill(x.pickGo, { lang: x.name });
    $('langCurrent').textContent = x.name;
    $('soundBtn').textContent = soundEnabled ? x.soundOn : x.soundOff;
    $('soundBtn').setAttribute('aria-pressed', String(soundEnabled));
    $('loadingTxt').textContent = x.steps[scanStep];
  }

  function setLang(value) {
    lang = I18N[value] ? value : 'en';
    const x = t();
    document.documentElement.lang = lang;
    document.documentElement.dir = x.dir === 'rtl' ? 'rtl' : 'ltr';
    renderTexts();
    if (state === 'quiz' && !$('stepQuiz').hidden && !$('quizFeedback').textContent) renderQuiz();
    renderResult();
    document.querySelectorAll('.lang-option').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.code === lang)));
  }

  /* ---------- Branchements ---------- */
  $('pickGo').addEventListener('click', startGame);
  $('langBtn').addEventListener('click', openLanguagePicker);
  $('goBtn').addEventListener('click', onCaptcha);
  $('quizNext').addEventListener('click', nextQuestion);
  $('launchSound').addEventListener('click', () => launch(true));
  $('launchMute').addEventListener('click', () => launch(false));
  $('replayBtn').addEventListener('click', () => {
    replays++;
    clearTimers();
    stopSound();
    $('rain').replaceChildren();
    startScan({ early: true });
  });
  $('diplomaBtn').addEventListener('click', downloadDiploma);
  $('shareBtn').addEventListener('click', share);
  $('soundBtn').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (!soundEnabled) { stopDrone(.05); stopSound(); } else prepareSound();
    renderTexts();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && state !== 'lang') reset(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && !['revealed', 'idle', 'lang'].includes(state)) reset(false); });
  window.addEventListener('pagehide', () => { if (state !== 'lang') reset(false); });
  // Vrai temps de réaction : premier geste après l'apparition de Jérôme.
  document.addEventListener('pointerdown', () => {
    if (!scareAt || (state !== 'scare' && state !== 'revealed')) return;
    const seconds = (performance.now() - scareAt) / 1000;
    scareAt = 0;
    if (seconds >= 3) return;
    reactSeconds = Math.max(.08, seconds);
    if (result) { result.react = reactSeconds; renderResult(); }
  }, { passive: true });

  // Arrivée : on demande la langue (la plus probable est présélectionnée).
  buildLanguageGrid();
  setLang(detectLanguage());
  hardReset();
  state = 'lang';
  show('langPage');
})();
