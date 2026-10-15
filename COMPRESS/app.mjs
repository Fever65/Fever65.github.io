// FeverCompress — interface. Le traitement est dans engine.mjs (images, vidéos) et archive.mjs (ZIP).
import { LIMITS, fitsSelection, sanitizePath, uniquePath } from './core.mjs';
import { compressImage, compressVideo, disposeVideo } from './engine.mjs';
import { createArchive } from './archive.mjs';

const $ = id => document.getElementById(id);
const S = { mode: 'images', entries: [], results: [], busy: false, reading: false, controller: null, urls: [], zip: null, cancelled: false };

const DICT = {
  fr: {
    title: 'FeverCompress — Images, vidéos et dossiers plus légers',
    description: 'Allège tes images, compresse de courtes vidéos et crée des ZIP. Gratuit, sans compte, directement sur ton appareil.',
    eyebrow: 'Moins de poids. Plus de place.', lead: 'Tes fichiers, en plus léger.',
    privacy: 'Sur ton appareil. Aucun fichier envoyé.', fmtVideo: 'Vidéo → MP4', fmtFolder: 'Dossier → ZIP',
    stepType: 'Choisis le type', stepFiles: 'Ajoute tes fichiers', stepRun: 'Règle et lance', typeLabel: 'Type de fichiers',
    images: 'Images', videos: 'Vidéos', folders: 'Dossiers / ZIP', videosSub: 'Clips courts → MP4', foldersSub: 'Tout dans une archive',
    deviceWarning: 'La vitesse dépend de la puissance de ton appareil et de la mémoire disponible. Un gros fichier peut prendre longtemps, ralentir ton appareil ou faire échouer le traitement. La limite de 2 Gio ne garantit pas la réussite. Garde cet onglet ouvert.',
    chooseFiles: 'Choisir des fichiers', chooseFolder: 'Choisir un dossier', selection: 'Ta sélection', clear: 'Tout retirer',
    empty: 'Les fichiers apparaîtront ici.', listLabel: 'Fichiers sélectionnés',
    quality: 'Le bon équilibre', high: 'Qualité élevée', highDesc: 'Une réduction légère', balanced: 'Équilibré', balancedDesc: 'Le meilleur compromis',
    small: 'Poids minimum', smallDesc: 'Qualité et dimensions réduites',
    optimize: 'Alléger aussi les images et vidéos',
    folderNote: 'Désactivé : ZIP sans modifier les fichiers. Activé : réservé aux dossiers de médias ; les formats et la qualité peuvent changer.',
    qualityNote: 'La compression peut réduire la qualité. Tes originaux restent intacts.',
    run: 'Alléger mes fichiers', zipRun: 'Créer mon ZIP', cancel: 'Annuler le traitement',
    resultEyebrow: 'Le résultat', downloadZip: 'Télécharger le ZIP ↓',
    before: 'Avant', after: 'Après', beforeAlt: 'Image originale', afterAlt: 'Image après traitement',
    know: 'À savoir avant de commencer',
    knowImages: 'Images : JPG et PNG convertis en WebP. Les animations et formats non pris en charge sont conservés. Une image déjà légère peut ne pas diminuer.',
    knowVideos: 'Vidéos : sortie MP4, son conservé. Privilégie les clips courts. Le premier traitement télécharge un moteur d’environ 32 Mo ; les fichiers restent sur ton appareil. Le traitement peut être lent sur mobile.',
    knowZip: 'ZIP : moins de 2 Gio et 1 000 fichiers par sélection. Les photos, vidéos et archives déjà compressées diminuent peu en ZIP. Le sélecteur de dossiers peut omettre les dossiers vides.',
    licenses: 'Logiciels libres & licences',
    dropImages: 'Dépose tes images ici', dropVideos: 'Dépose tes vidéos ici', dropFolders: 'Dépose tes fichiers ou un dossier',
    hintImages: 'JPG, PNG · GIF et WebP conservés sans modification', hintVideos: 'MP4, MOV, WebM, MKV · clips courts recommandés', hintFolders: 'Tous les formats · sous-dossiers conservés dans le ZIP',
    limitImages: 'Moins de 2 Gio par fichier et sélection · images : 40 Mpx max.', limitVideos: 'Moins de 2 Gio par vidéo et sélection', limitFolders: 'Moins de 2 Gio et 1 000 fichiers maximum par sélection',
    file: 'fichier', files: 'fichiers', remove: 'Retirer', download: 'Télécharger', folder: 'Dossier',
    ready: 'Prêt à télécharger', partial: 'Traitement annulé',
    input: 'Poids initial', output: 'Poids obtenu', gain: 'Espace gagné', noGain: 'Aucun gain', larger: 'ZIP plus volumineux',
    done: 'Terminé.', cancelled: 'Traitement annulé. Les fichiers déjà prêts restent téléchargeables.',
    reading: 'Lecture de la sélection…', processing: 'Traitement', creatingZip: 'Création du ZIP…', videoLoading: 'Chargement du moteur vidéo puis compression…',
    tooMany: 'Sélection trop grande : moins de 2 Gio et 1 000 fichiers maximum.', tooLarge: 'Fichier trop lourd pour ce mode.', wrongType: 'Ce format ne correspond pas à cet onglet.',
    loadError: 'Impossible de lire ce dossier. Essaie le bouton de sélection.', error: 'Le traitement a échoué. Tes originaux restent intacts.',
    pending: 'En attente', zipFailed: 'Le ZIP n’a pas pu être créé. Les téléchargements individuels restent disponibles.',
    resultNote: 'Le gain affiché correspond au fichier téléchargeable. Les fichiers déjà légers sont conservés.',
    folderResult: 'Le ZIP contient tous les fichiers sélectionnés. Les fichiers qui n’ont pas pu être allégés sont conservés.',
    partialNote: 'Seuls les fichiers terminés avant l’annulation sont affichés.',
    lossy: 'Avec optimisation, la qualité et les formats des médias peuvent changer.', readOnlyZip: 'Compression ZIP sans modifier le contenu des fichiers.',
    rejected: 'fichier(s) ignoré(s)', warnCount: 'fichier(s) conservé(s) après un problème de traitement.',
    protocol: 'Pour utiliser cet outil, ouvre-le depuis GitHub Pages ou un serveur local (python -m http.server).',
    units: ['o', 'ko', 'Mo', 'Go']
  },
  en: {
    title: 'FeverCompress — Lighter images, videos and folders',
    description: 'Compress images and short videos, or create ZIP archives. Free, no account, right on your device.',
    eyebrow: 'Less weight. More space.', lead: 'Your files, a little lighter.',
    privacy: 'On your device. No files uploaded.', fmtVideo: 'Video → MP4', fmtFolder: 'Folder → ZIP',
    stepType: 'Pick a type', stepFiles: 'Add your files', stepRun: 'Tune and run', typeLabel: 'File type',
    images: 'Images', videos: 'Videos', folders: 'Folders / ZIP', videosSub: 'Short clips → MP4', foldersSub: 'All in one archive',
    deviceWarning: 'Speed depends on your device’s processing power and available memory. Large files may take a long time, slow your device down or fail to process. The 2 GiB limit does not guarantee success. Keep this tab open.',
    chooseFiles: 'Choose files', chooseFolder: 'Choose a folder', selection: 'Your selection', clear: 'Remove all',
    empty: 'Your files will appear here.', listLabel: 'Selected files',
    quality: 'Find your balance', high: 'High quality', highDesc: 'A gentle reduction', balanced: 'Balanced', balancedDesc: 'The best compromise',
    small: 'Smallest size', smallDesc: 'Reduced quality and dimensions',
    optimize: 'Also optimize images and videos',
    folderNote: 'Off: ZIP without changing files. On: for media folders only; formats and quality may change.',
    qualityNote: 'Compression may reduce quality. Your originals stay untouched.',
    run: 'Compress my files', zipRun: 'Create my ZIP', cancel: 'Cancel processing',
    resultEyebrow: 'The result', downloadZip: 'Download ZIP ↓',
    before: 'Before', after: 'After', beforeAlt: 'Original image', afterAlt: 'Processed image',
    know: 'Before you start',
    knowImages: 'Images: JPG and PNG converted to WebP. Animations and unsupported formats stay unchanged. An already small image may not shrink.',
    knowVideos: 'Videos: MP4 output, audio retained. Short clips work best. The first run downloads an engine of about 32 MB; files stay on your device. Processing can be slow on mobile.',
    knowZip: 'ZIP: under 2 GiB and up to 1,000 files per selection. Already compressed photos, videos and archives barely shrink in a ZIP. Folder pickers may omit empty folders.',
    licenses: 'Open source & licenses',
    dropImages: 'Drop your images here', dropVideos: 'Drop your videos here', dropFolders: 'Drop files or a folder here',
    hintImages: 'JPG, PNG · GIF and WebP kept unchanged', hintVideos: 'MP4, MOV, WebM, MKV · short clips recommended', hintFolders: 'Any format · subfolders preserved in the ZIP',
    limitImages: 'Under 2 GiB per file and selection · images: up to 40 MP', limitVideos: 'Under 2 GiB per video and selection', limitFolders: 'Under 2 GiB and up to 1,000 files per selection',
    file: 'file', files: 'files', remove: 'Remove', download: 'Download', folder: 'Folder',
    ready: 'Ready to download', partial: 'Processing cancelled',
    input: 'Original size', output: 'Result size', gain: 'Space saved', noGain: 'No reduction', larger: 'ZIP is larger',
    done: 'Done.', cancelled: 'Processing cancelled. Completed files remain available to download.',
    reading: 'Reading your selection…', processing: 'Processing', creatingZip: 'Creating ZIP…', videoLoading: 'Loading the video engine, then compressing…',
    tooMany: 'Selection too large: under 2 GiB and up to 1,000 files.', tooLarge: 'File too large for this mode.', wrongType: 'This format does not match this tab.',
    loadError: 'Unable to read this folder. Try the folder picker.', error: 'Processing failed. Your originals stay untouched.',
    pending: 'Waiting', zipFailed: 'ZIP creation failed. Individual downloads are still available.',
    resultNote: 'Savings reflect the downloadable file. Already small files stay unchanged.',
    folderResult: 'The ZIP contains all selected files. Files that could not be optimized are kept unchanged.',
    partialNote: 'Only files completed before cancellation are shown.',
    lossy: 'Media optimization can change formats and quality.', readOnlyZip: 'ZIP compression without changing file contents.',
    rejected: 'file(s) skipped', warnCount: 'file(s) kept after a processing problem.',
    protocol: 'Open this tool on GitHub Pages or from a local server (python -m http.server).',
    units: ['B', 'KB', 'MB', 'GB']
  }
};

// Raison renvoyée par le moteur → libellé [fr, en].
const REASONS = {
  compressed: ['Allégé', 'Compressed'],
  'no-gain': ['Déjà léger · original conservé', 'Already small · original kept'],
  'unsupported-format': ['Format non pris en charge · original conservé', 'Unsupported format · original kept'],
  'animated-preserved': ['Animation conservée sans modification', 'Animation kept unchanged'],
  'format-preserved': ['Format conservé sans modification', 'Format kept unchanged'],
  'invalid-image': ['Image non reconnue · original conservé', 'Unrecognized image · original kept'],
  'image-too-large': ['Image trop lourde · original conservé', 'Image too large · original kept'],
  'image-too-many-pixels': ['Image trop grande · original conservé', 'Image dimensions too large · original kept'],
  'decode-failed': ['Lecture impossible · original conservé', 'Unable to decode · original kept'],
  'encode-failed': ['Compression impossible · original conservé', 'Unable to encode · original kept'],
  'video-too-large': ['Vidéo trop lourde · original conservé', 'Video too large · original kept'],
  'video-load-failed': ['Moteur vidéo indisponible · vérifie ta connexion', 'Video engine unavailable · check your connection'],
  'video-failed': ['Vidéo non traitée · original conservé', 'Video processing failed · original kept'],
  kept: ['Original conservé', 'Original kept']
};

let T = DICT.fr;
const t = key => T[key] ?? key;
const isEN = () => document.documentElement.lang === 'en';

const bytes = n => {
  const [b, k, m, g] = T.units;
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' ' + g;
  if (n >= 1e6) return (n / 1e6).toFixed(2) + ' ' + m;
  if (n >= 1e3) return (n / 1e3).toFixed(1) + ' ' + k;
  return n + ' ' + b;
};
const isImage = f => /^image\//.test(f.type) || /\.(jpe?g|png|gif|webp|avif|heic|bmp|svg)$/i.test(f.name);
const isVideo = f => /^video\//.test(f.type) || /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(f.name);
const errorReason = r => /failed|too-large|too-many|invalid/.test(r || '');
const abort = () => { if (S.controller?.signal.aborted) throw new DOMException('Cancelled', 'AbortError'); };

function status(message, error = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', error);
}
function url(blob) {
  const u = URL.createObjectURL(blob);
  S.urls.push(u);
  return u;
}
function resetResults() {
  for (const u of S.urls) URL.revokeObjectURL(u);
  Object.assign(S, { urls: [], results: [], zip: null, cancelled: false });
  $('results').hidden = true;
  $('downloadZip').hidden = true;
  $('preview').hidden = true;
  $('beforeImg').removeAttribute('src');
  $('afterImg').removeAttribute('src');
}

// ---------- Rendu ----------
function renderOptions() {
  const suffix = { images: 'Images', videos: 'Videos', folders: 'Folders' }[S.mode];
  const folders = S.mode === 'folders';
  $('dropTitle').textContent = t('drop' + suffix);
  $('dropHint').textContent = t('hint' + suffix);
  $('limitHint').textContent = t('limit' + suffix);
  $('chooseFolder').hidden = !folders;
  $('folderOptions').hidden = !folders;
  $('qualityField').hidden = folders && !$('optimize').checked;
  $('qualityNote').textContent = folders ? t($('optimize').checked ? 'lossy' : 'readOnlyZip') : t('qualityNote');
  $('run').querySelector('span').textContent = t(folders ? 'zipRun' : 'run');
  $('filesInput').accept = S.mode === 'images' ? 'image/*' : S.mode === 'videos' ? 'video/*,.mkv,.avi,.m4v' : '';
}

function setBusy(value) {
  S.busy = value;
  for (const el of document.querySelectorAll('.mode, #chooseFiles, #chooseFolder, #clear, .file-action, fieldset input, #optimize, [data-set-lang]')) el.disabled = value;
  $('run').disabled = value || S.reading || !S.entries.length;
  $('cancel').hidden = !value;
  $('progressArea').hidden = !value;
}

function renderQueue() {
  const count = S.entries.filter(e => !e.directory).length;
  $('queueCount').textContent = count + ' ' + t(count === 1 ? 'file' : 'files');
  $('clear').hidden = !S.entries.length;
  $('empty').hidden = !!S.entries.length;

  const list = $('fileList');
  list.replaceChildren();
  S.entries.forEach((e, i) => {
    const r = S.results[i];
    const li = document.createElement('li');
    li.className = 'file-item';

    const icon = document.createElement('span');
    icon.className = 'file-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = e.directory ? '▱' : isImage(e.file) ? '▧' : isVideo(e.file) ? '▷' : '≡';

    const info = document.createElement('div');
    const name = document.createElement('div');
    const meta = document.createElement('div');
    name.className = 'file-name';
    name.textContent = e.path;
    meta.className = 'file-meta';
    if (e.directory) meta.textContent = t('folder');
    else if (r) {
      const reason = (REASONS[r.reason] || REASONS.kept)[isEN() ? 1 : 0];
      meta.textContent = bytes(e.file.size) + ' → ' + bytes(r.blob.size) + ' · ' + reason;
      // La presse : la carte se tasse à son nouveau poids (compress.css lit --squash).
      if (r.changed && e.file.size) { li.classList.add('is-pressed'); li.style.setProperty('--squash', Math.min(1, r.blob.size / e.file.size).toFixed(3)); }
      if (r.changed) meta.classList.add('good');
      else if (errorReason(r.reason)) meta.classList.add('warn');
    } else meta.textContent = bytes(e.file.size) + ' · ' + t('pending');
    info.append(name, meta);
    li.append(icon, info);

    if (r && !e.directory) {
      const a = document.createElement('a');
      a.className = 'file-action';
      a.href = r.url;
      a.download = r.path.split('/').pop();
      a.textContent = '↓';
      a.title = t('download') + ' ' + a.download;
      a.setAttribute('aria-label', a.title);
      li.append(a);
    } else {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'file-action';
      remove.textContent = '×';
      remove.disabled = S.busy || S.reading;
      remove.setAttribute('aria-label', t('remove') + ' ' + e.path);
      remove.addEventListener('click', () => { resetResults(); S.entries.splice(i, 1); status(''); renderQueue(); });
      li.append(remove);
    }
    list.append(li);
  });
  $('run').disabled = S.busy || S.reading || !S.entries.length;
}

function renderSummary() {
  $('results').hidden = false;
  $('resultTitle').textContent = t(S.cancelled ? 'partial' : 'ready');
  const completed = S.results.filter(Boolean);
  const initial = completed.reduce((n, r) => n + (r.entry.file?.size || 0), 0);
  const output = S.zip ? S.zip.size : completed.reduce((n, r) => n + (r.blob?.size || 0), 0);
  const saved = initial - output;
  const rate = initial ? Math.max(0, saved / initial * 100) : 0;
  const gain = saved > 0 ? '−' + rate.toFixed(1) + ' %' : saved < 0 ? t('larger') : t('noGain');

  const stats = $('stats');
  stats.replaceChildren();
  for (const [label, value] of [[t('input'), bytes(initial)], [t('output'), bytes(output)], [t('gain'), gain]]) {
    const item = document.createElement('div');
    const small = document.createElement('small');
    const strong = document.createElement('strong');
    item.className = 'stat';
    small.textContent = label;
    strong.textContent = value;
    item.append(small, strong);
    stats.append(item);
  }
  const warnings = completed.filter(r => errorReason(r.reason)).length;
  $('resultNote').textContent = t(S.cancelled ? 'partialNote' : S.mode === 'folders' ? 'folderResult' : 'resultNote') + (warnings ? ' ' + warnings + ' ' + t('warnCount') : '');
  if (S.zip) {
    $('downloadZip').hidden = false;
    $('downloadZip').href = S.zip.url;
    $('downloadZip').download = S.zip.name;
  }
}

// ---------- Sélection ----------
async function addEntries(incoming) {
  if (S.busy) return;
  const used = new Set(S.entries.map(e => e.path));
  let total = S.entries.reduce((n, e) => n + (e.file?.size || 0), 0);
  let rejected = 0;
  let limit = false;
  const accepted = [];
  for (const e of incoming) {
    if (!fitsSelection(S.entries.length + accepted.length + 1, total + (e.file?.size || 0))) { limit = true; break; }
    if (!e.directory && S.mode !== 'folders') {
      const valid = S.mode === 'images' ? isImage(e.file) : isVideo(e.file);
      const max = S.mode === 'images' ? LIMITS.imageBytes : LIMITS.videoBytes;
      if (!valid || e.file.size > max) { rejected++; continue; }
    }
    const path = uniquePath(sanitizePath(e.path), used) + (e.directory ? '/' : '');
    accepted.push({ ...e, path });
    total += e.file?.size || 0;
  }
  if (accepted.length) { resetResults(); S.entries.push(...accepted); }
  status(limit ? t('tooMany') : rejected ? `${rejected} ${t('rejected')} · ${t('tooLarge')} / ${t('wrongType')}` : '', limit || !!rejected);
  renderQueue();
}

// Glisser-déposer : parcours récursif des dossiers (mode Dossiers uniquement).
async function readDrop(dataTransfer) {
  const roots = [...dataTransfer.items].map(item => item.webkitGetAsEntry?.()).filter(Boolean);
  if (!roots.length) return [...dataTransfer.files].map(file => ({ file, path: file.name }));
  const output = [];
  let total = 0;
  async function walk(entry, prefix = '') {
    if (!fitsSelection(output.length + 1, total)) throw new Error('selection-limit');
    const path = prefix + entry.name;
    if (entry.isFile) {
      const file = await new Promise((res, rej) => entry.file(res, rej));
      total += file.size;
      if (!fitsSelection(output.length + 1, total)) throw new Error('selection-limit');
      output.push({ file, path });
    } else if (entry.isDirectory) {
      if (S.mode !== 'folders') throw new Error('folder-mode');
      const reader = entry.createReader();
      let found = false;
      for (;;) {
        const batch = await new Promise((res, rej) => reader.readEntries(res, rej));
        if (!batch.length) break;
        found = true;
        for (const child of batch) await walk(child, path + '/');
      }
      if (!found) output.push({ path: path + '/', directory: true });
    }
  }
  for (const entry of roots) await walk(entry);
  return output;
}

// ---------- Traitement : 80 % fichiers, 20 % ZIP ----------
async function start() {
  if (S.busy || S.reading || !S.entries.length) return;
  resetResults();
  S.controller = new AbortController();
  setBusy(true);
  status('');
  $('progress').value = 0;
  const quality = document.querySelector('input[name="quality"]:checked').value;
  const reserved = new Set(S.entries.map(e => e.path));
  const n = S.entries.length;
  let finished = false;
  try {
    for (let i = 0; i < n; i++) {
      abort();
      const e = S.entries[i];
      let result;
      $('progressText').textContent = `${t('processing')} ${i + 1} / ${n} · ${e.path}`;
      if (e.directory) result = { directory: true, path: e.path, entry: e };
      else {
        const optimize = S.mode !== 'folders' || $('optimize').checked;
        if (optimize && isImage(e.file)) result = await compressImage(e.file, { quality, signal: S.controller.signal });
        else if (optimize && isVideo(e.file)) {
          $('progressText').textContent = t('videoLoading') + ' · ' + e.path;
          result = await compressVideo(e.file, { quality, signal: S.controller.signal, onProgress: p => { $('progress').value = (i + p) * 0.8 / n; } });
        } else result = { blob: e.file, name: e.file.name, changed: false, reason: 'kept' };
        abort();
        const directory = e.path.includes('/') ? e.path.slice(0, e.path.lastIndexOf('/') + 1) : '';
        const candidate = result.changed ? directory + result.name.split('/').pop() : e.path;
        result.path = candidate === e.path ? e.path : uniquePath(candidate, reserved);
        result.entry = e;
        result.url = url(result.blob);
      }
      S.results[i] = result;
      $('progress').value = (i + 1) * 0.8 / n;
      renderQueue();
      await new Promise(r => setTimeout(r, 0));
    }
    abort();
    if (S.mode === 'folders' || S.results.length > 1) {
      $('progressText').textContent = t('creatingZip');
      try {
        const blob = await createArchive(S.results.map(r => ({ path: r.path, file: r.blob, directory: r.directory })), { signal: S.controller.signal, onProgress: p => { $('progress').value = 0.8 + p * 0.2; } });
        const folder = S.entries[0]?.path.split('/')[0];
        const name = S.mode === 'folders' && S.entries.every(e => e.path.startsWith(folder + '/')) ? folder + '-FeverCompress.zip' : 'FeverCompress.zip';
        S.zip = { size: blob.size, url: url(blob), name };
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        status(t('zipFailed'), true);
      }
    }
    finished = true;
    $('progress').value = 1;
    if (!$('status').textContent) status(t('done'));
  } catch (error) {
    if (error.name === 'AbortError') { S.cancelled = true; status(t('cancelled')); }
    else status(t('error'), true);
  } finally {
    setBusy(false);
    renderQueue();
    if (S.results.length) {
      renderSummary();
      const r = S.results.find(r => r?.changed && r.blob?.type.startsWith('image/'));
      if (r) { $('beforeImg').src = url(r.entry.file); $('afterImg').src = r.url; $('preview').hidden = false; }
    }
    S.controller = null;
    if (finished) $('results').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  }
}

// ---------- Événements ----------
$('chooseFiles').addEventListener('click', () => $('filesInput').click());
$('chooseFolder').addEventListener('click', () => $('folderInput').click());
$('filesInput').addEventListener('change', async e => { await addEntries([...e.target.files].map(file => ({ file, path: file.name }))); e.target.value = ''; });
$('folderInput').addEventListener('change', async e => { await addEntries([...e.target.files].map(file => ({ file, path: file.webkitRelativePath || file.name }))); e.target.value = ''; });
$('clear').addEventListener('click', () => { if (S.busy) return; resetResults(); S.entries = []; status(''); renderQueue(); });
$('run').addEventListener('click', start);
$('cancel').addEventListener('click', () => S.controller?.abort());
$('optimize').addEventListener('change', () => { resetResults(); renderOptions(); renderQueue(); });
document.querySelectorAll('[name="quality"]').forEach(radio => radio.addEventListener('change', () => { resetResults(); renderQueue(); status(''); }));
document.querySelectorAll('[data-mode]').forEach(btn => btn.addEventListener('click', () => {
  if (S.busy || S.reading) return;
  resetResults();
  S.entries = [];
  S.mode = btn.dataset.mode;
  disposeVideo();
  status('');
  document.querySelectorAll('[data-mode]').forEach(other => { other.classList.toggle('active', other === btn); other.setAttribute('aria-pressed', String(other === btn)); });
  renderOptions();
  renderQueue();
}));

const drop = $('dropzone');
['dragenter', 'dragover'].forEach(type => drop.addEventListener(type, e => { e.preventDefault(); if (!S.busy && !S.reading) drop.classList.add('dragging'); }));
drop.addEventListener('dragleave', e => { if (!drop.contains(e.relatedTarget)) drop.classList.remove('dragging'); });
drop.addEventListener('drop', async e => {
  e.preventDefault();
  drop.classList.remove('dragging');
  if (S.busy || S.reading) return;
  S.reading = true;
  renderQueue();
  status(t('reading'));
  try { await addEntries(await readDrop(e.dataTransfer)); }
  catch (error) { status(t(error.message === 'selection-limit' ? 'tooMany' : 'loadError'), true); }
  finally { S.reading = false; renderQueue(); }
});
addEventListener('dragover', e => e.preventDefault());
addEventListener('drop', e => e.preventDefault());
addEventListener('pagehide', () => { S.controller?.abort(); disposeVideo(); for (const u of S.urls) URL.revokeObjectURL(u); });

AF.i18n(DICT, {
  onChange: (_, dict) => {
    T = dict;
    renderOptions();
    renderQueue();
    if (S.results.length || S.zip) renderSummary();
  }
});
if (location.protocol === 'file:') status(t('protocol'), true);
