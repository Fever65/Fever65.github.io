/* ArchiveFever.Work — script commun (window.AF), chargé en defer avant le script de chaque page.
   AF.i18n(dict, opts) : FR/EN partagé par tout le site (clé af_lang), synchronisé entre onglets.
   AF.toast(msg)       : message bref en bas de l'écran.
   AF.toRgb / AF.toHex : conversions de couleurs (ColorQR). */
(() => {
  'use strict';

  const root = document.documentElement;
  const KEY = 'af_lang';
  const LANGS = ['fr', 'en'];

  // Textes communs ; les dictionnaires de page peuvent les surcharger.
  const COMMON = {
    fr: { back: 'Retour', backAria: "Retour à l'accueil", langLabel: 'Choisir la langue' },
    en: { back: 'Back', backAria: 'Back to home', langLabel: 'Choose language' }
  };

  const load = () => { try { return localStorage.getItem(KEY); } catch (_) { return null; } };
  const save = lang => { try { localStorage.setItem(KEY, lang); } catch (_) {} };

  /* Traduction par attributs :
       data-i18n="clé"                         → textContent
       data-i18n-html="clé"                    → innerHTML (chaînes du dictionnaire uniquement)
       data-i18n-attr="aria-label:clé; alt:clé2"
     Clés spéciales : title, description. opts.onChange(lang, t) suit chaque changement. */
  function i18n(dict, opts = {}) {
    let lang = 'fr';
    let t = {};

    function apply(next) {
      lang = LANGS.includes(next) ? next : 'fr';
      t = Object.assign({}, COMMON[lang], dict[lang]);
      root.lang = lang;
      if (t.title) document.title = t.title;
      if (t.description) document.querySelector('meta[name="description"]')?.setAttribute('content', t.description);
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
      opts.onChange?.(lang, t);
    }

    document.querySelectorAll('[data-set-lang]').forEach(b => b.addEventListener('click', () => { apply(b.dataset.setLang); save(lang); }));
    addEventListener('storage', e => { if (e.key === KEY && e.newValue && e.newValue !== lang) apply(e.newValue); });
    apply(load() || 'fr');

    return { get lang() { return lang; }, t: key => t[key] };
  }

  // Couleurs : accepte #rgb, #rrggbb et rgb(r, g, b).
  function toRgb(color) {
    const m = color.trim().match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
    if (m) return m.slice(1, 4).map(Number);
    const h = color.trim().replace('#', '');
    const full = h.length === 3 ? h.replace(/./g, c => c + c) : h;
    return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
  }
  const toHex = rgb => '#' + rgb.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

  let toastTimer = 0;
  function toast(message, ms = 2600) {
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

  window.AF = { i18n, toast, toRgb, toHex };
})();
