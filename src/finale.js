import * as T from 'three';
export const COLLAPSE_SECONDS = 8;
export function createCollapse(position) {
  const g = new T.Group();
  g.position.copy(position);
  const hot = new T.MeshBasicMaterial({
    color: '#ffad42',
    transparent: true,
    blending: T.AdditiveBlending,
    depthWrite: false,
  });
  const flash = new T.Mesh(new T.SphereGeometry(1, 24, 16), hot);
  flash.name = 'flash';
  g.add(flash);
  const wave = new T.Mesh(new T.TorusGeometry(1, 0.035, 6, 64), hot);
  wave.name = 'wave';
  g.add(wave);
  const steel = new T.MeshStandardMaterial({ color: '#424b5b', roughness: 0.8 });
  const geo = new T.BoxGeometry(2, 1, 3);
  for (let i = 0; i < 36; i++) {
    const shard = new T.Mesh(geo, steel);
    const a = i * 2.399963;
    shard.userData.velocity = new T.Vector3(
      Math.cos(a) * (12 + (i % 5)),
      Math.sin(a) * (8 + (i % 7)),
      ((i % 7) - 3) * 5,
    );
    shard.name = 'debris';
    g.add(shard);
  }
  g.userData = { hot, steel };
  updateCollapse(g, 0);
  return g;
}
export function updateCollapse(g, time) {
  const burst = Math.max(0, time - 4.7),
    flash = g.getObjectByName('flash'),
    wave = g.getObjectByName('wave');
  flash.visible = time >= 4.7 && time < 6.5;
  wave.visible = time >= 4.7;
  flash.scale.setScalar(1 + burst * 35);
  wave.scale.setScalar(1 + burst * 65);
  g.userData.hot.opacity = Math.max(0, 1 - burst / 2.8);
  for (const o of g.children)
    if (o.name === 'debris') {
      o.visible = burst > 0;
      o.position.copy(o.userData.velocity).multiplyScalar(burst);
      o.position.y -= burst * burst * 3;
      o.rotation.set(burst * 1.2, burst * 0.7, burst);
    }
}
export function disposeCollapse(g) {
  const geos = new Set();
  g.traverse((o) => {
    if (o.geometry) geos.add(o.geometry);
  });
  geos.forEach((o) => o.dispose());
  g.userData.hot.dispose();
  g.userData.steel.dispose();
}
