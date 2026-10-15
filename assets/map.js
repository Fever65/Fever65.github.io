/* La Carte — la caméra. Glisser, zoomer par paliers de φ, voler de pièce en pièce.
   Le monde mesure φ × U (U = 1000 px) ; chaque pièce porte sa géométrie en unités de U (--x, --y, --s).
   La page suit la pièce sous le centre de l'écran : html[data-room], html[data-wada], theme-color.
   Après 1 s cadré sur une pièce, l'événement « af:visit » part (rooms.js tient la mémoire). */
(() => {
  'use strict';
  const PHI = 1.618034, U = 1000, W = PHI * U;
  const root = document.documentElement;
  const map = document.getElementById('map');
  const world = document.getElementById('world');
  if (!map || !world || !root.classList.contains('js-map')) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const rooms = [...world.querySelectorAll('.room')].map((el, i) => {
    const v = n => parseFloat(el.style.getPropertyValue('--' + n)) * U;
    const x = v('x'), y = v('y'), s = v('s');
    return { el, i, id: el.id, x, y, s, cx: x + s / 2, cy: y + s / 2 };
  });
  const byId = id => rooms.find(r => r.id === id);
  const meta = document.querySelector('meta[name="theme-color"]');
  const where = document.getElementById('mapWhere');
  const planBtn = document.getElementById('mapPlan');

  let vw = innerWidth, vh = innerHeight;
  const cam = { x: rooms[0].cx, y: rooms[0].cy, k: 1 };
  const goal = { ...cam };
  const vel = { x: 0, y: 0 };
  let current = null, dragging = false, raf = 0, last = 0;

  const fitK = r => Math.min(vw, vh) / r.s;
  const overviewK = () => Math.min(vw / W, vh / U) * .764;
  const clampK = k => Math.min(fitK(rooms[rooms.length - 1]) * PHI, Math.max(overviewK() * .854, k));
  const clampXY = g => { g.x = Math.min(W, Math.max(0, g.x)); g.y = Math.min(U, Math.max(0, g.y)); };
  const fitted = () => current && Math.abs(Math.log(current.s * cam.k / Math.min(vw, vh))) < .1;

  function render() {
    world.style.transform = `translate(${vw / 2 - cam.x * cam.k}px, ${vh / 2 - cam.y * cam.k}px) scale(${cam.k})`;
  }

  // ---------- La pièce courante ----------
  // innerText ignore les variantes masquées (pièce secrète fermée/ouverte).
  const label = r => {
    const t = r.el.querySelector('.room-t');
    return (t.innerText || t.textContent).replace(/\s+/g, ' ').trim();
  };
  function setRoom(r) {
    root.dataset.room = r.id;
    try { sessionStorage.setItem('af_map_room', r.id); } catch (_) {}
    root.dataset.wada = r.el.dataset.wada;
    if (meta) meta.content = AF.toHex(AF.toRgb(AF.palette(r.el).bg));
    if (where) where.textContent = label(r);
  }
  let dwell = 0, dwellId = '';
  function update() {
    const r = rooms.find(r => cam.x >= r.x && cam.x <= r.x + r.s && cam.y >= r.y && cam.y <= r.y + r.s) || current;
    const over = cam.k < fitK(rooms[0]) * .9;
    root.classList.toggle('is-overview', over);
    if (planBtn) planBtn.setAttribute('aria-pressed', String(over));
    if (r && r !== current) { current = r; setRoom(r); }
    const id = r && !over && r.s * cam.k >= Math.min(vw, vh) * .618 ? r.id : '';
    if (id !== dwellId) {
      clearTimeout(dwell);
      dwellId = id;
      if (id) dwell = setTimeout(() => dispatchEvent(new CustomEvent('af:visit', { detail: id })), 1000);
    }
  }

  // ---------- Boucle ----------
  function tick(now) {
    const dt = Math.min(64, now - (last || now));
    last = now;
    if (!dragging && (vel.x || vel.y)) {
      goal.x += vel.x * dt; goal.y += vel.y * dt;
      const f = Math.exp(-dt / 236);
      vel.x *= f; vel.y *= f;
      if (Math.hypot(vel.x, vel.y) * goal.k < .02) vel.x = vel.y = 0;
      clampXY(goal);
    }
    const a = reduce.matches ? 1 : 1 - Math.exp(-dt / 146);
    cam.x += (goal.x - cam.x) * a;
    cam.y += (goal.y - cam.y) * a;
    cam.k = Math.exp(Math.log(cam.k) + Math.log(goal.k / cam.k) * a);
    const moving = dragging || vel.x || vel.y
      || Math.abs(goal.x - cam.x) * cam.k > .5 || Math.abs(goal.y - cam.y) * cam.k > .5 || Math.abs(Math.log(goal.k / cam.k)) > .001;
    if (!moving) Object.assign(cam, goal);
    render();
    update();
    if (moving) raf = requestAnimationFrame(tick); else { raf = 0; last = 0; }
  }
  const wake = () => { if (!raf) raf = requestAnimationFrame(tick); };

  // ---------- Mouvements ----------
  // withFocus : le focus clavier suit la caméra (ancres, touches), sinon Tab ramènerait l'ancienne pièce.
  let aim = null; // la pièce visée par le dernier déplacement
  function focusRoom(r, instant, withFocus) {
    if (!r) return;
    aim = r;
    if (withFocus) r.el.focus({ preventScroll: true });
    vel.x = vel.y = 0;
    Object.assign(goal, { x: r.cx, y: r.cy, k: fitK(r) });
    if (instant) { Object.assign(cam, goal); render(); update(); }
    wake();
  }
  function overview() {
    vel.x = vel.y = 0;
    Object.assign(goal, { x: W / 2, y: U / 2, k: overviewK() });
    wake();
  }
  function step(d) {
    const base = root.classList.contains('is-overview') ? (d > 0 ? -1 : rooms.length) : (current ? current.i : 0);
    focusRoom(rooms[(base + d + rooms.length) % rooms.length]);
  }
  function zoomAt(px, py, f) {
    const k = clampK(goal.k * f);
    const wx = goal.x + (px - vw / 2) / goal.k, wy = goal.y + (py - vh / 2) / goal.k;
    goal.x = wx - (px - vw / 2) / k;
    goal.y = wy - (py - vh / 2) / k;
    goal.k = k;
    clampXY(goal);
    wake();
  }
  function enter(r, href) {
    if (reduce.matches) { location.href = href; return; }
    focusRoom(r);
    goal.k = fitK(r) * PHI * PHI;
    root.classList.add('is-entering');
    setTimeout(() => { location.href = href; }, 618);
  }
  const moved = () => root.classList.add('is-moved');

  // Molette : un palier de φ par cran ; pincement du pavé tactile (ctrlKey) : continu.
  let acc = 0, accT = 0, stepT = 0;
  map.addEventListener('wheel', e => {
    e.preventDefault();
    moved();
    const d = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 800 : 1);
    if (e.ctrlKey) { zoomAt(e.clientX, e.clientY, Math.exp(-d * .01)); return; }
    if (e.timeStamp - accT > 300) acc = 0;
    accT = e.timeStamp;
    acc += d;
    if (Math.abs(acc) >= 50 && e.timeStamp - stepT > 236) {
      zoomAt(e.clientX, e.clientY, acc < 0 ? PHI : 1 / PHI);
      acc = 0;
      stepT = e.timeStamp;
    }
  }, { passive: false });

  // Glisser (souris, doigt) et pincer (deux doigts).
  // Un geste devient un glisser au-delà d'un déplacement net de 6 px (souris) ou 12 px (doigt) ;
  // « dragged » annule le clic qui suit, puis retombe juste après le relâcher.
  const pts = new Map();
  let start = null, dragged = false, pinch = 0, lastT = 0;
  map.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    vel.x = vel.y = 0;
    if (pts.size === 1) { start = { x: e.clientX, y: e.clientY, slop: e.pointerType === 'mouse' ? 6 : 12 }; dragged = false; }
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); }
    lastT = e.timeStamp;
  });
  map.addEventListener('pointermove', e => {
    const p = pts.get(e.pointerId);
    if (!p || pts.size > 2) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, d / pinch);
      pinch = d;
      dragged = true;
      return;
    }
    if (!dragging && start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > start.slop) {
      dragging = dragged = true;
      map.classList.add('is-dragging');
      map.setPointerCapture(e.pointerId);
      moved();
    }
    if (!dragging) return;
    goal.x -= dx / goal.k; goal.y -= dy / goal.k;
    clampXY(goal);
    Object.assign(cam, goal);
    const dt = Math.max(8, e.timeStamp - lastT);
    vel.x = vel.x * .382 + (-dx / goal.k / dt) * .618;
    vel.y = vel.y * .382 + (-dy / goal.k / dt) * .618;
    lastT = e.timeStamp;
    wake();
  });
  const release = e => {
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = 0;
    if (!pts.size) setTimeout(() => { dragged = false; }, 0);
    if (pts.size || !dragging) return;
    dragging = false;
    map.classList.remove('is-dragging');
    if (reduce.matches || e.timeStamp - lastT > 80) vel.x = vel.y = 0;
    wake();
  };
  map.addEventListener('pointerup', release);
  map.addEventListener('pointercancel', release);
  // Un glisser n'ouvre jamais de lien ; un clic clavier ou lecteur d'écran (detail 0) passe toujours.
  map.addEventListener('click', e => { if (dragged && e.detail !== 0) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);
  // Ni glisser-déposer natif des liens et images.
  map.addEventListener('dragstart', e => e.preventDefault());

  // Clics : ancres #zN → voler ; lien vers un projet → plonger puis naviguer ; ailleurs dans une pièce → la cadrer.
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    const r = rooms.find(r => r.el.contains(e.target));
    if (a) {
      const id = (a.getAttribute('href').match(/^#(z[1-8])$/) || [])[1];
      if (id) { e.preventDefault(); moved(); focusRoom(byId(id), false, true); return; }
      if (r && !a.target && a.origin === location.origin) { e.preventDefault(); enter(r, a.href); }
      return;
    }
    if (r && (r !== current || !fitted())) { moved(); focusRoom(r); }
  });

  // Clavier
  addEventListener('keydown', e => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.target.closest('input, textarea, select')) return;
    const k = e.key;
    let used = true;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown') step(1);
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp') step(-1);
    else if (k === 'Home') focusRoom(rooms[0]);
    else if (k === 'End') focusRoom(rooms[rooms.length - 1]);
    else if (k === '0' || k === 'Escape') overview();
    else if (/^[1-8]$/.test(k)) focusRoom(rooms[+k - 1]);
    else if (k === '+' || k === '=') zoomAt(vw / 2, vh / 2, PHI);
    else if (k === '-') zoomAt(vw / 2, vh / 2, 1 / PHI);
    else used = false;
    if (used) {
      e.preventDefault();
      moved();
      if (world.contains(document.activeElement) && aim && !root.classList.contains('is-overview')) aim.el.focus({ preventScroll: true });
    }
  });

  // Tab : la caméra suit le focus ; la page elle-même ne défile jamais.
  world.addEventListener('focusin', e => {
    if (pts.size) return; // focus donné par la souris ou le doigt : c'est un glisser ou un clic, pas une navigation
    const r = rooms.find(r => r.el.contains(e.target));
    if (r && r !== current) focusRoom(r);
    scrollTo(0, 0);
    map.scrollLeft = map.scrollTop = 0;
  });
  addEventListener('scroll', () => { if (scrollX || scrollY) scrollTo(0, 0); });

  // Boutons du bas
  document.getElementById('mapPrev')?.addEventListener('click', () => { moved(); step(-1); });
  document.getElementById('mapNext')?.addEventListener('click', () => { moved(); step(1); });
  planBtn?.addEventListener('click', () => { moved(); if (root.classList.contains('is-overview')) focusRoom(current || rooms[0]); else overview(); });

  addEventListener('resize', () => {
    const over = root.classList.contains('is-overview');
    vw = innerWidth; vh = innerHeight;
    if (over) { overview(); Object.assign(cam, goal); render(); update(); } else focusRoom(current || rooms[0], true);
  });
  // Retour par « Précédent » (bfcache) : la page revient telle qu'on l'a quittée, en pleine plongée.
  addEventListener('pageshow', e => { if (e.persisted) { root.classList.remove('is-entering'); focusRoom(current || rooms[0], true); } });

  // Départ : la pièce de l'ancre (#z3 au retour de ColorQR), sinon l'accueil.
  // Départ : la pièce de l'ancre (#z3 au retour de ColorQR) ; après « Précédent » sans bfcache ou un
  // rechargement, la dernière pièce vue ; sinon l'accueil.
  const nav = (performance.getEntriesByType('navigation')[0] || {}).type;
  let lastRoom = null;
  try { if (nav === 'back_forward' || nav === 'reload') lastRoom = sessionStorage.getItem('af_map_room'); } catch (_) {}
  const first = byId((location.hash.match(/^#(z[1-8])$/) || [])[1]) || byId(lastRoom) || rooms[0];
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  root.classList.add('is-ready');
  focusRoom(first, true);

  window.AFMap = {
    get cam() { return { ...cam }; },
    get room() { return current && current.id; },
    focus: id => focusRoom(byId(id)),
    overview,
    relabel: () => { if (current) setRoom(current); },
    fitK: id => fitK(byId(id))
  };
})();
