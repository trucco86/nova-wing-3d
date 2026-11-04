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
  const worldUp = new T.Vector3(0, 1, 0);
  const tetherDirection = new T.Vector3();
  // A bounded transient beam connects the cannon with the projectile for its
  // first 0.42s. Pooling prevents per-frame meshes and allocations.
  const tetherGeometry = new T.CylinderGeometry(0.19, 0.42, 1, 7);

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
        launchOrigin: new T.Vector3(),
        tether: null,
        bossIndex: -1,
        life: 0,
        spell: '',
        age: 0,
      };
      created++;
    } else reused++;
    const themed = Number.isInteger(bossIndex) && bossIndex >= 0 && !!bossMaterials[bossIndex];
    shot.bossIndex = themed ? bossIndex : -1;
    shot.launchOrigin.copy(origin);
    if (shot.tether) {
      shot.tether.visible = false;
      scene.remove(shot.tether);
    }
    if (themed) {
      if (!shot.tether) {
        shot.tether = new T.Mesh(tetherGeometry, bossMaterials[bossIndex]);
        shot.tether.name = 'boss-physical-muzzle-shot-link';
        shot.tether.frustumCulled = false;
      }
      shot.tether.material = bossMaterials[bossIndex];
      shot.tether.visible = false;
      scene.add(shot.tether);
    }
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

  function advanceVisual(shot) {
    if (!active.has(shot) || !shot.tether) return;
    if (shot.bossIndex < 0 || shot.age > 0.42) {
      shot.tether.visible = false;
      return;
    }
    tetherDirection.copy(shot.o.position).sub(shot.launchOrigin);
    const distance = tetherDirection.length();
    if (distance < 0.6) {
      shot.tether.visible = false;
      return;
    }
    shot.tether.visible = true;
    shot.tether.position.copy(shot.launchOrigin).addScaledVector(tetherDirection, 0.5);
    shot.tether.quaternion.setFromUnitVectors(worldUp, tetherDirection.multiplyScalar(1 / distance));
    shot.tether.scale.set(1, distance, 1);
  }

  function release(shot) {
    if (!active.delete(shot)) return false;
    scene.remove(shot.o);
    if (shot.tether) {
      scene.remove(shot.tether);
      shot.tether.visible = false;
    }
    shot.bossIndex = -1;
    shot.life = 0;
    if (idle.length < maxRetained) idle.push(shot);
    return true;
  }

  function clear() {
    for (const shot of active) {
      scene.remove(shot.o);
      if (shot.tether) scene.remove(shot.tether);
    }
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
  return Object.freeze({ acquire, advanceVisual, release, clear, stats });
}
