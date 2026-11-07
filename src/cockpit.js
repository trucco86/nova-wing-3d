import * as T from 'three';
import { pilotAt } from './pilots.js';

/** Camera-mounted cockpit geometry; never participates in world collision or route bending. */
export function createCockpit(camera) {
  const group = new T.Group();
  group.name = 'five-cats-cockpit';
  const hull = new T.MeshBasicMaterial({ color: '#142f40' });
  const edge = new T.MeshBasicMaterial({ color: '#51cbb8' });
  const flashMat = new T.MeshBasicMaterial({ color: '#baffec', transparent: true, opacity: 0 });
  const furMat = new T.MeshStandardMaterial({ color: '#1c232b', roughness: 0.95 });
  const padMat = new T.MeshStandardMaterial({ color: '#765461', roughness: 0.94 });
  const palmGeometry = new T.SphereGeometry(0.29, 12, 8);
  const toeGeometry = new T.SphereGeometry(0.1, 9, 7);
  const paws = [];
  const flashes = [];
  function block(x, y, z, w, h, d, material = hull) {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.userData.fixedSky = true;
    group.add(mesh);
    return mesh;
  }
  // Lower instrument deck and slanted canopy pillars leave the forward view open.
  block(0, -1.65, -3.2, 5.5, 0.45, 1.2);
  for (const side of [-1, 1]) {
    block(side * 0.92, -1.36, -2.65, 1.1, 0.55, 0.08);
    block(side * 0.92, -1.35, -2.59, 0.94, 0.4, 0.03, edge);
    for (let i = 0; i < 5; i++)
      block(side * 0.92 - 0.35 + i * 0.17, -1.35, -2.56, 0.08, 0.09 + i * 0.04, 0.02);
    for (let i = 0; i < 3; i++)
      block(side * (1.65 + i * 0.16), -1.45, -2.55, 0.08, 0.08, 0.04, edge);
  }
  block(0, -1.4, -2.58, 0.48, 0.3, 0.06, edge);
  block(0, -1.91, -3.5, 2, 0.04, 0.35, edge);
  for (const side of [-1, 1]) {
    const pillar = block(side * 2.5, 0.1, -3.6, 0.11, 4.6, 0.16);
    pillar.rotation.z = side * -0.28;
    block(side * 0.45, -1.4, -4.2, 0.22, 0.25, 1.4);
    block(side * 0.45, -1.4, -4.93, 0.25, 0.28, 0.08, edge);
    flashes.push(block(side * 0.45, -1.4, -5.08, 0.35, 0.35, 0.2, flashMat));
  }
  // Reusable paw meshes and articulated controller sticks remain below the sightline.
  for (const side of [-1, 1]) {
    const paw = new T.Group();
    paw.name = side < 0 ? 'cockpit-paw-left' : 'cockpit-paw-right';
    paw.position.set(side * 0.72, -1.26, -2.76);
    const palm = new T.Mesh(palmGeometry, furMat);
    palm.scale.set(1.15, 0.55, 1);
    paw.add(palm);
    for (let toe = 0; toe < 4; toe++) {
      const digit = new T.Mesh(toeGeometry, furMat);
      digit.position.set((toe - 1.5) * 0.13, 0.035, -0.23);
      digit.scale.set(0.94, 0.85, 1.05);
      paw.add(digit);
    }
    const pad = new T.Mesh(toeGeometry, padMat);
    pad.position.set(0, -0.12, 0);
    pad.scale.set(1.65, 0.37, 1.15);
    paw.add(pad);
    block(side * 0.72, -1.57, -3.0, 0.12, 0.55, 0.14, edge);
    group.add(paw);
    paws.push({ paw, side });
  }
  camera.add(group);
  group.visible = false;
  let pulse = 0;
  let activePilot = null;
  let appearance = { fur: '#1c232b', pawScale: 0.89 };
  function setPilot(id) {
    const pilot = pilotAt(id);
    if (pilot.id === activePilot) return;
    activePilot = pilot.id;
    appearance = { fur: pilot.fur, pawScale: pilot.pawScale };
    furMat.color.set(pilot.fur);
    padMat.color.set(pilot.id === 'jenifer' ? '#ad838f' : '#765461');
    for (const { paw } of paws) paw.scale.setScalar(pilot.pawScale);
  }
  setPilot('bia');
  return {
    setPilot,
    fire() {
      pulse = 0.09;
    },
    update(dt, visible, charge = 0, { pilot = activePilot, steer = 0, boosting = false } = {}) {
      setPilot(pilot);
      for (const { paw, side } of paws) {
        paw.rotation.z = side * 0.07 - T.MathUtils.clamp(steer, -1, 1) * 0.18;
        paw.position.z = -2.76 - (boosting ? 0.14 : 0);
      }
      group.visible = visible;
      pulse = Math.max(0, pulse - dt);
      flashMat.opacity = pulse > 0 ? 0.85 : Math.min(0.7, charge * 0.45);
      flashes.forEach((mesh) => {
        mesh.visible = pulse > 0 || charge > 0.15;
        mesh.scale.setScalar(1 + charge * 2);
      });
    },
    snapshot() {
      return { pilot: activePilot, ...appearance, paws: paws.length, visible: group.visible };
    },
    destroy() {
      group.traverse((mesh) => {
        if (mesh.geometry && mesh.geometry !== palmGeometry && mesh.geometry !== toeGeometry)
          mesh.geometry.dispose();
      });
      palmGeometry.dispose();
      toeGeometry.dispose();
      furMat.dispose();
      padMat.dispose();
      hull.dispose();
      edge.dispose();
      flashMat.dispose();
      camera.remove(group);
    },
  };
}
