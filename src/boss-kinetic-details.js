import * as T from 'three';

// A consistent finish level for every authored chief: industrial fasteners,
// moving armor/mechanisms and active illuminated components. These parts are
// cosmetic only; existing hitboxes, attack emitters and weak points never move.
export const BOSS_DETAIL_GRAMMAR = Object.freeze([
  'interceptor-swept-flaps',
  'martian-hydraulic-struts',
  'carbide-drill-bearings',
  'reactor-safeguard-actuators',
  'plasma-heat-vanes',
  'glacial-piston-arms',
  'bio-tendril-sensors',
  'dreadnought-turret-servos',
  'gravity-lens-gimbals',
  'obsidian-vector-fins',
]);

export function createBossKineticDetails(index, { armor, dark, edge, hot }) {
  const root = new T.Group();
  root.name = 'boss-premium-kinetic-' + index;
  root.userData.visualOnly = true;
  root.userData.grammar = BOSS_DETAIL_GRAMMAR[index] ?? 'armored';
  const bolt = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), armor, 56);
  bolt.name = 'boss-industrial-rivets-instanced';
  bolt.userData.visualOnly = true;
  const helper = new T.Object3D();
  for (let i = 0; i < 56; i++) {
    const angle = ((i % 14) / 14) * Math.PI * 2;
    const radius = 22 + Math.floor(i / 14) * 5;
    helper.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius + 3, -16 - (i % 3) * 5);
    helper.rotation.z = angle;
    helper.scale.set(1.5, 4, 2);
    helper.updateMatrix();
    bolt.setMatrixAt(i, helper.matrix);
  }
  bolt.instanceMatrix.needsUpdate = true;
  root.add(bolt);
  const moving = [];
  for (const side of [-1, 1]) {
    const armature = new T.Group();
    armature.name = 'boss-articulated-mechanism-' + (side < 0 ? 'port' : 'starboard');
    armature.position.set(side * 31, 6, -14);
    const housing = new T.Mesh(new T.CylinderGeometry(6, 7.5, 11, 10), dark);
    housing.rotation.x = Math.PI / 2;
    housing.userData.visualOnly = true;
    armature.add(housing);
    const fin = new T.Mesh(
      index % 3 === 2
        ? new T.ConeGeometry(6, 19, 7)
        : index % 3 === 1
          ? new T.CylinderGeometry(3, 6, 22, 8)
          : new T.BoxGeometry(5, 22, 8),
      armor,
    );
    fin.name = 'boss-jointed-armor-fin';
    fin.position.set(side * 2, 12, 0);
    fin.rotation.z = side * 0.22;
    fin.userData.visualOnly = true;
    armature.add(fin);
    const active = new T.Mesh(new T.BoxGeometry(2, 16, 2), index % 2 ? hot : edge);
    active.name = 'boss-live-energy-conduit';
    active.position.set(side * 3, 12, 5);
    active.userData.visualOnly = true;
    armature.add(active);
    moving.push(armature);
    root.add(armature);
  }
  // At maximum scale the Obsidian fighter's new mechanisms must not
  // disappear into the existing premium ship silhouette.
  if (index === 9) root.scale.setScalar(2);
  root.userData.mechanisms = moving;
  return root;
}

export function animateBossKineticDetails(root, index, time, phase = 1, attackState = 'maneuver') {
  if (!root) return;
  const attacking = attackState === 'attack' || attackState === 'windup';
  const intensity = attacking ? 0.38 : 0.16;
  root.userData.mechanisms.forEach((mechanism, i) => {
    const direction = i === 0 ? 1 : -1;
    mechanism.rotation.y = direction * Math.sin(time * (0.7 + index * 0.04) + i) * intensity;
    mechanism.rotation.z =
      direction * Math.sin(time * (0.9 + phase * 0.23) + i * 2) * (attacking ? 0.24 : 0.1);
    const conduit = mechanism.getObjectByName('boss-live-energy-conduit');
    conduit.scale.y = 0.88 + 0.22 * Math.sin(time * 3.7 + i + phase);
  });
}
