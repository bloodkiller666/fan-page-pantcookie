// Pre-generates the derived Cloudinary assets (poster + 720p MP4) for every video in
// src/data/videos.json, so the first visitor does not wait for the transformation.
//
//   node scripts/warm-videos.mjs
//
// Run it after adding videos to videos.json (or after uploading new ones).
import { readFile } from 'node:fs/promises';
import { hdUrl, posterUrl } from '../src/utils/videoUrls.js';

const videos = JSON.parse(await readFile(new URL('../src/data/videos.json', import.meta.url), 'utf8'));

async function warm(label, url) {
  const t0 = performance.now();
  try {
    const res = await fetch(url);
    // Read the whole body: Cloudinary only finishes generating once it has streamed it out.
    const bytes = (await res.arrayBuffer()).byteLength;
    const secs = ((performance.now() - t0) / 1000).toFixed(1);
    console.log(`${res.ok ? 'ok  ' : 'FAIL'} ${String(res.status).padEnd(3)} ${secs.padStart(5)}s ${(bytes / 1048576).toFixed(1).padStart(5)} MB  ${label}`);
    return res.ok;
  } catch (err) {
    console.log(`FAIL --- ${label}: ${err.message}`);
    return false;
  }
}

const jobs = videos.flatMap((v) => [
  () => warm(`poster ${v.id}`, posterUrl(v.id)),
  () => warm(`hd     ${v.id}`, hdUrl(v.id)),
]);

// Three at a time: polite to Cloudinary, still quick.
let failed = 0;
const queue = [...jobs];
await Promise.all(
  Array.from({ length: 3 }, async () => {
    while (queue.length) if (!(await queue.shift()())) failed++;
  })
);

console.log(failed ? `\n${failed} request(s) failed. Re-run to retry.` : '\nAll derived assets are ready.');
process.exit(failed ? 1 : 0);
