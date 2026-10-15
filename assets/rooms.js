/* La Carte — ce qui vit dans les pièces : mémoire des visites, pièce secrète, miniatures. */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = id => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Mémoire : sept pièces à voir, la huitième s'ouvre ----------
  const KEY = 'af_map_visited';
  const SEVEN = ['z1', 'z2', 'z3', 'z4', 'z5', 'z6', 'z7'];
  const load = () => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(v) ? v.filter(id => SEVEN.includes(id)) : [];
    } catch (_) { return []; }
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify([...visited])); } catch (_) {} };
  let visited = new Set(load());
  function paint() {
    SEVEN.forEach(id => $(id)?.classList.toggle('is-visited', visited.has(id)));
    const c = $('mapCount');
    if (c) c.textContent = String(visited.size);
    $('z8')?.classList.toggle('is-open', visited.size === SEVEN.length);
  }
  addEventListener('af:visit', e => {
    if (!SEVEN.includes(e.detail) || visited.has(e.detail)) return;
    visited.add(e.detail);
    save();
    paint();
    if (visited.size === SEVEN.length) AF.toast(window.AFHome ? AFHome.t('secretToast') : '');
  });
  addEventListener('storage', e => { if (e.key === KEY) { visited = new Set(load()); paint(); } });
  paint();

  // ---------- Miniatures ----------
  const fmt = v => v.toLocaleString(root.lang === 'en' ? 'en' : 'fr', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const ease = t => 1 - Math.pow(1 - t, 3);

  // z2 · la presse : 84,1 ko écrasés à 30,4 ko, en boucle (2,618 s de presse, 1,618 s de pause).
  const num = $('pressNum'), bar = $('pressBar');
  const FROM = 84.1, TO = 30.4, PRESS = 2618, HOLD = 1618;
  if (num && bar) {
    const draw = v => { num.textContent = fmt(v); bar.style.transform = `scaleX(${v / FROM})`; };
    if (reduce) draw(TO);
    else setInterval(() => {
      const t = (performance.now() % (PRESS + HOLD)) / PRESS;
      draw(FROM - (FROM - TO) * ease(Math.min(1, t)));
    }, 61.8);
  }

  // z3 · un vrai QR vers ColorQR, qui change de combinaison Wada à chaque passage.
  const PAIRS = [['#112f2c', '#fbe6a0'], ['#501345', '#f8ed43'], ['#12354e', '#afd472'], ['#1e0e3f', '#ffdd00'], ['#253122', '#f8b6ba'], ['#111314', '#ebd3a2']];
  let pair = 0;
  const qr = $('qrMini');
  const drawQR = () => {
    if (!qr || !window.QRCode) return;
    QRCode.toCanvas(qr, 'https://archivefever.work/QR/', { width: 512, margin: 1, color: { dark: PAIRS[pair][0], light: PAIRS[pair][1] } }, () => {});
  };
  if (qr) {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.4.4/build/qrcode.min.js';
    s.onload = drawQR;
    document.head.append(s);
    $('z3').addEventListener('pointerenter', () => { pair = (pair + 1) % PAIRS.length; drawQR(); });
  }

  // z4 · l'heure qu'il est, vraiment.
  const hm = $('clockHM'), sec = $('clockS'), sweep = $('clockSweep');
  if (hm) {
    const p2 = n => String(n).padStart(2, '0');
    const draw = () => {
      const d = new Date();
      hm.textContent = `${p2(d.getHours())}:${p2(d.getMinutes())}`;
      sec.textContent = `:${p2(d.getSeconds())}`;
      sweep.style.transform = `scaleX(${d.getSeconds() / 59})`;
    };
    draw();
    setTimeout(() => { draw(); setInterval(draw, 1000); }, 1000 - new Date().getMilliseconds());
  }

  // z5 · les 120 hauteurs ; Y120 dans la quatrième couleur de la combinaison.
  const bars = $('bars');
  if (bars) bars.append(...Array.from({ length: 120 }, (_, i) => {
    const b = document.createElement('i');
    b.style.setProperty('--h', ((i + 1) / 120).toFixed(4));
    if (i === 119) b.className = 'top';
    return b;
  }));

  // z6 · Jérôme suit le pointeur du regard (penche la tête, ±16°).
  const jer = $('jeromeMini');
  if (jer && !reduce) {
    let pending = 0;
    addEventListener('pointermove', e => {
      if (pending) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        const r = jer.getBoundingClientRect();
        const dx = e.clientX - (r.x + r.width / 2);
        jer.style.transform = `rotate(${Math.max(-16, Math.min(16, dx / innerWidth * 48)).toFixed(2)}deg)`;
      });
    });
  }
})();
