import * as T from 'three';
import { box, metal, glowMaterial } from './visuals.js';
const templates = new Map();
export function createEvolution(stage) {
  stage = Math.min(18, Math.max(0, Math.floor(stage)));
  if (!templates.has(stage)) {
    const g = new T.Group(),
      armor = metal('#b8d9e7', 0.8),
      dark = metal('#142d48'),
      light = glowMaterial(stage > 5 ? '#bd72ff' : '#52e8fa', 2);
    for (let n = 1; n <= stage; n++) {
      const tier = Math.ceil(n / 2);
      for (const side of [-1, 1]) {
        const x = side * (1.6 + tier * 0.44),
          z = 1.1 - (n % 2) * 1.6;
        if (n % 3 === 1) {
          const plate = box(0.8 + tier * 0.12, 0.24, 2.8, armor, x, 0.3 + tier * 0.09, z);
          plate.rotation.z = side * 0.15;
          g.add(plate, box(0.14, 0.15, 2.2, light, x, 0.55 + tier * 0.09, z));
        } else if (n % 3 === 2) {
          const barrel = new T.Mesh(new T.CylinderGeometry(0.13, 0.24, 3.8, 8), dark);
          barrel.rotation.x = Math.PI / 2;
          barrel.position.set(x, -0.25, -1.6);
          g.add(barrel, box(0.2, 0.2, 0.6, light, x, -0.25, -3.5));
        } else {
          const engine = new T.Mesh(new T.CylinderGeometry(0.32, 0.48, 2.6, 10), dark);
          engine.rotation.x = Math.PI / 2;
          engine.position.set(x, 0.2, 1.8);
          const jet = new T.Mesh(new T.ConeGeometry(0.28, 2.8, 8), light);
          jet.rotation.x = Math.PI / 2;
          jet.position.set(x, 0.2, 4.1);
          g.add(engine, jet);
        }
      }
    }
    templates.set(stage, g);
  }
  return templates.get(stage).clone(true);
}
