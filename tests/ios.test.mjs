import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { harness } from './harness.mjs';
import { installNativeShell } from '../src/native.js';

test('iOS interruption freezes the real game and returning requires explicit resume without Android actions', async (t) => {
  const h = harness({ nativeLifecycle: true });
  t.after(() => h.close());
  h.game.start();
  const events = new Map();
  const app = {
    async addListener(name, fn) {
      events.set(name, fn);
      return { remove: async () => events.delete(name) };
    },
    getState: async () => ({ isActive: true }),
    minimizeApp: () => assert.fail('iOS must not call Android minimize'),
  };
  const cleanup = await installNativeShell(h.game, {
    platform: 'ios',
    app,
    bars: { hide: async () => {} },
    document: h.document,
  });
  assert.equal(events.has('backButton'), false);
  assert.equal(h.document.body.classList.contains('native-ios'), true);
  h.elements.get('fireTouch').onpointerdown({ pointerId: 1 });
  h.advance(0.4);
  events.get('appStateChange')({ isActive: false });
  events.get('pause')();
  const before = h.game.snapshot();
  assert.equal(before.state, 'paused');
  assert.equal(before.controls.fire, false);
  h.window.emit('focus');
  h.document.emit('visibilitychange');
  h.game.pause();
  h.advance(3);
  assert.deepEqual(h.game.snapshot(), before);
  events.get('appStateChange')({ isActive: true });
  h.advance(2);
  assert.equal(h.game.snapshot().state, 'paused');
  assert.equal(h.game.snapshot().seconds, before.seconds);
  h.game.pause();
  h.advance(0.3);
  assert.equal(h.game.snapshot().state, 'playing');
  assert.ok(h.game.snapshot().seconds > before.seconds);
  await cleanup();
  assert.equal(events.size, 0);
  assert.equal(h.document.body.classList.contains('native-ios'), false);
});

test('iOS project ships the privacy manifest and matches release and pinned runtime versions', async () => {
  const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
  const pkg = JSON.parse(await read('package.json'));
  const project = await read('ios/App/App.xcodeproj/project.pbxproj');
  assert.match(project, /PrivacyInfo\.xcprivacy in Resources/);
  assert.match(project, /PRODUCT_BUNDLE_IDENTIFIER = com\.fivecats\.novawing;/);
  assert.ok(project.includes(`MARKETING_VERSION = ${pkg.version};`));
  const parts = pkg.version.split('.').map(Number);
  assert.ok(
    project.includes(
      `CURRENT_PROJECT_VERSION = ${parts[0] * 1000000 + parts[1] * 1000 + parts[2]};`,
    ),
  );
  const swift = await read('ios/App/CapApp-SPM/Package.swift');
  assert.ok(swift.includes(`exact: "${pkg.dependencies['@capacitor/ios']}"`));
  const plist = await read('ios/App/App/Info.plist');
  assert.ok(!plist.includes('UIInterfaceOrientationPortrait'));
  assert.ok(!plist.includes('UsageDescription'));
  assert.match(
    await read('ios/App/App/PrivacyInfo.xcprivacy'),
    /<key>NSPrivacyTracking<\/key>\s*<false\/>/,
  );
});
