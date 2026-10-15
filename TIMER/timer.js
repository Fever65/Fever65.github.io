/* Minuteur — compte à rebours basé sur l'horloge (Date.now), son local, vibration, mode focus. */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  const DICT = {
    fr: {
      title: 'Minuteur en ligne — ArchiveFever.Work',
      description: 'Un minuteur gratuit et sans compte avec raccourcis, progression visuelle et alerte sonore locale.',
      timer: 'Minuteur', settings: 'Réglages', duration: 'Durée',
      hours: 'Heures', minutes: 'Minutes', seconds: 'Secondes',
      presets: 'Raccourcis', sound: 'Son final', test: 'Tester le son',
      soundHint: 'Le son reste sur ton appareil. Autorise-le en démarrant ou en testant une première fois.',
      progress: 'Progression', focus: 'Mode focus',
      keys: '<kbd>Espace</kbd> démarrer / pause · <kbd>R</kbd> réinitialiser · <kbd>F</kbd> focus',
      start: 'Démarrer', resume: 'Reprendre', pause: 'Pause', reset: 'Réinitialiser',
      idle: 'Prêt', running: 'En cours', paused: 'Pause', done: 'Terminé',
      toastDone: 'Temps écoulé.',
      toastInvalid: 'Choisis une durée supérieure à zéro.',
      titleDone: 'Minuteur terminé',
      toastSoundFail: 'Le son n’a pas pu être lu sur cet appareil.'
    },
    en: {
      title: 'Online timer — ArchiveFever.Work',
      description: 'A free, accountless timer with shortcuts, visual progress, and a local sound alert.',
      timer: 'Timer', settings: 'Settings', duration: 'Duration',
      hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds',
      presets: 'Shortcuts', sound: 'Final sound', test: 'Test sound',
      soundHint: 'Sound stays on your device. Enable it once by starting or testing the timer.',
      progress: 'Progress', focus: 'Focus mode',
      keys: '<kbd>Space</kbd> start / pause · <kbd>R</kbd> reset · <kbd>F</kbd> focus',
      start: 'Start', resume: 'Resume', pause: 'Pause', reset: 'Reset',
      idle: 'Ready', running: 'Running', paused: 'Paused', done: 'Done',
      toastDone: 'Time is up.',
      toastInvalid: 'Pick a duration greater than zero.',
      titleDone: 'Timer done',
      toastSoundFail: 'Sound could not be played on this device.'
    }
  };
  let T = DICT.fr;

  const sound = $('endSound');
  const inputs = ['hours', 'minutes', 'seconds'].map($);
  let audioCtx = null;
  let unlocked = false;
  let state = 'idle';            // idle | running | paused | done
  let totalMs = 0;
  let remainingMs = 0;
  let endAt = 0;
  let rafId = 0;
  let deadline = 0;

  // ---------- Durée ----------
  const pad = n => String(n).padStart(2, '0');
  const clamp = (n, min, max) => Math.min(max, Math.max(min, Number.isFinite(n) ? n : 0));
  const LIMITS = [23, 59, 59];

  function normalizeInputs() {
    inputs.forEach((el, i) => { el.value = String(clamp(parseInt(el.value, 10), 0, LIMITS[i])); });
  }
  function readDurationMs() {
    const [h, m, s] = inputs.map((el, i) => clamp(parseInt(el.value, 10), 0, LIMITS[i]));
    return (h * 3600 + m * 60 + s) * 1000;
  }
  function writeDuration(totalSeconds) {
    inputs[0].value = Math.floor(totalSeconds / 3600);
    inputs[1].value = Math.floor((totalSeconds % 3600) / 60);
    inputs[2].value = totalSeconds % 60;
  }
  function formatTime(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }
  totalMs = remainingMs = readDurationMs();

  // ---------- Rendu ----------
  function render() {
    const pct = totalMs > 0 ? Math.min(100, Math.max(0, (totalMs - remainingMs) / totalMs * 100)) : 0;
    $('display').textContent = formatTime(remainingMs);
    $('display').classList.toggle('done', state === 'done');
    $('ringFill').style.strokeDashoffset = (100 - pct).toFixed(2);
    $('ringDot').style.transform = `rotate(${(pct * 3.6).toFixed(2)}deg)`;
    $('progressBar').setAttribute('aria-valuenow', String(Math.round(pct)));

    const label = $('stateLabel');
    label.textContent = T[state];
    label.classList.toggle('running', state === 'running');
    label.classList.toggle('done', state === 'done');

    $('startBtn').textContent = state === 'paused' ? T.resume : T.start;
    $('startBtn').disabled = state === 'running';
    $('pauseBtn').disabled = state !== 'running';
    $('soundDot').classList.toggle('on', unlocked);
    inputs.forEach(el => { el.disabled = state === 'running'; });
    document.querySelectorAll('.preset').forEach(b => { b.disabled = state === 'running'; });

    if (state === 'running') document.title = formatTime(remainingMs) + ' — ArchiveFever.Work';
    else if (state === 'done') document.title = T.titleDone + ' — ArchiveFever.Work';
    else document.title = T.title;
  }

  // ---------- Son ----------
  // Repli si le MP3 ne peut pas être lu : cinq notes synthétisées (onde triangle).
  async function playFallbackPing() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    const base = audioCtx.currentTime;
    [880, 660, 880, 1175, 880].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const start = base + i * 0.16;
      const dur = 0.115;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.28, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.03);
    });
    return true;
  }

  // Une lecture muette pendant un geste de l'utilisateur autorise la lecture finale.
  async function unlockSound() {
    try {
      sound.muted = true;
      sound.currentTime = 0;
      await sound.play();
      sound.pause();
      sound.currentTime = 0;
    } catch (_) {
      try { await playFallbackPing(); } catch (_) {}
    } finally {
      sound.muted = false;
      unlocked = true;
      render();
    }
  }

  async function playPing() {
    let played = false;
    try {
      sound.muted = false;
      sound.volume = 1;
      sound.currentTime = 0;
      await sound.play();
      played = true;
    } catch (_) {}
    if (!played) {
      try { played = await playFallbackPing(); } catch (_) {}
      if (!played) AF.toast(T.toastSoundFail);
    }
    if ('vibrate' in navigator) { try { navigator.vibrate([100, 60, 100]); } catch (_) {} }
  }

  // ---------- Moteur ----------
  function tick() {
    if (state !== 'running') return;
    remainingMs = Math.max(0, endAt - Date.now());
    render();
    if (remainingMs <= 0) finish();
    else rafId = requestAnimationFrame(tick);
  }

  function stopClock() {
    cancelAnimationFrame(rafId);
    clearTimeout(deadline);
  }

  function start() {
    if (state !== 'paused') {
      normalizeInputs();
      totalMs = remainingMs = readDurationMs();
    }
    if (remainingMs <= 0) { AF.toast(T.toastInvalid); render(); return; }
    unlockSound();
    state = 'running';
    endAt = Date.now() + remainingMs;
    stopClock();
    deadline = setTimeout(finish, remainingMs); // filet si l'onglet est en arrière-plan
    rafId = requestAnimationFrame(tick);
    render();
  }

  function pause() {
    if (state !== 'running') return;
    remainingMs = Math.max(0, endAt - Date.now());
    state = 'paused';
    stopClock();
    render();
  }

  function reset() {
    stopClock();
    normalizeInputs();
    totalMs = remainingMs = readDurationMs();
    state = 'idle';
    render();
  }

  function finish() {
    if (state !== 'running') return;
    stopClock();
    remainingMs = 0;
    state = 'done';
    render();
    playPing();
    AF.toast(T.toastDone);
  }

  // ---------- Entrées ----------
  inputs.forEach(el => el.addEventListener('input', () => {
    if (state === 'running') return;
    normalizeInputs();
    totalMs = remainingMs = readDurationMs();
    state = 'idle';
    render();
  }));
  document.querySelectorAll('.preset').forEach(b => b.addEventListener('click', () => {
    writeDuration(parseInt(b.dataset.min, 10) * 60);
    reset();
  }));
  $('startBtn').addEventListener('click', start);
  $('pauseBtn').addEventListener('click', pause);
  $('resetBtn').addEventListener('click', reset);
  $('testSoundBtn').addEventListener('click', async () => {
    await unlockSound();
    await playPing();
    AF.toast(T.toastDone);
  });

  document.addEventListener('visibilitychange', () => {
    if (state !== 'running') return;
    remainingMs = Math.max(0, endAt - Date.now());
    if (remainingMs <= 0) finish(); else render();
  });

  // ---------- Mode focus : plein écran (si le navigateur l'accepte) et interface réduite au cadran ----------
  const focusBtn = $('focusBtn');
  function setFocus(on) {
    document.body.classList.toggle('focus-mode', on);
    focusBtn.setAttribute('aria-pressed', String(on));
    try {
      const root = document.documentElement;
      if (on && root.requestFullscreen && !document.fullscreenElement) root.requestFullscreen().catch(() => {});
      if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch (_) {}
  }
  const focusOn = () => document.body.classList.contains('focus-mode');
  focusBtn.addEventListener('click', () => setFocus(!focusOn()));
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) setFocus(false); });

  // ---------- Clavier : Espace, R, F, Échap ----------
  document.addEventListener('keydown', e => {
    if ((e.target && e.target.tagName) === 'INPUT' || e.altKey || e.ctrlKey || e.metaKey) return;
    const key = (e.key || '').toLowerCase();
    if (e.code === 'Space') { e.preventDefault(); state === 'running' ? pause() : start(); }
    else if (key === 'r') reset();
    else if (key === 'f') setFocus(!focusOn());
    else if (e.key === 'Escape' && focusOn()) setFocus(false);
  });

  AF.i18n(DICT, { onChange: (_, dict) => { T = dict; render(); } });
})();
