import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

if (process.platform !== 'darwin') throw new Error('Simulator smoke requires macOS');
const out = resolve('artifacts/ios');
mkdirSync(out, { recursive: true });
const app = resolve(out, 'DerivedData/Build/Products/Debug-iphonesimulator/App.app');
if (!readFileSync(resolve(app, 'public/index.html')).equals(readFileSync('android-web/index.html')))
  throw new Error('iOS package differs from offline game assets');
const run = (...args) => execFileSync('xcrun', args, { encoding: 'utf8', timeout: 180000 });
const { devices } = JSON.parse(run('simctl', 'list', 'devices', 'available', '-j'));
const phones = Object.entries(devices)
  .filter(([runtime]) => runtime.includes('iOS'))
  .flatMap(([, entries]) => entries)
  .filter((device) => device.name.startsWith('iPhone') && device.isAvailable);
const phone = phones.find((device) => device.state === 'Booted') ?? phones[0];
if (!phone) throw new Error('No available iPhone simulator');
try {
  if (phone.state !== 'Booted') run('simctl', 'boot', phone.udid);
  run('simctl', 'bootstatus', phone.udid, '-b');
  run('simctl', 'install', phone.udid, app);
  const launch = run('simctl', 'launch', phone.udid, 'com.fivecats.novawing');
  // Allow the WebView and initial scene to render before collecting review evidence.
  await new Promise((resolve) => setTimeout(resolve, 15000));
  run('simctl', 'io', phone.udid, 'screenshot', resolve(out, 'ios-launch.png'));
  writeFileSync(
    resolve(out, 'smoke.json'),
    JSON.stringify(
      {
        device: phone.name,
        launch: launch.trim(),
        assetsMatch: true,
        scope: 'Simulator install and launch only; physical touch/audio acceptance remains pending',
      },
      null,
      2,
    ) + '\n',
  );
} finally {
  if (phone.state !== 'Booted') run('simctl', 'shutdown', phone.udid);
}
