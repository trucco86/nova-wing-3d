import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { MARVIN_ARC, marvinBeatAt, createMarvinRival } from '../src/marvin-rival.js';
import { SECTORS } from '../src/campaign.js';
import { journeyForSector } from '../src/stage-journey.js';

test('approved sectors 1–3 remain absent from Marvin interference', () => {
  for (let sector = 0; sector < 4; sector++) {
    assert.equal(MARVIN_ARC[sector], undefined);
    assert.equal(marvinBeatAt(sector, 50, 150).active, false);
  }
  assert.equal(SECTORS[0].name, 'CIDADE DAS MÁQUINAS');
  assert.equal(SECTORS[1].name, 'DESERTO DE MARTE');
  assert.equal(SECTORS[2].name, 'CINTURÃO DE DESTROÇOS');
});

test('Marvin appears in every late mission with authored rival escalation', () => {
  assert.deepEqual(Object.keys(MARVIN_ARC).map(Number), [4, 5, 6, 7, 8, 9]);
  assert.equal(marvinBeatAt(4, 35, 88).type, 'intercept');
  assert.equal(marvinBeatAt(5, 45, 92).form, 'robot');
  assert.equal(marvinBeatAt(6, 72, 92, false).phase, 'await-boss');
  assert.equal(marvinBeatAt(6, 105, 92, true).active, true);
  assert.equal(marvinBeatAt(8, 110, 98, true).phase, 'piloting-boss');
  assert.equal(marvinBeatAt(9, 65, 150).type, 'pursuit');
  assert.equal(marvinBeatAt(9, 155, 150, true).phase, 'final-duel');
  assert.equal(journeyForSector(9).arena, 'final-fighter-duel');
  assert.ok(SECTORS[9].duration > 120, 'the last stage includes an extended chase');
});

test('Marvin launches real physical volleys, responds to shots, escapes and resets', () => {
  const scene = new T.Scene();
  const rival = createMarvinRival(scene);
  const shots = [];
  const messages = [];
  const options = {
    sector: 4, elapsed: 35, duration: 88, bossActive: false,
    player: new T.Vector3(0, 6, 9),
    fire: (...args) => shots.push(args),
    notify: (...args) => messages.push(args),
  };
  const first = rival.update(options);
  assert.equal(first.active, true);
  assert.equal(first.form, 'fighter');
  assert.equal(rival.snapshot().visible, true);
  assert.equal(shots.length, 2);
  assert.equal(messages.length, 1);
  assert.ok(shots[0][0].isVector3, 'the shot comes from a model hardpoint');
  rival.update({ ...options, elapsed: 35.02 });
  assert.equal(shots.length, 2, 'frame changes cannot duplicate a volley');
  assert.equal(messages.length, 1, 'narrative line is one-shot');
  assert.equal(rival.hit(150), 135);
  rival.update({ ...options, elapsed: 36 });
  assert.equal(rival.snapshot().visible, false);
  rival.reset();
  assert.equal(rival.snapshot().visible, false);
  rival.update({ ...options, sector: 9, elapsed: 35, duration: 150 });
  assert.equal(rival.hit(500), 135);
  assert.equal(rival.snapshot().hp, 1, 'chase cannot fake a final boss victory');
  rival.update({ ...options, sector: 9, elapsed: 39, duration: 150 });
  assert.equal(rival.snapshot().visible, true);
  rival.destroy();
});

test('Marvin never changes game camera, scene sector or progression on its own', () => {
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera();
  scene.add(camera);
  const starting = camera.position.toArray();
  const rival = createMarvinRival(scene);
  rival.update({ sector: 5, elapsed: 46, duration: 92, bossActive: false,
    player: new T.Vector3(10, 12, 9), fire() {}, notify() {} });
  assert.equal(rival.snapshot().form, 'robot');
  assert.deepEqual(camera.position.toArray(), starting);
  rival.destroy();
});
