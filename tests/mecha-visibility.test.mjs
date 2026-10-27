import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { harness } from './harness.mjs';

test('mecha geometry remains within the chase camera at each first transformation frame', (t) => {
  let robot;
  let camera;
  const h = harness({
    observeScene(scene, activeCamera) {
      const mesh = scene.getObjectByName('five-cats-flight-mech');
      if (mesh) {
        robot = mesh;
        camera = activeCamera;
      }
    },
  });
  t.after(() => h.close());
  h.game.start();
  h.key('KeyT');
  const frames = [0.08, 0.35, 0.85, 1.25];
  let last = 0;
  for (const time of frames) {
    h.advance(time - last, 0.02);
    last = time;
    assert.ok(robot?.visible, 'mecha rig must be visible at ' + time + 's');
    assert.ok(camera?.isPerspectiveCamera, 'render camera must be available');
    robot.updateWorldMatrix(true, true);
    camera.updateWorldMatrix(true, false);
    const bounds = new T.Box3().setFromObject(robot);
    assert.equal(bounds.isEmpty(), false, 'rig retains real geometry in first frames');
    const center = bounds.getCenter(new T.Vector3()).project(camera);
    assert.ok(
      Number.isFinite(center.x) && Number.isFinite(center.y) && Number.isFinite(center.z),
      'projection must be finite at ' + time + 's',
    );
    assert.ok(
      Math.abs(center.x) <= 1 && Math.abs(center.y) <= 1 && center.z >= -1 && center.z <= 1,
      'rig center stays in frame at ' + time + 's: ' + center.toArray(),
    );
  }
});
