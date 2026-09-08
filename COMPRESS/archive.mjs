import { fitsSelection } from './core.mjs';
function abort(signal){if(signal?.aborted)throw new DOMException('Cancelled','AbortError');}
export async function createArchive(entries,{signal,onProgress=()=>{}}={}){
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
