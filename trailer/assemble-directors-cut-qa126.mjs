import { spawnSync } from 'node:child_process';
import { readFile, rename, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dir = resolve('artifacts/nova-wing-directors-cut-qa126');
const base = resolve(dir, 'nova-wing-directors-cut-4k30-60s.mp4');
const saturn = resolve('artifacts/nova-wing-qa126-saturn-patch/nova-wing-saturn-rings-premium-1080p30-4s.mp4');
const temp = resolve(dir, 'nova-wing-directors-cut-saturn-assembled.tmp.mp4');
const provenance = resolve(dir, 'provenance.json');
for (const path of [base, saturn, provenance]) {
  const s = await stat(path);
  if (s.size < (path.endsWith('.json') ? 1000 : 100000)) throw new Error('Missing or empty source: ' + path);
}
const graph = [
  '[1:v]scale=3840:2160:flags=lanczos,format=yuv420p,setpts=PTS-STARTPTS+41/TB[sat]',
  "[0:v][sat]overlay=0:0:enable='between(t,41,44.97)':eof_action=pass:shortest=0,format=yuv420p[v]",
].join(';');
const cmd = [
  '-hide_banner', '-loglevel', 'error', '-y', '-i', base, '-i', saturn,
  '-filter_complex', graph, '-map', '[v]', '-map', '0:a:0',
  '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '29',
  '-r', '30', '-pix_fmt', 'yuv420p', '-c:a', 'copy',
  '-t', '60', '-movflags', '+faststart', temp,
];
const rendered = spawnSync('ffmpeg', cmd, { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 });
if (rendered.status !== 0) throw new Error('QA126 Saturn splice failed: ' + (rendered.error?.message || rendered.stderr));
const verified = spawnSync('ffprobe', [
  '-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,avg_frame_rate','-of','json',temp,
],{encoding:'utf8'});
if(verified.status!==0) throw new Error('Cannot probe QA126 Saturn splice: '+verified.stderr);
const probe = JSON.parse(verified.stdout);
if(Math.abs(Number(probe.format.duration)-60)>0.05
  ||!probe.streams.some(s=>s.width===3840&&s.height===2160&&s.avg_frame_rate==='30/1')
  ||!probe.streams.some(s=>s.codec_name==='aac'))
    throw new Error('QA126 Saturn splice has unexpected media properties: '+verified.stdout);
await rename(temp, base);
const state = JSON.parse(await readFile(provenance,'utf8'));
state.saturnPatchApplied = {
  scene: 'saturn-rings-wide',
  source: 'Real WebGL/gameplay, 120 frames at 1080p30, steered via actual controls',
  start: 41,
  end: 45,
  sceneFraming: 'Stable ring silhouette, visible fighter, subtle steering',
  replacementMethod: 'FFmpeg overlay with time-aligned real gameplay frames',
  audio: 'Uninterrupted original project music, stream-copied from full trailer',
};
state.output = base;
state.assembledOutputSize = (await stat(base)).size;
await writeFile(provenance,JSON.stringify(state,null,2)+'\n');
console.log('[complete] QA126 Saturn premium establishing shot permanently applied to '+base);
