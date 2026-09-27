import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
const result = await build({
  entryPoints: ['tests/visual-scene.js'],
  bundle: true,
  write: false,
  format: 'iife',
  minify: true,
});
await mkdir('artifacts', { recursive: true });
await writeFile(
  'artifacts/visual.html',
  `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#020812;color:#cdf9ed;font:14px sans-serif}h1{position:absolute;top:20px;left:28px;font-size:20px;letter-spacing:3px}</style></head><body><h1></h1><script>${result.outputFiles[0].text}</script></body></html>`,
);

const audio = await build({
  entryPoints: ['tests/audio-scene.js'],
  bundle: true,
  write: false,
  format: 'iife',
  minify: true,
});
await writeFile(
  'artifacts/audio.html',
  `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><h1>Nova Wing — demonstração musical</h1><p>Seis segundos por estado: fase, subchefe, chefe, fúria, colapso, vitória.</p><button>Renderizar trilha</button><pre></pre><audio controls></audio><a hidden download="nova-wing-music.wav">Baixar demonstração</a><script>${audio.outputFiles[0].text}</script></body></html>`,
);
