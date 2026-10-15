import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { prepareAndroidWeb } from './android.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export async function syncIOSVersion() {
  const { version } = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 999))
    throw new Error('iOS version components must be integers between 0 and 999');
  const code = parts[0] * 1000000 + parts[1] * 1000 + parts[2];
  const path = resolve(root, 'ios/App/App.xcodeproj/project.pbxproj');
  const project = await readFile(path, 'utf8');
  await writeFile(
    path,
    project
      .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`)
      .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${code};`),
  );
}
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2] ?? 'sync';
  if (!['sync', 'open', 'build'].includes(command)) throw new Error('Use sync, open or build');
  if (command !== 'sync' && process.platform !== 'darwin')
    throw new Error('Opening or compiling iOS requires macOS with Xcode 26+');
  // Both native projects consume exactly the same offline bundle.
  await prepareAndroidWeb();
  run(process.execPath, ['node_modules/@capacitor/cli/bin/capacitor', 'sync', 'ios']);
  await syncIOSVersion();
  if (command === 'open')
    run(process.execPath, ['node_modules/@capacitor/cli/bin/capacitor', 'open', 'ios']);
  if (command === 'build')
    run('xcodebuild', [
      '-project',
      'ios/App/App.xcodeproj',
      '-scheme',
      'App',
      '-configuration',
      'Debug',
      '-sdk',
      'iphonesimulator',
      '-destination',
      'generic/platform=iOS Simulator',
      '-derivedDataPath',
      'artifacts/ios/DerivedData',
      'CODE_SIGNING_ALLOWED=NO',
      'build',
    ]);
}
