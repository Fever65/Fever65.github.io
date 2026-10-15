/* À propos — textes FR/EN et révélation du manifeste, une idée par écran. */
AF.i18n({
  fr: {
    title: 'À propos — ArchiveFever.Work',
    description: "À propos d'ArchiveFever.Work : un espace personnel pour tester, créer et partager des outils simples.",
    heading: 'Je teste, je fabrique, je partage.',
    introAria: 'Présentation',
    p1: 'ArchiveFever.Work est mon espace personnel pour transformer des idées en <strong>outils web simples</strong>, en pages utiles et en petites expériences accessibles directement depuis un navigateur.',
    p2: 'J’y expérimente, j’apprends et j’améliore progressivement ce que je construis. Chaque projet privilégie une interface claire, un fonctionnement sans compte et une utilité immédiate, tout en gardant une identité personnelle.',
    p3: 'Si une page ici te fait gagner du temps, t’aide pour un truc précis, te donne une idée ou te fait juste sourire, alors le site a déjà une raison d’exister.',
    p4: 'Chaque pièce de la carte a sa propre palette et sa propre typographie. Les proportions, elles, suivent toutes une même règle, discrète.',
    f1: 'Sans compte', f1d: 'Tu ouvres, tu utilises. Rien à créer.',
    f2: 'Dans ton navigateur', f2d: 'Tes fichiers restent sur ton appareil.',
    f3: 'Fait main', f3d: 'Petit, soigné, et un peu de Jérôme.',
    cta: 'Voir les outils', ctaNote: 'Envie d’essayer ?'
  },
  en: {
    title: 'About — ArchiveFever.Work',
    description: 'About ArchiveFever.Work: a personal space to test, create and share simple tools.',
    heading: 'I test things, build things, and share them.',
    introAria: 'Introduction',
    p1: 'ArchiveFever.Work is my personal space for turning ideas into <strong>simple web tools</strong>, useful pages, and small experiences that run directly in a browser.',
    p2: 'It is where I experiment, learn, and gradually improve what I build. Each project favors a clear interface, no-account access, and immediate usefulness while keeping a personal identity.',
    p3: 'If a page here saves you time, helps you with something specific, gives you an idea, or simply makes you smile, then the site already has a reason to exist.',
    p4: 'Every room of the map has its own palette and its own typeface. The proportions all follow one quiet rule.',
    f1: 'No account', f1d: 'Open it, use it. Nothing to sign up for.',
    f2: 'In your browser', f2d: 'Your files stay on your device.',
    f3: 'Handmade', f3d: 'Small, polished, and a bit of Jerome.',
    cta: 'See the tools', ctaNote: 'Want to try?'
  }
});

// Chaque idée se révèle quand elle entre à l'écran. Sans JS ou en mouvement réduit, tout est visible d'emblée.
(() => {
  const ideas = document.querySelectorAll('.idea');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || !('IntersectionObserver' in window)) { ideas.forEach(i => i.classList.add('is-in')); return; }
  document.documentElement.classList.add('js-reveal');
  const io = new IntersectionObserver(items => items.forEach(it => {
    if (!it.isIntersecting) return;
    it.target.classList.add('is-in');
    io.unobserve(it.target);
  }), { threshold: 0.236 });
  ideas.forEach(i => io.observe(i));
})();
