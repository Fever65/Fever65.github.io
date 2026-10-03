/* Libellés de l’en-tête et du pied de page communs. Facultatif : chaque page fonctionne sans ce fichier. */
(() => {
  'use strict';

  // Libellés de l'en-tête et du pied communs (data-af="clé"), suivant la langue posée par chaque page sur <html lang>.
  const labels = {
    fr: { tools: 'Outils', research: 'Recherche', about: 'À propos', donate: 'Dons', home: '← Accueil', made: 'Fait main · Sans compte · Sans pub', nav: 'Navigation principale' },
    en: { tools: 'Tools', research: 'Research', about: 'About', donate: 'Donate', home: '← Home', made: 'Handmade · No account · No ads', nav: 'Main navigation' }
  };
  const root = document.documentElement;
  function translate() {
    const text = labels[root.lang] || labels.fr;
    document.querySelectorAll('[data-af]').forEach(el => { if (text[el.dataset.af]) el.textContent = text[el.dataset.af]; });
    document.querySelectorAll('[data-af-label]').forEach(el => el.setAttribute('aria-label', text[el.dataset.afLabel] || ''));
  }
  function ready() {
    translate();
    new MutationObserver(translate).observe(root, { attributes: true, attributeFilter: ['lang'] });
    const year = document.querySelector('[data-af-year]');
    if (year) year.textContent = new Date().getFullYear();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
