import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { bundleGame } from './build.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export async function prepareAndroidWeb(destination = resolve(root, 'android-web')) {
  // The web release keeps optional Google Fonts; installed Android is entirely offline.
  const html = (await bundleGame()).replace(
    /@import url\('https:\/\/fonts\.googleapis\.com[^']*'\);\n/,
    '',
  );
  await mkdir(destination, { recursive: true });
  await writeFile(resolve(destination, 'index.html'), html);
  await copyFile(resolve(root, 'LICENSE'), resolve(destination, 'LICENSE'));
  await copyFile(
    resolve(root, 'docs/THREE-LICENSE.txt'),
    resolve(destination, 'THREE-LICENSE.txt'),
  );
  for (const component of ['core', 'android', 'app'])
    await copyFile(
      resolve(root, `node_modules/@capacitor/${component}/LICENSE`),
      resolve(destination, `CAPACITOR-${component.toUpperCase()}-LICENSE.txt`),
    );
  return html;
}
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2] ?? 'sync';
  if (!['prepare', 'sync', 'apk', 'aab'].includes(command))
    throw new Error('Use prepare, sync, apk or aab');
  await prepareAndroidWeb();
  if (command !== 'prepare')
    run(process.execPath, ['node_modules/@capacitor/cli/bin/capacitor', 'sync', 'android']);
  if (command === 'apk' || command === 'aab') {
    const gradle = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    run(
      gradle,
      ['--no-daemon', command === 'apk' ? 'assembleDebug' : 'bundleRelease'],
      resolve(root, 'android'),
    );
  }
}
