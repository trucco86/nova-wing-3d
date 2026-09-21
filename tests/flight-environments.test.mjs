import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { harness } from './harness.mjs';
import { createFlightCamera, crossesSolid } from '../src/flight.js';
import { createGroundEnemy, createObstacle } from '../src/encounters.js';
function setup(t, opts) {
  const h = harness(opts);
  t.after(() => h.close());
  h.game.start();
  return h;
}
test('chase rig shifts the near environment more than the horizon and is time based', () => {
  function run(dt) {
    const camera = new T.PerspectiveCamera(60, 16 / 9, 0.1, 2500),
      rig = createFlightCamera(camera);
    rig.reset(new T.Vector3(0, 6, 9));
    camera.updateMatrixWorld();
    const near = new T.Vector3(40, 10, -70).project(camera).x,
      far = new T.Vector3(40, 10, -1000).project(camera).x;
    for (let t = 0; t < 1 - 1e-8; t += dt) rig.update(dt, new T.Vector3(20, 6, 9), 1, false);
    camera.updateMatrixWorld();
    return {
      x: camera.position.x,
      bank: camera.rotation.z,
      near: new T.Vector3(40, 10, -70).project(camera).x - near,
      far: new T.Vector3(40, 10, -1000).project(camera).x - far,
    };
  }
  const a = run(1 / 30),
    b = run(1 / 60);
  assert.ok(a.x > 20);
  assert.ok(Math.abs(a.bank) > 0.02);
  assert.ok(Math.abs(a.near - a.far) > 0.15, 'depth-dependent lateral parallax');
  assert.ok(Math.abs(a.x - b.x) < 1e-8);
  assert.ok(Math.abs(a.bank - b.bank) < 1e-8);
});
test('camera freezes on pause and resets for a new mission', (t) => {
  const h = setup(t);
  const initial = h.game.snapshot().camera;
  h.key('KeyD');
  h.advance(0.7);
  h.game.pause();
  const held = h.game.snapshot().camera;
  h.advance(1);
  assert.deepEqual(h.game.snapshot().camera, held);
  h.game.start();
  assert.deepEqual(h.game.snapshot().camera, initial);
});
test('industrial openings are traversable while high-speed solid crossings collide', () => {
  for (const kind of ['gantry', 'reactor', 'tunnel']) {
    const g = createObstacle(kind);
    assert.ok(g.userData.solids.length > 0);
    g.traverse((o) => {
      for (const n of o.geometry?.attributes.position.array ?? []) assert.ok(Number.isFinite(n));
    });
  }
  const tunnel = createObstacle('tunnel');
  const crossing = (x, y, z) =>
    tunnel.userData.solids.some((s) =>
      crossesSolid(new T.Vector3(x, y, z + 20), new T.Vector3(x, y, z - 20), s.center, s.half, 1.3),
    );
  assert.equal(crossing(9, 10, -110), false, 'first gate right opening');
  assert.equal(crossing(-9, 10, -260), false, 'second gate left opening');
  assert.equal(crossing(-25, 10, -110), true, 'solid left panel');
  assert.equal(crossing(9, 39, -110), true, 'ceiling');
  const reactor = createObstacle('reactor');
  assert.equal(
    reactor.userData.solids.some((s) =>
      crossesSolid(new T.Vector3(0, 22, 30), new T.Vector3(0, 22, -30), s.center, s.half),
    ),
    false,
    'can fly over reactor',
  );
});
test('ground models reuse meshes with independent articulated turrets', () => {
  for (const kind of ['tank', 'walker']) {
    const a = createGroundEnemy(kind),
      b = createGroundEnemy(kind);
    assert.equal(a.children[0].geometry, b.children[0].geometry);
    assert.notEqual(a.userData.turret, b.userData.turret);
    const bounds = new T.Box3().setFromObject(a).getSize(new T.Vector3());
    assert.ok(bounds.y > (kind === 'walker' ? 25 : 6));
    a.traverse((o) => {
      for (const n of o.geometry?.attributes.position.array ?? []) assert.ok(Number.isFinite(n));
    });
  }
});
test('tanks and walkers appear, fire and award credits when destroyed', (t) => {
  const h = setup(t, { spawnEncounters: true });
  h.advance(5.2);
  assert.ok(h.game.snapshot().encounterKinds.includes('tank'));
  const credits = h.game.snapshot().credits;
  h.game.bomb();
  assert.ok(h.game.snapshot().credits > credits);
  assert.ok(!h.game.snapshot().encounterKinds.includes('tank'));
  h.advance(6);
  assert.ok(h.game.snapshot().encounterKinds.includes('walker'));
  h.advance(1);
  assert.ok(h.game.snapshot().entities.hostile > 0);
});
test('low-altitude laser fire can damage a terrestrial tank', (t) => {
  const h = setup(t, { spawnEncounters: true });
  h.key('KeyA');
  h.advance(17 / 24);
  h.key('KeyA', false);
  h.key('KeyS');
  h.advance(0.35);
  h.key('KeyS', false);
  h.advance(4.05);
  const tank = h.game.snapshot().targets.find((e) => e.kind === 'tank');
  assert.ok(tank);
  h.key('Space');
  h.advance(1.1);
  h.key('Space', false);
  const after = h.game.snapshot().targets.find((e) => e.kind === 'tank');
  assert.ok(!after || after.life < tank.life, 'ground hull hitbox accepts low flight shots');
});
test('tunnel spawns once with combat, clears on restart and freezes with pause', (t) => {
  const h = setup(t, { spawnEncounters: true });
  for (let i = 0; i < 25; i++) {
    h.game.collect('shield');
    h.advance(1);
  }
  assert.equal(h.game.snapshot().tunnel, true);
  h.game.pause();
  const s = h.game.snapshot();
  h.advance(2);
  assert.deepEqual(h.game.snapshot(), s);
  h.game.pause();
  for (let i = 0; i < 18; i++) {
    h.game.collect('shield');
    h.advance(1);
  }
  assert.equal(h.game.snapshot().tunnel, false);
  h.game.start();
  assert.equal(h.game.snapshot().tunnel, false);
  assert.equal(h.game.snapshot().entities.obstacles, 0);
});
test('multiple fingers, long holds, cancellation and pause never latch touch actions', (t) => {
  const h = setup(t),
    stick = h.elements.get('stick'),
    fire = h.elements.get('fireTouch'),
    boost = h.elements.get('boostTouch');
  let prevented = 0;
  const ev = (pointerId, x = 85) => ({
    pointerId,
    clientX: x,
    clientY: 50,
    preventDefault() {
      prevented++;
    },
  });
  stick.onpointerdown(ev(1));
  fire.onpointerdown(ev(2));
  boost.onpointerdown(ev(3));
  stick.onpointerdown(ev(4, 15));
  stick.emit('pointercancel', ev(4));
  h.advance(1);
  assert.ok(h.game.snapshot().player.x > 0);
  assert.ok(h.game.snapshot().charge >= 0.9);
  assert.ok(h.game.snapshot().energy < 100);
  fire.emit('pointercancel', ev(2));
  boost.emit('lostpointercapture', ev(3));
  stick.emit('pointerup', ev(1));
  assert.deepEqual(h.game.snapshot().controls, { fire: false, boost: false, stickX: 0, stickY: 0 });
  fire.onpointerdown(ev(5));
  h.game.pause();
  h.game.pause();
  h.advance(0.2);
  assert.equal(h.game.snapshot().controls.fire, false);
  assert.equal(h.game.snapshot().charge, 0);
  assert.ok(prevented >= 4);
  for (const type of ['contextmenu', 'selectstart', 'dragstart']) {
    let cancelled = false;
    h.elements.get('touch').emit(type, {
      preventDefault() {
        cancelled = true;
      },
    });
    assert.ok(cancelled);
  }
});
