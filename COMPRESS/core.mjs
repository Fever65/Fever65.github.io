// Signed 32-bit FFmpeg input boundary; available memory can impose a lower practical limit.
export const LIMITS = Object.freeze({ imageBytes: 2_147_483_647, imagePixels: 40_000_000, videoBytes: 2_147_483_647, selectionBytes: 2_147_483_647, selectionFiles: 1000 });
export function fitsSelection(count, bytes) {
  return Number.isSafeInteger(count) && count >= 0 && count <= LIMITS.selectionFiles && Number.isSafeInteger(bytes) && bytes >= 0 && bytes <= LIMITS.selectionBytes;
}
export const QUALITY = Object.freeze({
  high: { image: 0.88, imageEdge: 4096, videoEdge: 1920, crf: 24 },
  balanced: { image: 0.75, imageEdge: 2560, videoEdge: 1280, crf: 28 },
  small: { image: 0.55, imageEdge: 1280, videoEdge: 854, crf: 32 }
});
export function sanitizePath(value) {
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
export function uniquePath(value, used) {
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
export function outputName(name, extension) {
  const path = sanitizePath(name);
  const slash = path.lastIndexOf('/');
  const dot = path.lastIndexOf('.');
  return (dot > slash + 1 ? path.slice(0, dot) : path) + '.' + extension;
}
export function inspectImage(data) {
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
export function videoArgs(input, output, quality = 'balanced') {
  const { videoEdge, crf } = QUALITY[quality] || QUALITY.balanced;
  const filter = "scale=w='min(" + videoEdge + ",iw)':h='min(" + videoEdge + ",ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1";
  return ['-i', input, '-map', '0:v:0', '-map', '0:a:0?', '-map_metadata', '-1', '-map_chapters', '-1',
    '-vf', filter, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(crf), '-pix_fmt', 'yuv420p',
    '-threads', '1', '-c:a', 'aac', '-b:a', '128k', '-sn', '-dn', '-movflags', '+faststart', output];
}
