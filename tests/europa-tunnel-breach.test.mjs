import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { crossesSolid } from '../src/flight.js';
import {
  createObstacle,
  primeEuropaTunnelBreach,
  openEuropaTunnelBreach,
  updateEuropaTunnelBreach,
} from '../src/encounters.js';

test('Europa tunnel has a real solid wall until rupture and then a traversable aperture', () => {
  const tunnel = createObstacle('tunnel', 'europa');
  const intact = tunnel.userData.solids.length;
  assert.equal(tunnel.userData.kind, 'tunnel', 'campaign boss gate stays unchanged');
  assert.equal(tunnel.userData.europaBreach, true);
  const panel = tunnel.getObjectByName('europa-tunnel-breach-panel');
  const debris = tunnel.getObjectByName('europa-tunnel-falling-debris');
  assert.ok(panel && debris);
  assert.equal(panel.visible, true);
  assert.equal(debris.visible, false);
  const warning = tunnel.getObjectByName('europa-tunnel-breach-warning');
  assert.equal(warning.visible, false);
  assert.equal(warning.children.length, 8, 'branched fissure lines are visible geometry');
  assert.ok(warning.children.every((line) => line.userData.visualOnly));
  assert.equal(tunnel.userData.solids.filter((s) => s.breachPanel).length, 1);
  const outside = new T.Vector3(52, 15, -220);
  const inside = new T.Vector3(16, 15, -220);
  const blocked = () =>
    tunnel.userData.solids.some((solid) =>
      crossesSolid(outside, inside, solid.center, solid.half, 0.5),
    );
  assert.equal(blocked(), true, 'enemy cannot cross intact wall');
  assert.equal(primeEuropaTunnelBreach(tunnel, 0.5), true);
  assert.equal(warning.visible, true);
  assert.equal(tunnel.userData.breachWarningProgress, 0.5);
  assert.equal(panel.visible, true, 'crack cannot remove the collision before impact');
  assert.equal(blocked(), true, 'warning never opens an invisible hole');
  assert.throws(() => primeEuropaTunnelBreach(tunnel, -0.1), RangeError);
  assert.throws(() => primeEuropaTunnelBreach(tunnel, Number.NaN), RangeError);

  // A plane at the corridor entrance can only open when its actual collision
  // panel is removed, not merely when an explosion sprite is drawn.
  assert.equal(openEuropaTunnelBreach(tunnel), true);
  assert.equal(panel.visible, false);
  assert.equal(warning.visible, false, 'warning replaced by physical debris at impact');
  assert.equal(debris.visible, true);
  assert.equal(tunnel.userData.solids.length, intact - 1);
  assert.equal(
    tunnel.userData.solids.some((s) => s.breachPanel),
    false,
  );
  assert.equal(blocked(), false, 'opened wall must be traversable by collision engine');
  assert.equal(openEuropaTunnelBreach(tunnel), false, 'breach cannot repeatedly spawn enemies');

  const positions = debris.children.map((part) => part.position.clone());
  updateEuropaTunnelBreach(tunnel, 0.25);
  assert.ok(debris.children.every((part, i) => part.position.y < positions[i].y));
  assert.ok(debris.children.every((part, i) => part.position.x < positions[i].x),
    'ice fragments visibly burst into the corridor');
  for (let n = 0; n < 80; n++) updateEuropaTunnelBreach(tunnel, 0.1);
  assert.ok(debris.children.every((part) => part.position.y >= -5));
  assert.ok(debris.children.every((part) => part.userData.visualOnly));
});

test('broken Europa panel never edits other tunnel collision templates', () => {
  const a = createObstacle('tunnel', 'europa');
  const b = createObstacle('tunnel', 'europa');
  const ordinary = createObstacle('tunnel');
  const before = b.userData.solids.length;
  const standardBefore = ordinary.userData.solids.length;
  assert.notEqual(a.userData.solids, b.userData.solids);
  assert.equal(openEuropaTunnelBreach(a), true);
  assert.equal(b.userData.solids.length, before);
  assert.equal(b.getObjectByName('europa-tunnel-breach-panel').visible, true);
  assert.equal(ordinary.userData.solids.length, standardBefore);
  assert.equal(ordinary.getObjectByName('europa-tunnel-breach-panel'), undefined);
  assert.equal(openEuropaTunnelBreach(ordinary), false);
});
