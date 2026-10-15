/* Libellés de l’en-tête et du pied de page communs. Facultatif : chaque page fonctionne sans ce fichier. */
(() => {
  'use strict';

  // Libellés de l'en-tête et du pied communs (data-af="clé"), suivant la langue posée par chaque page sur <html lang>.
  const labels = {
    fr: { tools: 'Outils', research: 'Recherche', about: 'À propos', donate: 'Dons', home: '← Accueil', made: 'Fait main · Sans compte · Sans pub', nav: 'Navigation principale' },
    en: { tools: 'Tools', research: 'Research', about: 'About', donate: 'Donate', home: '← Home', made: 'Handmade · No account · No ads', nav: 'Main navigation' }
  };
  const root = document.documentElement;
<<<<<<< Updated upstream
  function translate() {
    const text = labels[root.lang] || labels.fr;
    document.querySelectorAll('[data-af]').forEach(el => { if (text[el.dataset.af]) el.textContent = text[el.dataset.af]; });
    document.querySelectorAll('[data-af-label]').forEach(el => el.setAttribute('aria-label', text[el.dataset.afLabel] || ''));
  }
=======
  const KEY = 'af_lang';
  const LANGS = ['fr', 'en'];

  // Textes communs à toutes les pages ; les dictionnaires de page peuvent les surcharger.
  const COMMON = {
    fr: {
      back: 'Retour', backAria: "Retour à l'accueil", langLabel: 'Choisir la langue',
      made: 'Fait main · Sans compte · Sans pub', about: 'À propos', donate: 'Dons', footNav: 'Pied de page'
    },
    en: {
      back: 'Back', backAria: 'Back to home', langLabel: 'Choose language',
      made: 'Handmade · No account · No ads', about: 'About', donate: 'Donate', footNav: 'Footer'
    }
  };

  // ---------- Langue ----------
  function storedLang() {
    try {
      let lang = localStorage.getItem(KEY);
      if (!lang) {
        // Migration unique des anciennes clés propres à QR et TIMER.
        lang = localStorage.getItem('qr_lang') || localStorage.getItem('af_timer_lang');
        if (lang) localStorage.setItem(KEY, lang);
      }
      localStorage.removeItem('qr_lang');
      localStorage.removeItem('af_timer_lang');
      return lang;
    } catch (_) { return null; }
  }
  function storeLang(lang) {
    try { localStorage.setItem(KEY, lang); } catch (_) {}
  }

  function wadaNumber(el = root) {
    return getComputedStyle(el).getPropertyValue('--wada').replace(/["'\s]/g, '');
  }

  /* dict = { fr: {...}, en: {...} }. Clés spéciales : title, description.
     Le HTML se traduit par attributs :
       data-i18n="clé"            → textContent
       data-i18n-html="clé"       → innerHTML (chaînes statiques du dictionnaire uniquement)
       data-i18n-attr="aria-label:clé; placeholder:clé2"
     opts.onChange(lang, t) est appelé après chaque application. */
  function i18n(dict, opts = {}) {
    let lang = 'fr';
    let t = {};

    function apply(next) {
      lang = LANGS.includes(next) ? next : 'fr';
      t = Object.assign({}, COMMON[lang], dict[lang]);
      root.lang = lang;
      if (t.title) document.title = t.title;
      if (t.description) {
        document.querySelectorAll('meta[name="description"], meta[property="og:description"]').forEach(m => m.setAttribute('content', t.description));
      }
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const v = t[el.dataset.i18n];
        if (typeof v === 'string') el.textContent = v;
      });
      document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const v = t[el.dataset.i18nHtml];
        if (typeof v === 'string') el.innerHTML = v;
      });
      document.querySelectorAll('[data-i18n-attr]').forEach(el => {
        el.dataset.i18nAttr.split(';').forEach(pair => {
          const [attr, key] = pair.split(':').map(s => s.trim());
          if (attr && typeof t[key] === 'string') el.setAttribute(attr, t[key]);
        });
      });
      document.querySelectorAll('[data-set-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setLang === lang)));
      document.querySelectorAll('.lang').forEach(g => g.setAttribute('aria-label', t.langLabel));
      document.querySelectorAll('.wada').forEach(w => w.setAttribute('aria-hidden', 'true'));
      if (opts.onChange) opts.onChange(lang, t);
    }

    function set(next) {
      apply(next);
      storeLang(lang);
    }

    document.querySelectorAll('[data-set-lang]').forEach(b => b.addEventListener('click', () => set(b.dataset.setLang)));
    addEventListener('storage', e => { if (e.key === KEY && e.newValue && e.newValue !== lang) apply(e.newValue); });
    apply(storedLang() || 'fr');

    return {
      get lang() { return lang; },
      t: key => t[key],
      set
    };
  }

  // ---------- Palette Wada ----------
  // Accepte #rgb, #rrggbb et rgb(r, g, b) (forme calculée d'une couleur déclarée par @property).
  const toRgb = hex => {
    const m = hex.trim().match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
    if (m) return m.slice(1, 4).map(Number);
    const h = hex.trim().replace('#', '');
    const full = h.length === 3 ? h.replace(/./g, c => c + c) : h;
    return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
  };
  const toHex = rgb => '#' + rgb.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  // Mélange sRGB, identique à color-mix(in srgb, a p, b) de tokens.css.
  const mix = (a, b, p) => { const x = toRgb(a), y = toRgb(b); return toHex(x.map((v, i) => v * p + y[i] * (1 - p))); };

  function palette(el = root) {
    const cs = getComputedStyle(el);
    const get = name => cs.getPropertyValue('--' + name).trim();
    const p = { wada: wadaNumber(el), bg: get('bg'), ink: get('ink'), dot: get('dot'), alt: get('alt') };
    p.ink2 = mix(p.ink, p.bg, 0.854);
    p.ink3 = mix(p.ink, p.bg, 0.764);
    p.line = mix(p.ink, p.bg, 0.146);
    p.surface = mix(p.ink, p.bg, 0.038);
    return p;
  }

  // ---------- Toast ----------
  let toastTimer = 0;
  function toast(message, ms = 2618) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.append(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  // ---------- Divers ----------
>>>>>>> Stashed changes
  function ready() {
    translate();
    new MutationObserver(translate).observe(root, { attributes: true, attributeFilter: ['lang'] });
    const year = document.querySelector('[data-af-year]');
    if (year) year.textContent = new Date().getFullYear();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
<<<<<<< Updated upstream
=======

  // Transitions entre pages (@view-transition, site.css) : une transition interrompue par une navigation rapide
  // ou un retour arrière rejette ses promesses ; la page change simplement sans animation, ce n'est pas une erreur.
  const quiet = e => { const vt = e.viewTransition; if (vt) [vt.ready, vt.finished, vt.updateCallbackDone].forEach(p => p && p.catch(() => {})); };
  addEventListener('pageswap', quiet);
  // pagereveal est intercepté par le script en ligne du <head> de chaque page (site.js, en defer, arriverait trop tard).

  window.AF = { i18n, palette, mix, toRgb, toHex, toast, storedLang, storeLang };
>>>>>>> Stashed changes
})();
