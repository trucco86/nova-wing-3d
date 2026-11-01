import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseBossIntent, bossMeleeHit, bossMeleePose } from '../src/boss-combat-ai.js';
import { bossRadarPlan } from '../src/boss-radar.js';
import { createBossModel, disposeBoss } from '../src/bosses.js';
import { SECTORS } from '../src/campaign.js';
import { harness } from './harness.mjs';

test('Devastador engine exhaust locks on once; a lateral dash escapes the actual radar area', () => {
  const attack = chooseBossIntent({
    sector: 3,
    cycle: 2,
    playerX: -14,
    playerY: 13,
    generators: [true, true],
  });
  assert.equal(attack.kind, 'reactor-vent');
  assert.equal(attack.ventSide, -1);
  assert.equal(attack.origin, 'port-drive-valve');
  assert.ok(Object.isFrozen(attack));
  assert.equal(bossMeleeHit(attack, { x: -14, y: 13 }), true);
  assert.equal(bossMeleeHit(attack, { x: 12, y: 13 }), false);
  const radar = bossRadarPlan(attack, {
    x: -14,
    y: 13,
    originX: -38,
    originY: 13,
  });
  assert.equal(radar.shape.type, 'rect');
  assert.equal(radar.threatened, true);
  assert.ok(radar.exit);
  assert.match(radar.guide, /ZONA SEGURA/);
  assert.equal(bossMeleePose(attack, 'windup', 1).lunge, 0);
  assert.ok(bossMeleePose(attack, 'windup', 1).exhaust > 0);
  assert.ok(bossMeleePose(attack, 'attack', 0.7).exhaust > 0.8);
  assert.equal(bossMeleePose(attack, 'attack', 0.7).lunge, 0);
});

test('destroyed port valve disables port attacks; both destroyed leave core-only barrage', () => {
  const base = { sector: 3, cycle: 2, playerX: -12, playerY: 12 };
  const intact = chooseBossIntent({ ...base, generators: [true, true] });
  const starboardOnly = chooseBossIntent({ ...base, generators: [false, true] });
  const portOnly = chooseBossIntent({ ...base, generators: [true, false], playerX: 14 });
  const bothDead = chooseBossIntent({ ...base, generators: [false, false] });
  assert.equal(intact.ventSide, -1);
  assert.equal(starboardOnly.kind, 'reactor-vent');
  assert.equal(starboardOnly.ventSide, 1);
  assert.equal(starboardOnly.origin, 'starboard-drive-valve');
  assert.equal(portOnly.ventSide, -1);
  assert.equal(bothDead.kind, 'barrage');
  assert.equal(bossMeleeHit(bothDead, { x: -12, y: 12 }), false);
  assert.equal(bossRadarPlan(bothDead, { x: -12, y: 12 }), null);
});

test('Devastador has two real, named engine shock emitters with no new collision geometry', () => {
  const boss = createBossModel(SECTORS[3], 3, true);
  const jets = boss.userData.driveShockPlumes;
  assert.equal(jets.length, 2);
  assert.equal(jets[0].name, 'devastador-drive-shock-port');
  assert.equal(jets[1].name, 'devastador-drive-shock-starboard');
  assert.ok(jets.every((o) => o.visible === false && o.userData.visualOnly));
  assert.ok(jets.every((o) => o.geometry.type === 'ConeGeometry'));
  assert.ok(jets[0].position.x < 0 && jets[1].position.x > 0);
  assert.equal(boss.userData.parts.length, 2);
  disposeBoss(boss);
  const other = createBossModel(SECTORS[0], 0, true);
  assert.equal(other.userData.driveShockPlumes.length, 0, 'phase 1 boss must remain unchanged');
  disposeBoss(other);
});

test('QA stage 4 is now a 360 sabotage chamber, without generic boss strikes', (t) => {
  const h = harness({ hostname: 'dev.nova-wing-preview.pages.dev', spawnEncounters: false });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(3, 'boss'), true);
  const initial = h.game.snapshot();
  assert.equal(initial.bossParts, 8);
  assert.equal(initial.sabotage.system, 'power');
  assert.equal(initial.bossDriveShock.length, 0);
  h.advance(1.2, 0.1);
  const after = h.game.snapshot();
  assert.equal(after.boss, true);
  assert.equal(after.developerSession, true);
  assert.equal(after.bossParts, 8);
  assert.equal(after.bossIntent, null, 'generic boss windup is removed from Devastador');
  assert.equal(after.hostilePositions.length, 0, 'no invisible generic boss shots');
});

test('bomb command updates visible HUD immediately before the next WebGL frame', (t) => {
  const h = harness({ spawnEncounters: false });
  t.after(() => h.close());
  h.game.start();
  const before = h.game.snapshot().bombs;
  assert.ok(before > 0);
  h.game.bomb();
  assert.equal(h.game.snapshot().bombs, before - 1);
  assert.equal(h.elements.get('bombs').textContent, '◆ '.repeat(before - 1) || '—');
  assert.equal(
    h.elements.get('bombTouch')['data-count'],
    before - 1,
    'touch count and visible HUD must be in sync before another animation frame',
  );
});
