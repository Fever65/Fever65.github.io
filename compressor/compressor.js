/* File Compressor — outils (core), archive ZIP, moteur images/vidéos (engine) et interface (app), en un seul script.
   Script classique (pas de module) : fonctionne aussi quand la page est ouverte en double-clic. */
(() => {
'use strict';

// ---------- Outils : limites, chemins, formats ----------
// Signed 32-bit FFmpeg input boundary; available memory can impose a lower practical limit.
const LIMITS = Object.freeze({ imageBytes: 2_147_483_647, imagePixels: 40_000_000, videoBytes: 2_147_483_647, selectionBytes: 2_147_483_647, selectionFiles: 1000 });
function fitsSelection(count, bytes) {
  return Number.isSafeInteger(count) && count >= 0 && count <= LIMITS.selectionFiles && Number.isSafeInteger(bytes) && bytes >= 0 && bytes <= LIMITS.selectionBytes;
}
const QUALITY = Object.freeze({
  high: { image: 0.88, imageEdge: 4096, videoEdge: 1920, crf: 24 },
  balanced: { image: 0.75, imageEdge: 2560, videoEdge: 1280, crf: 28 },
  small: { image: 0.55, imageEdge: 1280, videoEdge: 854, crf: 32 }
});
function sanitizePath(value) {
  const parts = String(value || '').normalize('NFC').replace(/\\/g, '/').split('/');
  const clean = [];
  for (const part of parts) {
    if (!part || part === '.' || part === '..') continue;
    let name = part.replace(/[\u0000-\u001f\u007f]/g, '').replace(/[<>:"|?*]/g, '_').replace(/[. ]+$/g, '').trim();
    if (!name) continue;
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) name = '_' + name;
    clean.push(name);
  }
  return clean.join('/') || 'file';
}
function uniquePath(value, used) {
  const path = sanitizePath(value);
  const keys = new Set([...used].map(p => sanitizePath(p).toLowerCase()));
  const slash = path.lastIndexOf('/');
  const folder = path.slice(0, slash + 1);
  const name = path.slice(slash + 1);
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  let candidate = path;
  for (let n = 2; keys.has(candidate.toLowerCase()); n++) candidate = folder + stem + ' (' + n + ')' + ext;
  used.add(candidate);
  return candidate;
}
function outputName(name, extension) {
  const path = sanitizePath(name);
  const slash = path.lastIndexOf('/');
  const dot = path.lastIndexOf('.');
  return (dot > slash + 1 ? path.slice(0, dot) : path) + '.' + extension;
}
function inspectImage(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const textAt = (offset, text) => bytes.length >= offset + text.length && [...text].every((c,i) => bytes[offset+i] === c.charCodeAt(0));
  if (textAt(0, 'GIF87a') || textAt(0, 'GIF89a')) return { format: 'gif' };
  if (textAt(0, 'RIFF') && textAt(8, 'WEBP')) return { format: 'webp' };
  if ([137,80,78,71,13,10,26,10].every((n,i) => bytes[i] === n)) {
    let width, height, animated = false, offset = 8, ended = false;
    while (offset + 12 <= bytes.length) {
      const length = view.getUint32(offset);
      if (length > bytes.length - offset - 12) return { format: 'png', invalid: true };
      if (textAt(offset + 4, 'IHDR')) {
        if (offset !== 8 || length !== 13) return { format: 'png', invalid: true };
        width = view.getUint32(offset + 8); height = view.getUint32(offset + 12);
      }
      if (textAt(offset + 4, 'acTL')) animated = true;
      if (textAt(offset + 4, 'IEND')) { ended = true; break; }
      offset += length + 12;
    }
    return width && height && ended ? { format: 'png', width, height, animated } : { format: 'png', invalid: true };
  }
  if (bytes[0] === 255 && bytes[1] === 216) {
    let offset = 2;
    while (offset < bytes.length) {
      if (bytes[offset++] !== 255) return { format: 'jpeg', invalid: true };
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === undefined || marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue;
      if (offset + 2 > bytes.length) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        if (length < 8) break;
        const height = view.getUint16(offset + 3), width = view.getUint16(offset + 5);
        return width && height ? { format:'jpeg', width, height, animated:false } : { format:'jpeg', invalid:true };
      }
      offset += length;
    }
    return { format: 'jpeg', invalid: true };
  }
  return { format: 'unsupported' };
}
function videoArgs(input, output, quality = 'balanced') {
  const { videoEdge, crf } = QUALITY[quality] || QUALITY.balanced;
  const filter = "scale=w='min(" + videoEdge + ",iw)':h='min(" + videoEdge + ",ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1";
  return ['-i', input, '-map', '0:v:0', '-map', '0:a:0?', '-map_metadata', '-1', '-map_chapters', '-1',
    '-vf', filter, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(crf), '-pix_fmt', 'yuv420p',
    '-threads', '1', '-c:a', 'aac', '-b:a', '128k', '-sn', '-dn', '-movflags', '+faststart', output];
}

// ---------- Archive ZIP ----------
function abort(signal){if(signal?.aborted)throw new DOMException('Cancelled','AbortError');}
async function createArchive(entries,{signal,onProgress=()=>{}}={}){
 abort(signal);
 if(!globalThis.JSZip)throw new Error('ZIP library unavailable');
 if(!fitsSelection(entries.length,entries.reduce((n,e)=>n+(e.file?.size||0),0)))throw new Error('Archive limit exceeded');
 const seen=new Set();
 for(const e of entries){
  const name=e.path; const key=name.toLowerCase();
  if(!name||name.startsWith('/')||/[\\:\x00-\x1f]/.test(name)||name.split('/').some(x=>x==='..'||x==='.'))throw new Error('Unsafe archive path');
  if(seen.has(key))throw new Error('Duplicate archive path');
  seen.add(key);
 }
 const zip=new globalThis.JSZip();
 for(let i=0;i<entries.length;i++){
  abort(signal);const e=entries[i];
  if(e.directory){zip.folder(e.path);continue;}
  const bytes=new Uint8Array(await e.file.arrayBuffer());abort(signal);
  const compressed=/\.(jpe?g|png|gif|webp|avif|heic|mp4|mov|mkv|webm|mp3|aac|ogg|zip|7z|rar|gz|pdf|docx|xlsx|pptx)$/i.test(e.path);
  zip.file(e.path,bytes,{binary:true,createFolders:true,compression:compressed?'STORE':'DEFLATE',date:new Date(e.file.lastModified||Date.now())});
  onProgress(0.15*(i+1)/entries.length);
  await new Promise(r=>setTimeout(r,0));
 }
 const result=await zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6},streamFiles:true},meta=>{
  abort(signal);onProgress(0.15+0.85*meta.percent/100);
 });
 abort(signal);return new Blob([result],{type:'application/zip'});
}

// ---------- Moteur : images et vidéos ----------
const abortError = () => new DOMException('Compression cancelled', 'AbortError');
function checkAbort(signal) { if (signal?.aborted) throw abortError(); }
function original(file, reason, dimensions = {}) {
  return { blob: file, name: sanitizePath(file.name), changed: false, reason, ...dimensions };
}
function abortable(promise, signal) {
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    const abort = () => { cleanup(); reject(abortError()); };
    const cleanup = () => signal.removeEventListener('abort', abort);
    signal.addEventListener('abort', abort, { once: true });
    Promise.resolve(promise).then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(error); });
    if (signal.aborted) abort();
  });
}
function canvasBlob(canvas, type, quality) {
  if (canvas.convertToBlob) return canvas.convertToBlob({type, quality});
  return new Promise((resolve, reject) => canvas.toBlob(
    blob => blob ? resolve(blob) : reject(new Error('Image encoding failed')), type, quality));
}

/** JPEG and static PNG -> WebP (JPEG fallback for JPEG only). Animated formats remain untouched. */
async function compressImage(file, { quality = 'balanced', signal } = {}) {
  checkAbort(signal);
  if (file.size > LIMITS.imageBytes) return original(file, 'image-too-large');
  let bitmap, canvas, dimensions = {}, stage = 'decode-failed';
  try {
    const bytes = new Uint8Array(await abortable(file.arrayBuffer(), signal));
    checkAbort(signal);
    const meta = inspectImage(bytes);
    if (meta.format === 'gif') return original(file, 'animated-preserved');
    if (meta.format === 'webp') return original(file, 'format-preserved');
    if (meta.format === 'unsupported') return original(file, 'unsupported-format');
    if (meta.invalid) return original(file, 'invalid-image');
    dimensions = { width: meta.width, height: meta.height };
    if (meta.animated) return original(file, 'animated-preserved', dimensions);
    if (meta.width * meta.height > LIMITS.imagePixels) return original(file, 'image-too-many-pixels', dimensions);
    if (typeof createImageBitmap !== 'function') return original(file, 'decode-failed', dimensions);
    // Keep browser EXIF orientation correction enabled. Late results are closed when cancelled.
    const decoding = createImageBitmap(file, { imageOrientation: 'from-image' });
    decoding.then(value => { if (signal?.aborted) value.close(); }, () => {});
    bitmap = await abortable(decoding, signal);
    checkAbort(signal);
    dimensions = { width: bitmap.width, height: bitmap.height };
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > LIMITS.imagePixels)
      return original(file, 'image-too-many-pixels', dimensions);
    stage = 'encode-failed';
    const settings = QUALITY[quality] || QUALITY.balanced;
    const ratio = Math.min(1, settings.imageEdge / Math.max(bitmap.width, bitmap.height));
    const outputDimensions = {
      width: Math.max(1, Math.round(bitmap.width * ratio)),
      height: Math.max(1, Math.round(bitmap.height * ratio))
    };
    canvas = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(outputDimensions.width, outputDimensions.height) : document.createElement('canvas');
    canvas.width = outputDimensions.width; canvas.height = outputDimensions.height;
    const context = canvas.getContext('2d', { alpha: meta.format !== 'jpeg' });
    if (!context) return original(file, 'encode-failed', dimensions);
    context.drawImage(bitmap, 0, 0, outputDimensions.width, outputDimensions.height);
    const q = settings.image;
    let blob;
    try { blob = await abortable(canvasBlob(canvas, 'image/webp', q), signal); }
    catch (error) { checkAbort(signal); if (meta.format !== 'jpeg') throw error; }
    checkAbort(signal);
    if (blob?.type !== 'image/webp') {
      // PNG may contain transparency; never flatten it into JPEG.
      if (meta.format !== 'jpeg') return original(file, 'encode-failed', dimensions);
      blob = await abortable(canvasBlob(canvas, 'image/jpeg', q), signal);
      if (blob?.type !== 'image/jpeg') return original(file, 'encode-failed', dimensions);
    }
    checkAbort(signal);
    if (!blob.size) return original(file, 'encode-failed', dimensions);
    if (blob.size >= file.size) return original(file, 'no-gain', dimensions);
    return { blob, name: outputName(file.name, blob.type === 'image/webp' ? 'webp' : 'jpg'), changed: true, reason: 'compressed', ...outputDimensions };
  } catch (error) {
    if (signal?.aborted || error?.name === 'AbortError') throw abortError();
    return original(file, stage, dimensions);
  } finally {
    bitmap?.close();
    if (canvas) { canvas.width = 0; canvas.height = 0; }
  }
}

const CORE_BASE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/';
let videoInstance = null;
let activeVideo = null;
let jobCounter = 0;

function terminateInstance(instance = videoInstance) {
  if (!instance) return;
  if (videoInstance === instance) videoInstance = null;
  try { instance.terminate(); } catch { /* Worker may already be terminated. */ }
}

/** Stop a running video immediately and release the cached worker. */
function disposeVideo() {
  if (activeVideo) activeVideo.cancel();
  else terminateInstance();
}

async function loadVideo(signal, job) {
  if (videoInstance?.loaded) { job.instance = videoInstance; return videoInstance; }
  const { FFmpeg } = await abortable(import('./vendor/ffmpeg/index.js'), signal);
  checkAbort(signal);
  const instance = new FFmpeg();
  videoInstance = instance; job.instance = instance;
  const urls = [];
  try {
    const download = async (name, type) => {
      const response = await fetch(CORE_BASE + name, { signal });
      if (!response.ok) throw new Error('Engine download failed');
      const data = await response.arrayBuffer();
      checkAbort(signal);
      const url = URL.createObjectURL(new Blob([data], { type }));
      urls.push(url);
      return url;
    };
    const [coreURL, wasmURL] = await Promise.all([
      download('ffmpeg-core.js', 'text/javascript'),
      download('ffmpeg-core.wasm', 'application/wasm')
    ]);
    checkAbort(signal);
    await abortable(instance.load({ coreURL, wasmURL }), signal);
    checkAbort(signal);
    return instance;
  } catch (error) {
    terminateInstance(instance);
    throw error;
  } finally {
    // Both assets have been consumed once load resolves; no worker asset is needed by the single-thread core.
    for (const url of urls) URL.revokeObjectURL(url);
  }
}

/** Calls must be serialized by the UI queue. onProgress receives a fraction from 0 to 1. */
async function compressVideo(file, { quality = 'balanced', signal, onProgress } = {}) {
  checkAbort(signal);
  if (file.size > LIMITS.videoBytes) return original(file, 'video-too-large');
  if (activeVideo) throw Object.assign(new Error('Video compression is already running'), { code: 'video-busy' });
  const controller = new AbortController();
  const job = {
    instance: null,
    cancel() { controller.abort(); terminateInstance(job.instance); }
  };
  activeVideo = job;
  const externalAbort = () => job.cancel();
  signal?.addEventListener('abort', externalAbort, { once: true });
  if (signal?.aborted) job.cancel();
  const taskSignal = controller.signal;
  const input = 'input-' + (++jobCounter) + (/\.[a-z0-9]{1,8}$/i.exec(file.name)?.[0] || '.bin');
  const output = 'output-' + jobCounter + '.mp4';
  let stage = 'video-load-failed';
  let success = false;
  let progress = 0;
  const report = value => {
    progress = Math.max(progress, Math.min(1, Number.isFinite(value) ? value : 0));
    try { onProgress?.(progress); } catch { /* A UI progress callback must not stop encoding. */ }
  };
  const progressListener = event => report(Math.min(0.99, event.progress));
  try {
    report(0);
    const instance = await loadVideo(taskSignal, job);
    stage = 'video-failed';
    instance.on('progress', progressListener);
    const data = new Uint8Array(await abortable(file.arrayBuffer(), taskSignal));
    checkAbort(taskSignal);
    await abortable(instance.writeFile(input, data), taskSignal);
    const status = await abortable(instance.exec(videoArgs(input, output, quality)), taskSignal);
    checkAbort(taskSignal);
    if (status !== 0) return original(file, 'video-failed');
    const encoded = await abortable(instance.readFile(output), taskSignal);
    checkAbort(taskSignal);
    if (!(encoded instanceof Uint8Array) || !encoded.byteLength) return original(file, 'video-failed');
    const blob = new Blob([encoded], { type: 'video/mp4' });
    success = true;
    report(1);
    if (blob.size >= file.size) return original(file, 'no-gain');
    return { blob, name: outputName(file.name, 'mp4'), changed: true, reason: 'compressed' };
  } catch (error) {
    if (taskSignal.aborted || signal?.aborted || error?.name === 'AbortError') throw abortError();
    return original(file, stage);
  } finally {
    signal?.removeEventListener('abort', externalAbort);
    const instance = job.instance;
    if (instance) {
      try { instance.off('progress', progressListener); } catch {}
      if (!taskSignal.aborted && instance.loaded) {
        await Promise.allSettled([instance.deleteFile(input), instance.deleteFile(output)]);
      }
      if (!success) terminateInstance(instance);
    }
    // Also stop any concurrent engine download left after a failed Promise.all branch.
    controller.abort();
    if (activeVideo === job) activeVideo = null;
  }
}

// ---------- Interface ----------



const $ = id => document.getElementById(id);
const S = { mode: 'images', entries: [], results: [], busy: false, reading: false, controller: null, urls: [], zip: null, cancelled: false };

const DICT = {
  fr: {
    title: 'File Compressor — Images, vidéos et dossiers plus légers',
    description: 'Allège tes images, compresse de courtes vidéos et crée des ZIP. Gratuit, sans compte, directement sur ton appareil.',
    lead: 'Tes fichiers, en plus léger.',
    privacy: 'Sur ton appareil. Aucun fichier envoyé.', typeLabel: 'Type de fichiers',
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
    downloadZip: 'Télécharger le ZIP ↓',
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
    units: ['o', 'ko', 'Mo', 'Go']
  },
  en: {
    title: 'File Compressor — Lighter images, videos and folders',
    description: 'Compress images and short videos, or create ZIP archives. Free, no account, right on your device.',
    lead: 'Your files, a little lighter.',
    privacy: 'On your device. No files uploaded.', typeLabel: 'File type',
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
    downloadZip: 'Download ZIP ↓',
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
const stopIfCancelled = () => { if (S.controller?.signal.aborted) throw new DOMException('Cancelled', 'AbortError'); };

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
      stopIfCancelled();
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
        stopIfCancelled();
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
    stopIfCancelled();
    if (S.mode === 'folders' || S.results.length > 1) {
      $('progressText').textContent = t('creatingZip');
      try {
        const blob = await createArchive(S.results.map(r => ({ path: r.path, file: r.blob, directory: r.directory })), { signal: S.controller.signal, onProgress: p => { $('progress').value = 0.8 + p * 0.2; } });
        const folder = S.entries[0]?.path.split('/')[0];
        const name = S.mode === 'folders' && S.entries.every(e => e.path.startsWith(folder + '/')) ? folder + '-compressed.zip' : 'compressed.zip';
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
addEventListener('pagehide', () => { S.controller?.stopIfCancelled(); disposeVideo(); for (const u of S.urls) URL.revokeObjectURL(u); });

AF.i18n(DICT, {
  onChange: (_, dict) => {
    T = dict;
    renderOptions();
    renderQueue();
    if (S.results.length || S.zip) renderSummary();
  }
});

})();
