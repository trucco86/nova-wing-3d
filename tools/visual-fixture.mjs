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
