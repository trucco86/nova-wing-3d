import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createObstacle,
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
  assert.equal(tunnel.userData.solids.filter((s) => s.breachPanel).length, 1);

  // A plane at the corridor entrance can only open when its actual collision
  // panel is removed, not merely when an explosion sprite is drawn.
  assert.equal(openEuropaTunnelBreach(tunnel), true);
  assert.equal(panel.visible, false);
  assert.equal(debris.visible, true);
  assert.equal(tunnel.userData.solids.length, intact - 1);
  assert.equal(
    tunnel.userData.solids.some((s) => s.breachPanel),
    false,
  );
  assert.equal(openEuropaTunnelBreach(tunnel), false, 'breach cannot repeatedly spawn enemies');

  const positions = debris.children.map((part) => part.position.y);
  updateEuropaTunnelBreach(tunnel, 0.25);
  assert.ok(debris.children.every((part, i) => part.position.y < positions[i]));
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
