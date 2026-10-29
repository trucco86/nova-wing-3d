import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fighterWaveAt, SECTOR_WAVE_PROGRAMS } from '../src/sector-waves.js';
import { harness } from './harness.mjs';

test('ten sectors have distinctive, deterministic and bounded fighter formations', () => {
  assert.equal(SECTOR_WAVE_PROGRAMS.length, 10);
  assert.equal(new Set(SECTOR_WAVE_PROGRAMS.map((p) => p.name)).size, 10);
  for (let sector = 0; sector < 10; sector++) {
    for (let cycle = 0; cycle < 6; cycle++) {
      const wave = fighterWaveAt(sector, cycle, sector === 0 ? 1 : 3);
      assert.deepEqual(wave, fighterWaveAt(sector, cycle, wave.slots.length));
      assert.ok(wave.slots.every((slot) => Math.abs(slot.x) <= 40 && slot.y >= 8 && slot.y <= 36));
    }
    assert.notEqual(fighterWaveAt(sector, 0, 3).rhythm, fighterWaveAt(sector, 1, 3).rhythm);
  }
  assert.throws(() => fighterWaveAt(-1, 0, 3), RangeError);
  assert.throws(() => fighterWaveAt(0, -1, 3), RangeError);
  assert.throws(() => fighterWaveAt(0, 0, 5), RangeError);
  assert.equal(fighterWaveAt(0, 0, 1).slots.length, 1);
  assert.equal(fighterWaveAt(0, 0, 2).slots.length, 2);
  assert.deepEqual(
    [0, 1, 2].map((cycle) => fighterWaveAt(0, cycle, 1).slots[0].role),
    ['pursuer', 'interceptor', 'bomber'],
  );
});

test('a running mission spawns the authored fleet pattern while preserving the boss gate', (t) => {
  const h = harness({ hostname: 'dev.nova-wing-preview.pages.dev', spawnEncounters: true });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(7, 'stage'), true);
  h.advance(6.1, 0.1);
  const state = h.game.snapshot();
  assert.equal(state.fighterWave?.name, 'GUARDA DA NAVE-MÃE');
  assert.ok(state.fighterWave?.cycle >= 0);
  assert.ok(state.targets.some((e) => e.kind === 'fighter' && e.role));
  assert.equal(state.boss, false);
});
