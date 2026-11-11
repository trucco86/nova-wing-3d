import * as T from 'three';
import { advertisingTexture, CITY32_ADS } from './city-32-living.js';

// City 3.3 — premium architecture, transit and active construction.
// World-space geometry is entirely decorative; no scene colliders or pickups.
const cube = new T.BoxGeometry(1, 1, 1);
const lightGeometry = new T.SphereGeometry(1, 6, 4);
const renderObject = new T.Object3D();
// The city is cloned for the second road tile. Keep live references in a
// WeakMap so each clone owns its own buses and construction equipment.
const premiumAnimation = new WeakMap();
function animationNodes(root) {
  let nodes = premiumAnimation.get(root);
  if (nodes) return nodes;
  const traffic = root.getObjectByName('city33-moving-futuristic-buses');
  const sites = root.getObjectByName('city33-active-construction-sites');
  nodes = {
    parts: ['hull', 'glazing', 'marker', 'roof'].map((key) =>
      traffic.getObjectByName('city33-bus-' + key),
    ),
    cranes: sites.getObjectByName('city33-animated-cranes').children,
    sparks: sites.getObjectByName('city33-welding-sparks'),
    origins: sites.userData.siteOrigins,
  };
  premiumAnimation.set(root, nodes);
  return nodes;
}
const slate = ['#758994', '#899ba4', '#9ca9ab', '#657f8e', '#b8b5ae', '#70808c'];
const busPaint = new T.MeshPhysicalMaterial({
  color: '#d8e5e8',
  metalness: 0.69,
  roughness: 0.25,
  clearcoat: 0.52,
});
const busGlass = new T.MeshStandardMaterial({
  color: '#385c6a',
  metalness: 0.43,
  roughness: 0.19,
});
const busLight = new T.MeshBasicMaterial({ color: '#c3f8ff', toneMapped: false });
const cladding = new T.MeshStandardMaterial({ color: '#e5e8e6', metalness: 0.64, roughness: 0.37 });
const panelGlass = new T.MeshStandardMaterial({
  color: '#789eae',
  metalness: 0.42,
  roughness: 0.17,
});
const machinery = new T.MeshStandardMaterial({
  color: '#b5bac0',
  metalness: 0.73,
  roughness: 0.36,
});
const fineMetal = new T.MeshStandardMaterial({
  color: '#7a8992',
  metalness: 0.75,
  roughness: 0.29,
});
const amber = new T.MeshBasicMaterial({ color: '#ffe0a1', toneMapped: false });
const safety = new T.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
const cyan = new T.MeshBasicMaterial({ color: '#77dce7', toneMapped: false });

function batch(parent, name, material, entries, premium = false) {
  const mesh = new T.InstancedMesh(cube, material, entries.length);
  mesh.name = name;
  mesh.userData.visualOnly = true;
  mesh.userData.premium = premium;
  mesh.frustumCulled = false;
  entries.forEach((part, index) => {
    renderObject.position.set(part.x, part.y, part.z);
    renderObject.rotation.set(0, part.angle || 0, 0);
    renderObject.scale.set(part.w, part.h, part.d);
    renderObject.updateMatrix();
    mesh.setMatrixAt(index, renderObject.matrix);
    if (part.color) mesh.setColorAt(index, new T.Color(part.color));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  parent.add(mesh);
  return mesh;
}

const part = (x, y, z, w, h, d, color) => ({ x, y, z, w, h, d, color });

function architecturalDetail(root, buildings) {
  const medium = new T.Group();
  medium.name = 'city33-architecture-medium';
  medium.userData.visualOnly = true;
  const high = new T.Group();
  high.name = 'city33-architecture-high';
  high.userData.visualOnly = true;
  high.visible = false;
  const facade = [],
    windowRecess = [],
    crown = [],
    conduit = [],
    rooftops = [];
  const mullions = [],
    balconies = [],
    lightStreaks = [],
    windowFrames = [],
    glassPanes = [],
    interiorLights = [],
    floorCornices = [];
  const ads = new T.Group();
  ads.name = 'city33-facade-integrated-campaigns';
  ads.userData.visualOnly = true;
  buildings.forEach((b, i) => {
    const face = b.z + b.depth * 0.5;
    // Steel, concrete and glass in subdued material families. Coloured
    // signage is an accent, never the base paint of a whole building.
    const color = slate[(i * 7 + Math.floor(i / 17)) % slate.length];
    const side = Math.sign(b.x) || 1;
    // Change cross-section with shallow inset bays and stepped crowns.
    for (let j = 0; j < 3; j++) {
      facade.push(
        part(
          b.x + (j - 1) * b.w * 0.29,
          -7 + b.h * (0.33 + (j % 2) * 0.14),
          face + 0.36 + (j % 2) * 0.3,
          b.w * 0.24,
          b.h * (0.46 + j * 0.09),
          0.45,
          color,
        ),
      );
    }
    // Keep base glazing behind the new real window openings; the old glass
    // slab was in front of many of the windows, hiding their detail.
    windowRecess.push(part(b.x, -7 + b.h * 0.49, face + 0.06, b.w * 0.72, b.h * 0.43, 0.18));
    const rows = Math.max(5, Math.min(14, Math.floor(b.h / 6)));
    const columns = i % 6 === 0 ? 3 : 4 + (i % 2);
    for (let row = 0; row < rows; row++) {
      const py = -7 + ((row + 0.8) / (rows + 1.1)) * b.h;
      for (let col = 0; col < columns; col++) {
        if ((i * 13 + row * 7 + col * 11) % 23 === 0) continue;
        const px = b.x + ((col + 0.5) / columns - 0.5) * b.w * 0.81;
        const width = (b.w * 0.64) / columns;
        const height = Math.max(1.55, (b.h / (rows + 1)) * 0.38);
        windowFrames.push(part(px, py, face + 1.03, width + 0.3, height + 0.35, 0.2));
        glassPanes.push(
          part(
            px,
            py,
            face + 1.18,
            width - 0.12,
            height - 0.12,
            0.09,
            ['#76939d', '#b1c0be', '#547683', '#99abb0'][(i + row + col) % 4],
          ),
        );
        if ((i + row * 9 + col * 5) % 11 === 0)
          interiorLights.push(part(px, py, face + 1.29, width * 0.73, height * 0.66, 0.08));
      }
      if (row % 3 === 0)
        floorCornices.push(
          part(b.x, py + (b.h / (rows + 1)) * 0.36, face + 0.99, b.w * 0.86, 0.14, 0.34),
        );
    }
    crown.push(part(b.x, b.h - 6.5, b.z, b.w * 1.06, 1.2 + (i % 3), b.depth * 1.08, color));
    crown.push(part(b.x, b.h - 2.5 + (i % 3) * 0.5, b.z, b.w * 0.79, 2, b.depth * 0.68, color));
    // Service pipe runs on side wall facing the flight corridor; supports
    // and glazing recesses make parallax reveal a three-dimensional facade.
    conduit.push(
      part(
        b.x - side * (b.w / 2 + 0.37),
        -7 + b.h * 0.54,
        b.z + b.depth * 0.16,
        0.55,
        b.h * 0.55,
        0.73,
      ),
    );
    rooftops.push(part(b.x - b.w * 0.21, b.h - 0.1, b.z, b.w * 0.22, 3.2, b.depth * 0.36, color));
    rooftops.push(
      part(
        b.x + b.w * 0.26,
        b.h - 1.6,
        b.z - b.depth * 0.14,
        b.w * 0.19,
        2.2,
        b.depth * 0.28,
        color,
      ),
    );
    // Microdetails reserved for High; all users still see stepped profiles.
    for (let j = 0; j < 5; j++) {
      mullions.push(
        part(b.x + (j - 2) * b.w * 0.15, -7 + b.h * 0.5, face + 0.92, 0.13, b.h * 0.45, 0.14),
      );
    }
    if (i % 3 === 0) {
      for (let j = 0; j < 3; j++) {
        balconies.push(
          part(b.x, -7 + b.h * (0.22 + j * 0.2), face + 1.2, b.w * 0.65, 0.55, 2.2, color),
        );
      }
    }
    if (i % 5 === 0) {
      lightStreaks.push(part(b.x, -7 + b.h * 0.81, face + 1.03, b.w * 0.62, 0.16, 0.3));
    }
    // Large luminous commercial murals belong to only a few landmarks;
    // all other cladding uses architectural steel rather than garish neon.
    if (i > 12 && i % 35 === 17 && b.h > 42 && ads.children.length < 5) {
      const [name, tagline, tint] = CITY32_ADS[(i + 2) % CITY32_ADS.length];
      const billboard = new T.Mesh(
        new T.PlaneGeometry(1, 1),
        new T.MeshBasicMaterial({
          map: advertisingTexture(name, tagline, tint),
          side: T.DoubleSide,
          toneMapped: false,
        }),
      );
      billboard.name = 'city33-building-campaign-' + i;
      billboard.userData.visualOnly = true;
      billboard.userData.brand = name;
      billboard.position.set(b.x, -7 + b.h * 0.67, face + 1.72);
      billboard.scale.set(b.w * 0.77, Math.min(28, b.h * 0.41), 1);
      ads.add(billboard);
    }
  });
  batch(medium, 'city34-detailed-window-frames', fineMetal, windowFrames);
  batch(medium, 'city34-tempered-glass-panes', panelGlass, glassPanes);
  batch(medium, 'city34-warm-occupied-windows', amber, interiorLights);
  batch(medium, 'city34-architectural-floor-cornices', cladding, floorCornices);
  batch(medium, 'city33-facade-recessed-panels', cladding, facade);
  batch(medium, 'city33-facade-recessed-glass', panelGlass, windowRecess);
  batch(medium, 'city33-stepped-roof-crowns', cladding, crown);
  batch(medium, 'city33-side-service-conduits', fineMetal, conduit);
  batch(medium, 'city33-rooftop-hvac', machinery, rooftops);
  batch(high, 'city33-precision-window-mullions', fineMetal, mullions, true);
  batch(high, 'city33-facade-balconies', cladding, balconies, true);
  batch(high, 'city33-exterior-linear-lights', cyan, lightStreaks, true);
  medium.add(ads);
  root.add(medium, high);
}

function elevatedBusRoute(root) {
  const group = new T.Group();
  group.name = 'city33-midstage-transit';
  group.userData.visualOnly = true;
  const roadway = [],
    tracks = [],
    guard = [],
    station = [],
    piers = [],
    cantilevers = [];
  // Side-running busways at mid-stage, with open bridges to the transport
  // district. They remain out of the player lane and have no collision.
  for (const side of [-1, 1]) {
    const x = side * 66;
    for (let i = 0; i < 30; i++) {
      const z = -540 - i * 33;
      roadway.push(part(x, 13.2, z, 17, 2.2, 32.2));
      tracks.push(part(x - side * 7.7, 15, z, 0.62, 0.5, 32));
      tracks.push(part(x + side * 7.7, 15, z, 0.62, 0.5, 32));
      // The busway is supported from outside the flight corridor.
      // Piers touch street y=-7 and cantilevers meet the real deck underside.
      if (i % 4 === 0) {
        piers.push(part(side * 85, 1.5, z, 2.8, 17, 3.2));
        cantilevers.push(part(side * 76, 11.15, z, 20, 2.15, 3.5));
      }
      if (i % 3 === 0) {
        guard.push(part(x - side * 8.8, 20, z, 0.7, 7, 0.7));
        guard.push(part(x + side * 8.8, 20, z, 0.7, 7, 0.7));
      }
      if (i % 8 === 0) {
        station.push(part(x + side * 19, 17, z, 15, 2, 28));
        station.push(part(x + side * 19, 27, z, 16, 1, 29));
      }
    }
  }
  batch(group, 'city33-suspended-busway-decks', machinery, roadway);
  batch(group, 'city33-suspended-busway-lights', cyan, tracks);
  batch(group, 'city33-suspended-busway-guardrails', fineMetal, guard);
  batch(group, 'city33-busway-platforms', cladding, station);
  batch(group, 'city33-busway-grounded-piers', machinery, piers);
  batch(group, 'city33-busway-cantilever-braces', fineMetal, cantilevers);
  const traffic = new T.Group();
  traffic.name = 'city33-moving-futuristic-buses';
  traffic.userData.visualOnly = true;
  const count = 8;
  const geometry = {
    hull: new T.InstancedMesh(cube, busPaint, count),
    glazing: new T.InstancedMesh(cube, busGlass, count),
    marker: new T.InstancedMesh(cube, busLight, count),
    roof: new T.InstancedMesh(cube, fineMetal, count),
  };
  Object.entries(geometry).forEach(([name, mesh]) => {
    mesh.name = 'city33-bus-' + name;
    mesh.frustumCulled = false;
    mesh.userData.visualOnly = true;
    traffic.add(mesh);
  });
  group.add(traffic);
  root.add(group);
}

function activeConstruction(root, buildings) {
  const site = new T.Group();
  site.name = 'city33-active-construction-sites';
  site.userData.visualOnly = true;
  const scaffolds = [],
    platforms = [],
    braces = [],
    warning = [];
  const cranes = new T.Group();
  cranes.name = 'city33-animated-cranes';
  const sparks = new T.InstancedMesh(lightGeometry, amber, 12);
  sparks.name = 'city33-welding-sparks';
  sparks.frustumCulled = false;
  sparks.userData.visualOnly = true;
  // Pick three existing towers around the MIDPOINT. No floating construction.
  const chosen = [78, 111, 146].map((i) => buildings[i]).filter(Boolean);
  chosen.forEach((b, siteIndex) => {
    const sign = Math.sign(b.x) || 1;
    const front = b.z + b.depth / 2 + 3.8;
    const height = Math.min(b.h * 0.85, 76);
    const levels = Math.max(3, Math.floor(height / 11));
    const space = height / levels;
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        scaffolds.push(
          part(b.x + sx * (b.w / 2 + 2), -7 + height / 2, front + sy * 3.8, 0.65, height, 0.65),
        );
      }
    }
    for (let level = 1; level <= levels; level++) {
      const y = -7 + level * space;
      platforms.push(part(b.x, y, front, b.w + 6, 0.65, 9.4));
      warning.push(part(b.x, y + 1.2, front + 4.9, b.w + 5, 0.23, 0.35));
      braces.push(
        part(b.x - sign * (b.w / 2 + 2), y - space / 2, front + 4.5, 0.48, space * 0.72, 0.48),
      );
    }
    const crane = new T.Group();
    crane.name = 'city33-construction-crane-' + siteIndex;
    crane.userData.visualOnly = true;
    crane.position.set(b.x - sign * 13, b.h + 6, b.z);
    const mast = new T.Mesh(cube, machinery);
    mast.name = 'city33-crane-mast';
    mast.position.y = -10;
    mast.scale.set(2.2, 30, 2.2);
    const arm = new T.Mesh(cube, fineMetal);
    arm.name = 'city33-crane-jib';
    arm.position.set(sign * 16, 4, 0);
    arm.scale.set(45, 1.1, 2.2);
    const weight = new T.Mesh(cube, machinery);
    weight.position.set(-sign * 13, -1, 0);
    weight.scale.set(9, 3.5, 4);
    crane.add(mast, arm, weight);
    cranes.add(crane);
  });
  batch(site, 'city33-scaffold-verticals', fineMetal, scaffolds);
  batch(site, 'city33-scaffold-decks', machinery, platforms);
  batch(site, 'city33-scaffold-braces', fineMetal, braces);
  batch(site, 'city33-construction-safety-lights', safety, warning);
  for (let i = 0; i < 12; i++) sparks.setColorAt(i, new T.Color(i % 2 ? '#ffe9ae' : '#ffad59'));
  sparks.instanceColor.needsUpdate = true;
  site.add(cranes, sparks);
  site.userData.siteOrigins = chosen.map((b) => ({
    x: b.x,
    y: -7 + Math.min(b.h * 0.85, 76) * 0.56,
    z: b.z + b.depth / 2 + 8,
  }));
  root.add(site);
}

export function createCity33Premium(buildings = []) {
  const root = new T.Group();
  root.name = 'city33-premium-urban-life';
  root.userData.visualOnly = true;
  root.userData.phase = 0;
  architecturalDetail(root, buildings);
  elevatedBusRoute(root);
  activeConstruction(root, buildings);
  updateCity33Premium(root, 0);
  setCity33Quality(root, 'medium');
  return root;
}

export function setCity33Quality(root, quality) {
  if (!root) return;
  root.getObjectByName('city33-architecture-high').visible = quality === 'high';
  const traffic = root.getObjectByName('city33-moving-futuristic-buses');
  traffic.children.forEach((mesh) => {
    mesh.count = quality === 'high' ? 8 : 4;
  });
  root.getObjectByName('city33-welding-sparks').count = quality === 'high' ? 12 : 6;
  const cranes = root.getObjectByName('city33-animated-cranes');
  cranes.children.forEach((crane, i) => {
    crane.visible = quality === 'high' || i < 2;
  });
}

export function updateCity33Premium(root, travel) {
  if (!root || !Number.isFinite(travel)) return;
  const phase = root.userData.phase || 0;
  const { parts, cranes, sparks, origins } = animationNodes(root);
  // All four bus meshes are quality-gated together. Medium draws four,
  // High draws eight; never recompute objects hidden by the selected LOD.
  const busCount = Math.min(...parts.map((mesh) => mesh.count));
  for (let i = 0; i < busCount; i++) {
    const side = i % 2 ? 1 : -1;
    const z = -575 - ((i * 129 + travel * (0.31 + (i % 3) * 0.04) + phase * 180) % 865);
    const x = side * 66;
    const flip = side < 0 ? Math.PI : 0;
    renderObject.rotation.set(0, flip, 0);
    // Four rigid parts share the exact same transform math as the original
    // spec list, with no transient arrays or matrix clones per frame.
    renderObject.position.set(x, 18.5, z);
    renderObject.scale.set(9, 4.4, 22);
    renderObject.updateMatrix();
    parts[0].setMatrixAt(i, renderObject.matrix);
    renderObject.position.set(x, 21.1, z - 1);
    renderObject.scale.set(7.6, 2.3, 15);
    renderObject.updateMatrix();
    parts[1].setMatrixAt(i, renderObject.matrix);
    renderObject.position.set(x, 18.4, z - 11.3);
    renderObject.scale.set(6.7, 0.6, 0.45);
    renderObject.updateMatrix();
    parts[2].setMatrixAt(i, renderObject.matrix);
    renderObject.position.set(x, 22.5, z);
    renderObject.scale.set(8.3, 0.6, 17.8);
    renderObject.updateMatrix();
    parts[3].setMatrixAt(i, renderObject.matrix);
  }
  if (busCount) for (const mesh of parts) mesh.instanceMatrix.needsUpdate = true;
  cranes.forEach((crane, i) => {
    if (!crane.visible) return;
    crane.rotation.y = Math.sin(travel * 0.0018 + phase + i * 1.6) * 0.42;
  });
  for (let i = 0; i < sparks.count; i++) {
    const b = origins[Math.floor(i / 4)];
    const flicker = Math.abs(Math.sin(travel * 0.12 + i * 1.93 + phase));
    renderObject.position.set(b.x + ((i % 4) - 1.5) * 1.8, b.y + (i % 3) * 1.6 + flicker, b.z);
    renderObject.rotation.set(0, 0, 0);
    renderObject.scale.setScalar(0.2 + flicker * 0.45);
    renderObject.updateMatrix();
    sparks.setMatrixAt(i, renderObject.matrix);
  }
  if (sparks.count) sparks.instanceMatrix.needsUpdate = true;
}
