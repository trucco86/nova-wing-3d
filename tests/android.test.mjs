import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { harness } from './harness.mjs';
import { reachSectorBoss } from './mission-scenarios.mjs';
import { installNativeShell } from '../src/native.js';
import { prepareAndroidWeb } from '../tools/android.mjs';
import { defeatBoss, advanceToBoss } from './combat-helper.mjs';

function setup(t, options) {
  const h = harness(options);
  t.after(() => h.close());
  h.game.start();
  return h;
}
test('background freezes combat, clears multi-touch and suspends audio until explicit resume', (t) => {
  const h = setup(t);
  for (const id of ['fireTouch', 'boostTouch'])
    h.elements.get(id).onpointerdown({ pointerId: id === 'fireTouch' ? 1 : 2 });
  h.advance(0.4);
  h.game.setActive(false);
  const paused = h.game.snapshot();
  const resumed = h.calls.audioResume;
  assert.equal(paused.state, 'paused');
  assert.equal(paused.controls.fire, false);
  assert.equal(paused.controls.boost, false);
  assert.equal(h.calls.audioSuspend, 1);
  h.game.setActive(false);
  h.advance(5);
  h.game.pause();
  h.game.start();
  assert.deepEqual(h.game.snapshot(), paused);
  assert.equal(h.calls.audioSuspend, 1);
  h.game.setActive(true);
  h.advance(1);
  assert.equal(h.game.snapshot().state, 'paused');
  assert.equal(h.game.snapshot().seconds, paused.seconds);
  assert.equal(h.calls.audioResume, resumed);
  h.game.pause();
  h.advance(0.2);
  assert.equal(h.game.snapshot().state, 'playing');
  assert.ok(h.game.snapshot().seconds > paused.seconds);
  assert.equal(h.calls.audioResume, resumed + 1);
  assert.equal(h.calls.audio, 1);
});
test('background preserves collapse rewards and the hangar resumes audio only on continuation', (t) => {
  const h = setup(t);
  advanceToBoss(h);
  defeatBoss(h, { stopAtCollapse: true });
  assert.equal(h.game.snapshot().state, 'collapsing');
  h.advance(2);
  h.game.setActive(false);
  const before = h.game.snapshot();
  h.advance(20);
  h.game.setActive(true);
  h.advance(20);
  assert.equal(h.game.snapshot().collapseTime, before.collapseTime);
  assert.equal(h.game.snapshot().credits, before.credits);
  h.game.pause();
  h.advance(6.1);
  assert.equal(h.game.snapshot().state, 'shop');
  const earned = h.game.snapshot().credits;
  const resumed = h.calls.audioResume;
  h.game.setActive(false);
  h.game.nextSector();
  assert.equal(h.game.snapshot().state, 'shop');
  h.game.setActive(true);
  h.advance(2);
  assert.equal(h.calls.audioResume, resumed);
  assert.equal(h.game.snapshot().credits, earned);
  h.game.nextSector();
  assert.equal(h.game.snapshot().state, 'playing');
  assert.equal(h.game.snapshot().sector, 2);
  assert.equal(h.calls.audioResume, resumed + 1);
});
test('background during respawn preserves pilot transition and previously paused sessions', (t) => {
  const h = setup(t);
  h.advance(3.1);
  h.game.damage(500);
  assert.equal(h.game.snapshot().state, 'respawning');
  h.game.setActive(false);
  h.advance(10);
  h.game.setActive(true);
  h.advance(10);
  assert.equal(h.game.snapshot().state, 'paused');
  h.game.pause();
  assert.equal(h.game.snapshot().state, 'respawning');
  h.advance(1.6);
  assert.equal(h.game.snapshot().state, 'playing');
  assert.equal(h.game.snapshot().lives, 2);
  h.game.pause();
  h.game.setActive(false);
  h.game.setActive(true);
  assert.equal(h.game.snapshot().state, 'paused');
});
test('native adapter pauses on Back, minimizes on second Back and removes listeners', async (t) => {
  const h = setup(t, { nativeLifecycle: true });
  const events = new Map();
  let minimized = 0,
    hidden = 0;
  const app = {
    async addListener(name, fn) {
      events.set(name, fn);
      return { remove: async () => events.delete(name) };
    },
    getState: async () => ({ isActive: true }),
    minimizeApp: async () => {
      minimized++;
    },
  };
  const bars = {
    hide: async () => {
      hidden++;
    },
  };
  const cleanup = await installNativeShell(h.game, {
    platform: 'android',
    app,
    bars,
    document: h.document,
  });
  assert.equal(h.document.body.classList.contains('native-android'), true);
  events.get('backButton')();
  assert.equal(h.game.snapshot().state, 'paused');
  events.get('backButton')();
  assert.equal(minimized, 1);
  events.get('pause')();
  events.get('appStateChange')({ isActive: false });
  const before = h.game.snapshot();
  h.window.emit('focus');
  h.document.emit('visibilitychange');
  h.game.pause();
  h.advance(4);
  assert.deepEqual(h.game.snapshot(), before);
  events.get('appStateChange')({ isActive: true });
  assert.equal(h.game.snapshot().state, 'paused');
  assert.equal(hidden, 2);
  await cleanup();
  assert.equal(events.size, 0);
  assert.equal(h.document.body.classList.contains('native-android'), false);
  let called = false;
  await installNativeShell(h.game, {
    platform: 'web',
    app: {
      addListener: () => {
        called = true;
      },
    },
  });
  assert.equal(called, false, 'web never registers native handlers');
});
test('Android bundles actual game assets offline with matching product version and licenses', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'nova-wing-android-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const html = await prepareAndroidWeb(dir);
  const { version } = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8'),
  );
  assert.ok(html.includes(`id="gameVersion">v${version}</span>`));
  assert.ok(html.includes('data:image/webp;base64,'));
  assert.ok(html.includes('CIDADE DAS MÁQUINAS'));
  assert.ok(!/@import|<script[^>]+src=|<link[^>]+href="https?:/.test(html));
  assert.ok((await readFile(join(dir, 'LICENSE'), 'utf8')).includes('MIT'));
  assert.ok((await readFile(join(dir, 'THREE-LICENSE.txt'), 'utf8')).includes('MIT'));
  const config = JSON.parse(
    await readFile(new URL('../capacitor.config.json', import.meta.url), 'utf8'),
  );
  assert.equal(config.server?.url, undefined);
  assert.equal(config.appId, 'com.fivecats.novawing');
  const variables = await readFile(new URL('../android/variables.gradle', import.meta.url), 'utf8');
  assert.match(variables, /targetSdkVersion = 36/);
  assert.match(variables, /compileSdkVersion = 36/);
});
