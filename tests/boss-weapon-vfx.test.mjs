import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SECTORS } from '../src/campaign.js';
import { createBossModel, disposeBoss } from '../src/bosses.js';
import {
  BOSS_WEAPON_COLORS,
  animateBossWeaponVfx,
  bossWeaponColor,
  flashBossWeapon,
} from '../src/boss-weapon-vfx.js';
import { sourceHardpointName } from '../src/boss-hardpoints.js';

test('all ten bosses use ten bright palettes at the actual physical cannon mouths', () => {
  assert.equal(BOSS_WEAPON_COLORS.length, 10);
  assert.equal(new Set(BOSS_WEAPON_COLORS).size, 10);
  for (let i = 0; i < 10; i++) {
    const boss = createBossModel(SECTORS[i], i, true);
    try {
      for (const side of [-1, 1, 0]) {
        if (side === 0) boss.userData.parts.forEach((part) => (part.hp = 0));
        const holder = side === 0 ? boss : boss.userData.batteries[side < 0 ? 0 : 1];
        const muzzle = holder.getObjectByName(sourceHardpointName(side));
        const face = holder.children.find((part) => part.name === 'boss-weapon-visible-rim');
        const bore = holder.children.find((part) => part.name === 'boss-weapon-bore');
        const flash = holder.children.find((part) => part.name === 'boss-weapon-flash');
        assert.ok(muzzle && face?.isMesh && bore?.isMesh && flash?.isMesh);
        boss.position.set(0, 10, -110);
        boss.rotation.y = i / 20;
        boss.updateMatrixWorld(true);
        const distance = face
          .getWorldPosition(new T.Vector3())
          .distanceTo(muzzle.getWorldPosition(new T.Vector3()));
        assert.ok(distance < 1.5, 'visible mouth must coincide with real shot origin');
        assert.equal(flash.visible, false);
        assert.equal(flashBossWeapon(boss, side), true);
        assert.equal(flash.visible, true);
        animateBossWeaponVfx(boss, 4, 1, 0.05);
        assert.ok(flash.scale.x > 0.5, 'actual emission visibly flashes');
        animateBossWeaponVfx(boss, 4.3, 0, 0.2);
        assert.equal(flash.visible, false);
      }
    } finally {
      disposeBoss(boss);
    }
  }
  assert.throws(() => bossWeaponColor(-1), RangeError);
  assert.throws(() => bossWeaponColor(10), RangeError);
});

test('destroyed batteries lose charge and flashes, leaving the emergency core weapon', () => {
  const boss = createBossModel(SECTORS[7], 7, true);
  try {
    const [left, right] = boss.userData.batteries;
    animateBossWeaponVfx(boss, 3, 0.9, 0.05);
    assert.equal(left.userData.weaponVfx.charge.visible, true);
    assert.equal(right.userData.weaponVfx.charge.visible, true);
    assert.equal(boss.userData.coreWeaponVfx.charge.visible, false);
    boss.userData.parts[0].hp = 0;
    flashBossWeapon(boss, -1);
    animateBossWeaponVfx(boss, 3.2, 1, 0.01);
    assert.equal(left.userData.weaponVfx.flash.visible, false);
    assert.equal(left.userData.weaponVfx.charge.visible, false);
    assert.equal(right.userData.weaponVfx.charge.visible, true);
    boss.userData.parts[1].hp = 0;
    animateBossWeaponVfx(boss, 3.5, 1, 0.03);
    assert.equal(right.userData.weaponVfx.charge.visible, false);
    assert.equal(boss.userData.coreWeaponVfx.charge.visible, true);
    flashBossWeapon(boss, 0);
    animateBossWeaponVfx(boss, 3.7, 1, 0.03);
    assert.equal(boss.userData.coreWeaponVfx.flash.visible, true);
  } finally {
    disposeBoss(boss);
  }
});
