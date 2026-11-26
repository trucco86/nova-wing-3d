import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bossMeleePose, chooseBossIntent } from '../src/boss-combat-ai.js';

test('only body charges translate the boss', () => {
  for (const kind of ['bite', 'drill-ram', 'plasma-dive', 'rok-ram', 'stingray-sting']) {
    assert.ok(bossMeleePose({ kind, warning: 2.2 }, 'attack', 0.7).lunge > 0);
  }
  for (const kind of ['claw-swipe', 'cryo-pincer', 'tentacle-grab', 'ice-quake', 'solar-sweep']) {
    const pose = bossMeleePose({ kind, warning: 2.2 }, 'attack', 0.7);
    assert.equal(pose.lunge, 0, kind);
    assert.equal(pose.track, 0, kind);
  }
});

test('repeated early attacks vary and destroyed reactor hardware stays disabled', () => {
  for (const sector of [0, 1, 2, 4, 5, 6, 7, 8, 9]) {
    const args = { sector, cycle: 1, phase: 1, playerY: 12 };
    const first = chooseBossIntent(args);
    const next = chooseBossIntent({ ...args, previousKind: first.kind });
    assert.notEqual(next.kind, first.kind, String(sector));
  }
  assert.equal(
    chooseBossIntent({ sector: 3, cycle: 1, generators: [false, false], previousKind: 'barrage' })
      .kind,
    'barrage',
  );
});
