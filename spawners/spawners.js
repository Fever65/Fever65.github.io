/* Beta 1.7.3 Spawners — base de seeds filtrable, carte d'altitude, copie. Données : <script id="seedData"> dans la page. */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const rawData = JSON.parse($('seedData').textContent);
  const records = rawData.filter(e => !e.divider);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const DICT = {
    fr: {
      title: 'Beta 1.7.3 Spawners | ArchiveFever.Work',
      description: 'Un seed de donjon pour chaque hauteur de Y1 à Y120 hors Far Lands dans Minecraft Java Beta 1.7.3.',
      y120Found: 'Y120 trouvé !',
      metricsLabel: 'Résumé des résultats', mLowest: 'Plus bas trouvé', mHighest: 'Plus haut hors Far Lands', mConsecutive: 'Hauteurs consécutives',
      altTitle: '120 hauteurs. 120 donjons.', legendFound: 'Trouvé hors Far Lands', legendVideo: 'Avec vidéo', legendRecord: 'Record Y120',
      mapLabel: 'Carte des hauteurs Y1 → Y120',
      readout: 'Survole ou touche une barre pour voir son seed. Clique pour l’ouvrir dans la base.',
      dbTitle: 'Tous les seeds, de Y1 à Y120.',
      searchLabel: 'Rechercher dans les seeds', searchPlaceholder: 'Rechercher un Y, un seed ou une coordonnée…',
      copy: 'Copier la liste', copied: 'Liste copiée', copyFailed: 'Copie impossible',
      coordsFormat: 'Coordonnées : X, Y, Z',
      caption: 'Seeds de donjons Beta 1.7.3 par hauteur Y', colF3: 'Position F3', colVideo: 'Preuve vidéo',
      emptyState: 'Aucun résultat pour cette recherche.',
      watchY120: 'Voir la découverte Y120 en vidéo',
      credits: 'Recherche et données : Fever · Outils développés avec OpenAI Codex.', playlist: 'Playlist Beta Spawner sur YouTube ↗',
      result: 'résultat', results: 'résultats', video: 'Voir la vidéo', videoMark: 'vidéo ✓', alternative: 'alternative',
      farlandsDivider: 'Far Lands — cas conservé, exclu du record',
      seedCopied: 'Seed copié : ', copyUnavailable: 'Copie impossible sur ce navigateur.'
    },
    en: {
      title: 'Beta 1.7.3 Spawners | ArchiveFever.Work',
      description: 'A dungeon seed for every height from Y1 to Y120 outside the Far Lands in Minecraft Java Beta 1.7.3.',
      y120Found: 'Y120 found!',
      metricsLabel: 'Result summary', mLowest: 'Lowest found', mHighest: 'Highest outside Far Lands', mConsecutive: 'Consecutive heights',
      altTitle: '120 heights. 120 dungeons.', legendFound: 'Found outside Far Lands', legendVideo: 'With video', legendRecord: 'Y120 record',
      mapLabel: 'Height map Y1 → Y120',
      readout: 'Hover or tap a bar to see its seed. Click to open it in the database.',
      dbTitle: 'Every seed, from Y1 to Y120.',
      searchLabel: 'Search the seed database', searchPlaceholder: 'Search a Y level, seed or coordinate…',
      copy: 'Copy list', copied: 'List copied', copyFailed: 'Copy failed',
      coordsFormat: 'Coordinates: X, Y, Z',
      caption: 'Beta 1.7.3 dungeon seeds by Y height', colF3: 'F3 position', colVideo: 'Video proof',
      emptyState: 'No result matches this search.',
      watchY120: 'Watch the Y120 discovery',
      credits: 'Research and data: Fever · Tools developed with OpenAI Codex.', playlist: 'Beta Spawner playlist on YouTube ↗',
      result: 'result', results: 'results', video: 'Watch video', videoMark: 'video ✓', alternative: 'alternative',
      farlandsDivider: 'Far Lands — preserved case, excluded from the record',
      seedCopied: 'Seed copied: ', copyUnavailable: 'Copy is not available in this browser.'
    }
  };
  let T = DICT.fr;

  // ---------- Tableau ----------
  const rows = $('seedRows');
  const search = $('seedSearch');
  const videoFilter = $('videoFilter');
  let videoOnly = false;

  const esc = v => String(v).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]);

  function renderRows() {
    const seen = new Map();
    rows.innerHTML = rawData.map(e => {
      if (e.divider === 'farlands') return `<tr class="farlands-divider" data-divider="farlands"><td colspan="4">${esc(T.farlandsDivider)}</td></tr>`;
      const n = seen.get(e.y) || 0;
      seen.set(e.y, n + 1);
      const badge = n > 0 ? ` <span class="row-badge">${esc(T.alternative)}</span>` : '';
      const video = e.video
        ? `<a class="video-link" href="${esc(e.video)}" target="_blank" rel="noopener noreferrer">${esc(T.video)} ↗</a>`
        : '<span class="muted">—</span>';
      const haystack = `${e.y} ${e.seed} ${e.coords} ${e.video || ''} ${e.farlands ? 'farlands' : ''}`.toLowerCase();
      return `<tr class="${e.farlands ? 'farlands-record' : ''}" data-seed-row data-y="${esc(e.y)}" data-search="${esc(haystack)}" data-has-video="${Boolean(e.video)}" data-farlands="${Boolean(e.farlands)}">` +
        `<th class="y-cell" scope="row">Y${esc(e.y)}${badge}</th><td class="seed-cell">${esc(e.seed)}</td><td class="coords-cell">${esc(e.coords)}</td><td class="video-cell">${video}</td></tr>`;
    }).join('');
    applyFilters();
  }

  function applyFilters() {
    const query = search.value.trim().toLowerCase();
    const yQuery = query.match(/^y\s*(\d+)$/);
    let visible = 0;
    let farlandsVisible = false;
    rows.querySelectorAll('[data-seed-row]').forEach(row => {
      const text = yQuery ? Number(row.dataset.y) === Number(yQuery[1]) : !query || row.dataset.search.includes(query);
      const show = text && (!videoOnly || row.dataset.hasVideo === 'true');
      row.hidden = !show;
      if (show) { visible++; if (row.dataset.farlands === 'true') farlandsVisible = true; }
    });
    const divider = rows.querySelector('[data-divider="farlands"]');
    if (divider) divider.hidden = !farlandsVisible;
    $('resultCount').textContent = `${visible} / ${records.length} ${visible === 1 ? T.result : T.results}`;
    $('emptyState').hidden = visible !== 0;
  }

  search.addEventListener('input', applyFilters);
  videoFilter.addEventListener('click', () => {
    videoOnly = !videoOnly;
    videoFilter.setAttribute('aria-pressed', String(videoOnly));
    applyFilters();
  });

  // Copie de toute la liste (format compact) et d'un seed d'un clic.
  function compactList() {
    const lines = ['Y | SEED | F3 | YT VIDEO'];
    rawData.forEach(e => {
      if (e.divider) lines.push('FARLAND');
      else lines.push([e.y, e.seed, e.coords, e.video || ''].join(' | ').replace(/\s+\|\s*$/, ''));
    });
    return lines.join('\n');
  }
  const copyBtn = $('copyAll');
  let copyTimer = 0;
  copyBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(compactList()); copyBtn.textContent = T.copied; }
    catch (_) { copyBtn.textContent = T.copyFailed; }
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { copyBtn.textContent = T.copy; }, 1618);
  });
  rows.addEventListener('click', async e => {
    const cell = e.target.closest('.seed-cell');
    if (!cell) return;
    const seed = cell.textContent.trim();
    try { await navigator.clipboard.writeText(seed); AF.toast(T.seedCopied + seed); }
    catch (_) { AF.toast(T.copyUnavailable); }
  });

  // ---------- Carte d'altitude ----------
  const map = $('altMap');
  const byY = new Map();
  records.filter(e => !e.farlands).forEach(e => { if (!byY.has(Number(e.y))) byY.set(Number(e.y), e); });
  const describe = e => `Y${e.y} · seed ${e.seed} · ${e.coords}${e.video ? ' · ' + T.videoMark : ''}`;
  const bars = [];
  for (let y = 1; y <= 120; y++) {
    const entry = byY.get(y);
    if (!entry) continue; // les 120 hauteurs sont trouvées ; une hauteur manquante ne serait simplement pas tracée
    const bar = document.createElement('button');
    bar.type = 'button';
    bar.className = 'alt-bar' + (entry.video ? ' has-video' : '') + (y === 120 ? ' is-record' : '');
    bar.style.setProperty('--h', (6.18 + (y / 120) * 93.82).toFixed(2) + '%');
    bar.style.setProperty('--i', y);
    const show = () => { $('altReadout').textContent = describe(entry); };
    bar.addEventListener('mouseenter', show);
    bar.addEventListener('focus', show);
    bar.addEventListener('click', () => {
      search.value = entry.seed;
      applyFilters();
      $('database').scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth' });
    });
    bars.push([bar, entry]);
    map.append(bar);
  }
  const labelBars = () => bars.forEach(([bar, entry]) => bar.setAttribute('aria-label', describe(entry)));


  // Compteurs animés des métriques (Y120, 120) ; Y1 est trop petit pour être animé.
  if (!reduce.matches) document.querySelectorAll('.metric-value').forEach(el => {
    const text = el.textContent.trim();
    const prefix = text.startsWith('Y') ? 'Y' : '';
    const target = Number(text.replace('Y', ''));
    if (!(target >= 10)) return;
    const start = performance.now();
    const step = now => {
      const p = Math.min(1, (now - start) / 1618);
      el.textContent = prefix + Math.round(target * (1 - (1 - p) ** 3));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  AF.i18n(DICT, {
    onChange: (_, dict) => {
      T = dict;
      renderRows();
      labelBars();
      $('altReadout').textContent = T.readout;
    }
  });
})();
