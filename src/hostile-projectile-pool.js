import * as T from 'three';

// Enemy bolts keep the same geometry, light, damage and hit volumes as the
// original fire path. Recycling only their scene objects avoids repeated
// Mesh/Sprite/Vector allocations during sustained boss encounters.
// All materials and geometry are caller-owned and must NOT be disposed here.
export function createHostileProjectilePool({
  scene,
  geometry,
  materials,
  bossMaterials = [],
  createHalo,
  maxRetained = 96,
} = {}) {
  if (!Number.isInteger(maxRetained) || maxRetained < 0 || maxRetained > 180)
    throw new RangeError('maxRetained must be between 0 and 180');
  const idle = [];
  const active = new Set();
  let created = 0;
  let reused = 0;
  // Shared swept cone: no per-shot geometries or materials. The luminous
  // streak points backward from the actual projectile and rotates with it.
  const trailGeometry = new T.ConeGeometry(0.42, 4.5, 6);
  trailGeometry.rotateX(Math.PI / 2);
  const forward = new T.Vector3(0, 0, 1);

  function acquire(origin, target, spell = '', bossIndex = -1) {
    let shot = idle.pop();
    if (!shot) {
      const mesh = new T.Mesh(geometry, materials.normal);
      mesh.add(createHalo());
      const trail = new T.Mesh(trailGeometry, materials.fire);
      trail.name = 'hostile-projectile-streak';
      trail.position.z = -2.2;
      trail.visible = false;
      mesh.add(trail);
      shot = {
        o: mesh,
        v: new T.Vector3(),
        previousPosition: new T.Vector3(),
        life: 0,
        spell: '',
        age: 0,
      };
      created++;
    } else reused++;
    const themed = Number.isInteger(bossIndex) && bossIndex >= 0 && !!bossMaterials[bossIndex];
    shot.o.material = themed
      ? bossMaterials[bossIndex]
      : spell === 'arcane'
        ? materials.arcane
        : spell === 'fire'
          ? materials.fire
          : materials.normal;
    shot.o.scale.setScalar(themed ? 2.15 : spell ? 1.8 : 1);
    const streak = shot.o.getObjectByName('hostile-projectile-streak');
    streak.visible = themed;
    streak.material = shot.o.material;
    streak.scale.set(1, themed ? 1.1 + (bossIndex % 3) * 0.28 : 1, 1);
    shot.o.position.copy(origin);
    shot.o.rotation.set(0, 0, 0);
    shot.v
      .copy(target)
      .sub(origin)
      .normalize()
      .multiplyScalar(spell === 'arcane' ? 38 : 58);
    if (themed) shot.o.quaternion.setFromUnitVectors(forward, shot.v.clone().normalize());
    else shot.o.quaternion.identity();
    shot.previousPosition.copy(origin);
    shot.life = 6;
    shot.age = 0;
    shot.spell = spell;
    active.add(shot);
    scene.add(shot.o);
    return shot;
  }

  function release(shot) {
    if (!active.delete(shot)) return false;
    scene.remove(shot.o);
    shot.life = 0;
    if (idle.length < maxRetained) idle.push(shot);
    return true;
  }

  function clear() {
    for (const shot of active) scene.remove(shot.o);
    active.clear();
    idle.length = 0;
  }

  const stats = () => ({
    created,
    reused,
    active: active.size,
    retained: idle.length,
    maxRetained,
  });
  return Object.freeze({ acquire, release, clear, stats });
}
