/* Accueil — zoom infini.
   Le défilement natif pilote la profondeur z (1 écran = 1 niveau). Chaque couche i est mise à l'échelle K^(z − i) :
   à z = i elle est nette, à z = i − 1 elle n'est qu'un point au centre de la couche précédente.
   La dernière couche est une copie de la première : arrivé au fond, on retombe sur le point de départ. */
(() => {
  'use strict';

  const root = document.documentElement;
  if (!root.classList.contains('js-zoom')) return;

  const K = 9;                    // facteur d'échelle entre deux niveaux
  const stage = document.getElementById('stage');
  const layers = [...stage.querySelectorAll('.layer')];
  const LOOP = layers.length - 1; // 8 : la couche 8 est le clone de la couche 0
  const track = document.querySelector('.track');
  const readout = document.getElementById('zRead');
  const hint = document.getElementById('hint');
  const ticks = [...document.querySelectorAll('#rail [data-jump]')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  let unit = innerHeight;
  let z = 0;
  let frame = 0;
  let leaving = false;
  let lastTick = -1;

  const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

  function measure() {
    unit = track.firstElementChild.getBoundingClientRect().height || innerHeight;
  }

  function render() {
    frame = 0;
    if (leaving) return;
    z = scrollY / unit;

    // Boucle : z8 est identique à z0.
    if (z >= LOOP) {
      z -= LOOP;
      scrollTo(0, z * unit);
    }

    for (let i = 0; i < layers.length; i++) {
      const el = layers[i];
      const d = Math.max(-1.25, Math.min(1.25, z - i));
      const opacity = smooth(-0.95, -0.35, d) * (1 - smooth(0.3, 0.9, d));
      el.style.opacity = opacity.toFixed(3);
      el.style.transform = 'scale(' + Math.pow(K, d).toFixed(5) + ')';
      el.style.setProperty('--dot', (1 - smooth(0.1, 0.55, d)).toFixed(3));
      el.style.zIndex = String(10 + i);
      el.classList.toggle('is-on', Math.abs(z - i) < 0.32);
    }

    readout.textContent = z.toFixed(2);
    hint.style.opacity = String(1 - smooth(0.02, 0.25, z));

    const tick = Math.round(z) % LOOP;
    if (tick !== lastTick) {
      lastTick = tick;
      ticks.forEach((b, i) => b.setAttribute('aria-current', String(i === tick)));
    }
  }

  const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };

  function jump(level, smoothly = true) {
    let target = level;
    // Remonter depuis z0 : on passe par le fond (z8 = z0) pour continuer vers le haut.
    if (target < 0) { scrollTo(0, LOOP * unit - 1); target = LOOP - 1; }
    scrollTo({ top: target * unit, behavior: smoothly && !reduce.matches ? 'smooth' : 'auto' });
  }

  // ---------- Entrées ----------
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => { const keep = z; measure(); scrollTo(0, keep * unit); schedule(); });

  // Molette vers le haut tout en haut : on remonte par le fond, le zoom est aussi infini vers l'extérieur.
  addEventListener('wheel', e => {
    if (e.deltaY < 0 && scrollY <= 1 && !e.ctrlKey) {
      scrollTo(0, LOOP * unit - 1);
      schedule();
    }
  }, { passive: true });

  addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || leaving) return;
    const tag = (e.target && e.target.tagName) || '';
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
    const here = Math.round(z);
    if (/^[0-8]$/.test(e.key)) { e.preventDefault(); jump(Number(e.key)); return; }
    if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.shiftKey)) { e.preventDefault(); jump(here + 1); }
    else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey)) { e.preventDefault(); jump(here - 1); }
    else if (e.key === 'Home') { e.preventDefault(); jump(0); }
    else if (e.key === 'End') { e.preventDefault(); jump(LOOP - 1); }
  });

  document.querySelectorAll('[data-jump]').forEach(b => b.addEventListener('click', e => {
    e.preventDefault();
    jump(Number(b.dataset.jump));
  }));

  // Tabulation : le focus emmène la caméra jusqu'au niveau du lien.
  stage.addEventListener('focusin', e => {
    const layer = e.target.closest('.layer');
    if (!layer) return;
    const level = Number(layer.dataset.z);
    if (Math.abs(z - level) > 0.05) jump(level);
  });

  // ---------- Sortie : le mot cliqué avale l'écran, puis la page s'ouvre ----------
  stage.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.origin !== location.origin || reduce.matches) return;
    const layer = a.closest('.layer');
    if (!layer) return;
    e.preventDefault();
    leaving = true;
    root.classList.add('is-leaving');
    const box = a.getBoundingClientRect();
    const sbox = layer.getBoundingClientRect();
    layer.style.transformOrigin = ((box.left + box.width / 2 - sbox.left) / sbox.width * 100).toFixed(2) + '% ' +
      ((box.top + box.height / 2 - sbox.top) / sbox.height * 100).toFixed(2) + '%';
    layer.style.transition = 'transform .65s var(--ease-zoom), opacity .55s ease .1s';
    requestAnimationFrame(() => {
      layer.style.transform = 'scale(' + (Math.pow(K, Math.max(-1, Math.min(1, z - Number(layer.dataset.z)))) * 60).toFixed(3) + ')';
      layer.style.opacity = '0';
    });
    layers.forEach(l => { if (l !== layer) { l.style.transition = 'opacity .3s'; l.style.opacity = '0'; } });
    setTimeout(() => { location.href = a.href; }, 520);
  });

  // Retour arrière (bfcache) : on remet la scène en état.
  addEventListener('pageshow', e => {
    if (!e.persisted && !leaving) return;
    leaving = false;
    root.classList.remove('is-leaving');
    layers.forEach(l => { l.style.transition = ''; l.style.transformOrigin = ''; });
    render();
  });

  if ('scrollRestoration' in history) history.scrollRestoration = 'auto';
  measure();
  // Depuis une sous-page, le point « dézoomer » ramène au niveau du projet : index.html#z3.
  const fromHash = /^#z([0-7])$/.exec(location.hash);
  if (fromHash) {
    scrollTo(0, Number(fromHash[1]) * unit);
    history.replaceState(null, '', location.pathname + location.search);
  }
  render();
  // Les polices peuvent changer la hauteur des éléments : un second passage après chargement.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
})();
