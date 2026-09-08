import { LIMITS, QUALITY, inspectImage, outputName, sanitizePath } from './core.mjs';
import { videoArgs } from './core.mjs';
export { sanitizePath, uniquePath } from './core.mjs';

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
export async function compressImage(file, { quality = 'balanced', signal } = {}) {
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
export function disposeVideo() {
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
export async function compressVideo(file, { quality = 'balanced', signal, onProgress } = {}) {
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
