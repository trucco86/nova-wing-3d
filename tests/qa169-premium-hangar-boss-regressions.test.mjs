import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SECTORS } from '../src/campaign.js';
import { createBossModel, disposeBoss } from '../src/bosses.js';
import {
  chooseBossIntent,
  variedAdvancedBossAttack,
  bossMeleeHit,
} from '../src/boss-combat-ai.js';

test('Hydra, Omega and Marvin vary repeated windup telegraphs without retargeting', () => {
  for (const [sector, repeated, alternate] of [
    [6, 'tentacle-grab', 'tentacle-sweep'],
    [6, 'tentacle-sweep', 'tentacle-grab'],
    [7, 'bite', 'hammer-slam'],
    [7, 'hammer-slam', 'bite'],
    [7, 'tentacle-grab', 'tentacle-sweep'],
    [9, 'bite', 'barrage'],
    [9, 'claw-swipe', 'tentacle-grab'],
    [9, 'tentacle-grab', 'tentacle-sweep'],
    [9, 'marvin-rear-thruster-sweep', 'barrage'],
  ]) {
    assert.equal(
      variedAdvancedBossAttack({
        sector, kind: repeated, previousKind: repeated, cycle: 2,
        generators: [true, true],
      }),
      alternate,
      'sector ' + sector + ' cannot telegraph the exact same physical strike twice',
    );
    assert.equal(
      variedAdvancedBossAttack({
        sector, kind: repeated, previousKind: repeated, cycle: 4,
        generators: [true, true],
      }),
      repeated, 'every fourth cycle retains the authored ranged counter',
    );
    assert.equal(
      variedAdvancedBossAttack({
        sector, kind: repeated, previousKind: repeated, cycle: 2,
        generators: [false, false],
      }),
      repeated, 'no destroyed weapon is resurrected for variety',
    );
  }
  const hydra = chooseBossIntent({
    sector: 6, cycle: 2, playerX: 9, playerY: 30, previousKind: 'tentacle-grab',
  });
  assert.equal(hydra.kind, 'tentacle-sweep');
  assert.deepEqual([hydra.targetX, hydra.targetY], [9, 30]);
  assert.equal(bossMeleeHit(hydra, { x: 90, y: 55 }), false);
  const omega = chooseBossIntent({
    sector: 7, cycle: 3, playerX: 3, playerY: 12, previousKind: 'bite',
  });
  assert.equal(omega.kind, 'hammer-slam');
  const marvin = chooseBossIntent({
    sector: 9, cycle: 3, playerX: 5, playerY: 11, previousKind: 'bite',
  });
  assert.equal(marvin.kind, 'barrage');
  assert.equal(marvin.originMesh, null, 'a core volley never pretends to come from a hidden claw');
});

test('Marvin final pilot has visible actual face, claws and two tentacles', () => {
  const boss = createBossModel(SECTORS[9], 9, true);
  const fighter = boss.getObjectByName('marvin-final-obsidian-fighter');
  assert.ok(fighter?.visible);
  const parts = [
    'marvin-pitbull',
    'marvin-bite-jaw',
    'marvin-left-claw',
    'marvin-right-claw',
    'marvin-port-tentacle',
    'marvin-starboard-tentacle',
  ];
  boss.updateWorldMatrix(true, true);
  for (const name of parts) {
    const mesh = boss.getObjectByName(name);
    assert.ok(mesh, name + ' must exist');
    let n = mesh;
    while (n && n !== boss) {
      assert.equal(n.visible, true, name + ' must not have a hidden parent');
      n = n.parent;
    }
    assert.ok(fighter.getObjectByName(name), name + ' belongs to the visible final pilot');
  }
  assert.ok(
    boss.getObjectByName('marvin-pitbull').getWorldPosition(new T.Vector3()).z > 15,
    'the dog's face is in front of the black fighter, not hidden behind it',
  );
  const originalWeaponIds = boss.userData.parts.map((part) => part.mesh.uuid);
  assert.deepEqual(boss.userData.parts.map((part) => part.mesh.uuid), originalWeaponIds);
  disposeBoss(boss);
});

test('Marvin and Hydra radar aim at real named visible appendages', () => {
  const bite = chooseBossIntent({ sector: 9, cycle: 1, playerY: 8 });
  assert.equal(bite.originMesh, 'marvin-bite-jaw');
  const high = chooseBossIntent({ sector: 9, cycle: 1, playerY: 44 });
  assert.match(high.originMesh, /^marvin-(port|starboard)-tentacle$/);
  const flank = chooseBossIntent({ sector: 9, cycle: 2, orbit: 1.2 });
  assert.match(flank.originMesh, /^marvin-(left|right)-claw$/);
  const hydra = chooseBossIntent({ sector: 6, cycle: 1, playerY: 36 });
  assert.match(hydra.originMesh, /^signature-hydra-head-[0-6]$/);
});
