import { createHash } from 'node:crypto';
import { readdirSync, lstatSync, readlinkSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const excludes = new Set([
  '.git',
  'node_modules',
  'artifacts',
  'test-results',
  'playwright-report',
  'android-web',
  '.gradle',
  'build',
  'capacitor-cordova-android-plugins',
  'capacitor-cordova-ios-plugins',
  'DerivedData',
  '.build',
]);

export function sourceDigest(root = '.') {
  function files(dir = '.') {
    return readdirSync(join(root, dir), { withFileTypes: true })
      .flatMap((entry) => {
        const path = join(dir, entry.name);
        if (
          excludes.has(entry.name) ||
          path.startsWith('android/app/src/main/assets') ||
          path.startsWith('ios/App/App/public') ||
          [
            'ios/App/App/capacitor.config.json',
            'ios/App/App/config.xml',
            'android/app/src/main/res/xml/config.xml',
          ].includes(path)
        )
          return [];
        return entry.isDirectory() ? files(path) : [path];
      })
      .sort();
  }
  const hash = createHash('sha256');
  for (const file of files()) {
    const path = join(root, file);
    hash
      .update(file)
      .update(lstatSync(path).isSymbolicLink() ? readlinkSync(path) : readFileSync(path));
  }
  return hash.digest('hex');
}
