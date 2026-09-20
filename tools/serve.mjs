import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const args = process.argv.slice(2);
const i = args.indexOf('--port');
const port = i < 0 ? 4173 : Number(args[i + 1]);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid port');
// Serve only the public artifact. Never serve .git, credentials or the repository tree.
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const visual = process.env.NOVA_VISUAL_TEST === '1' && url.pathname === '/__visual.html';
  if (
    !visual &&
    !['/', '/index.html', '/nova-wing-3d/', '/nova-wing-3d/index.html'].includes(url.pathname)
  ) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  try {
    const html = await readFile(
      new URL(visual ? '../artifacts/visual.html' : '../index.html', import.meta.url),
    );
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(html);
  } catch {
    res.writeHead(503);
    res.end('Run npm run build first.');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Nova Wing 3D: http://127.0.0.1:${port}/`));
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => server.close(() => process.exit(0)));
