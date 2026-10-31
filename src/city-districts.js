import * as T from 'three';

// City 2.4 architectural districts deliberately have no physics colliders.
// Instancing keeps the city recognizable in Medium without spawning hundreds
// of standalone Mesh draw calls. Coordinates are relative to a 1,900-unit tile.
export function createCityDistricts() {
  const group = new T.Group();
  group.name = 'city-architectural-districts';
  const premium = new T.Group();
  premium.name = 'city-district-high-details';
  premium.visible = false;
  const unit = new T.BoxGeometry(1, 1, 1);
  const frame = new T.MeshStandardMaterial({
    color: '#527d9b',
    metalness: 0.74,
    roughness: 0.42,
  });
  const cap = new T.MeshStandardMaterial({
    color: '#96bfd2',
    metalness: 0.76,
    roughness: 0.34,
  });
  const lowLight = new T.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
  const highLight = new T.MeshBasicMaterial({ color: '#92eff1', toneMapped: false });
  const amber = new T.MeshBasicMaterial({ color: '#ffca87', toneMapped: false });
  const bodyMesh = new T.InstancedMesh(unit, frame, 125);
  bodyMesh.name = 'city-district-towers-and-infrastructure';
  const trimMesh = new T.InstancedMesh(unit, cap, 125);
  trimMesh.name = 'city-district-crowns-and-gantries';
  const lightMesh = new T.InstancedMesh(unit, lowLight, 130);
  lightMesh.name = 'city-district-wayfinding-lights';
  const premiumWindows = new T.InstancedMesh(unit, highLight, 190);
  premiumWindows.name = 'city-district-premium-windows';
  const premiumAccents = new T.InstancedMesh(unit, amber, 105);
  premiumAccents.name = 'city-district-premium-accents';
  const matrix = new T.Object3D();
  const counts = { bodies: 0, trim: 0, lights: 0, windows: 0, accents: 0 };

  function place(mesh, counter, x, y, z, w, h, d) {
    const i = counts[counter]++;
    if (i >= mesh.instanceMatrix.count) throw new Error('City district instance budget exceeded');
    matrix.position.set(x, y, z);
    matrix.scale.set(w, h, d);
    matrix.rotation.set(0, 0, 0);
    matrix.updateMatrix();
    mesh.setMatrixAt(i, matrix.matrix);
  }

  // Visually different districts: dense illuminated commercial spires near the
  // launch, bulky production gantries mid-stage, and broad orbital pads later.
  const districts = [
    { name: 'commerce', z: -300, base: 83, tone: 0 },
    { name: 'industrial', z: -885, base: 115, tone: 1 },
    { name: 'spaceport', z: -1490, base: 69, tone: 2 },
  ];
  for (const district of districts) {
    const marker = new T.Group();
    marker.name = 'city-district-' + district.name;
    marker.userData.district = district.name;
    marker.position.z = district.z;
    group.add(marker);
    for (const side of [-1, 1]) {
      for (let lane = 0; lane < 4; lane++) {
        const x = side * (121 + lane * 43);
        const z = district.z - 54 + lane * 30;
        const height = district.base + ((lane * 29 + (side + 1) * 9 + district.tone * 17) % 56);
        const width =
          district.name === 'industrial'
            ? 30 + lane * 3
            : district.name === 'spaceport'
              ? 42
              : 18 + lane * 3;
        const topHeight = district.name === 'spaceport' ? 10 : 6;
        place(bodyMesh, 'bodies', x, height / 2 - 7, z, width, height, 29);
        place(trimMesh, 'trim', x, height - 7, z, width * 0.88, topHeight, 31);
        // Side-lit vertical features mark the district's identity without
        // duplicating the base city's many hundreds of windows.
        place(
          lightMesh,
          'lights',
          x - side * (width / 2 + 0.3),
          height * 0.47 - 7,
          z + 15.4,
          0.7,
          height * 0.52,
          0.7,
        );
        place(
          lightMesh,
          'lights',
          x,
          height - topHeight / 2 - 6.6,
          z + 16.1,
          width * 0.7,
          0.45,
          0.5,
        );
        for (let row = 0; row < 5; row++) {
          const yy = height * (0.18 + row * 0.14) - 7;
          place(premiumWindows, 'windows', x, yy, z + 15.5, width * 0.62, 0.9, 0.5);
        }
        if (district.name === 'commerce') {
          place(premiumAccents, 'accents', x, height + 2, z + 13.2, width * 0.3, 1.7, 1.8);
        } else if (district.name === 'industrial') {
          place(trimMesh, 'trim', x + side * (width * 0.24), height + 9, z - 4, 5, 20, 5);
          place(
            premiumAccents,
            'accents',
            x + side * (width * 0.24),
            height + 20,
            z - 4,
            5,
            1.7,
            5,
          );
        } else {
          // Wide tiered launch platforms and raised fuel gantries remain outside
          // the gameplay corridor, not floating over the player.
          place(bodyMesh, 'bodies', x - side * 13, 9, z + 25, 47, 5, 49);
          place(lightMesh, 'lights', x - side * 13, 12.5, z + 25, 36, 0.6, 38);
          place(
            premiumAccents,
            'accents',
            x + side * (width * 0.28),
            height + 8,
            z - 8,
            1.7,
            16,
            1.7,
          );
        }
      }
    }
  }

  // Maglev platforms sit parallel to (and on the OUTER side of) the ±80 rails.
  // Shared unit geometry, no gameplay hitboxes, and roof above train clearance.
  function station(side, z) {
    const stationGroup = new T.Group();
    stationGroup.name = side < 0 ? 'city-maglev-station-west' : 'city-maglev-station-east';
    stationGroup.position.set(side * 80, 0, z);
    stationGroup.userData.district = 'transit';
    const add = (material, x, y, zz, w, h, d) => {
      const mesh = new T.Mesh(unit, material);
      mesh.position.set(x, y, zz);
      mesh.scale.set(w, h, d);
      stationGroup.add(mesh);
      return mesh;
    };
    add(frame, side * 11, 28.8, 0, 19, 2.5, 86); // boarding deck
    add(cap, side * 18, 47.5, 0, 27, 3, 89); // station canopy
    add(lowLight, side * 18, 49.3, 0, 19, 0.65, 84); // platform sign
    add(lowLight, side * 10.2, 31, 0, 0.8, 0.75, 78); // track-side warning strip
    for (const offset of [-34, 34]) {
      add(frame, side * 27, 36.5, offset, 3.5, 21, 3.5);
      add(cap, side * 18, 44, offset, 21, 1.6, 2);
    }
    group.add(stationGroup);
    return stationGroup;
  }
  station(-1, -585);
  station(1, -1315);

  // Street identifiers on Medium get cyan, warm amber and magenta accents
  // without new materials, lights or draw calls.
  const urbanColors = ['#4af8ff', '#ff8bd0', '#ffd38a', '#7effdf'].map((c) => new T.Color(c));
  for (let i = 0; i < counts.lights; i++) {
    lightMesh.setColorAt(i, urbanColors[(i * 3 + Math.floor(i / 6)) % urbanColors.length]);
  }
  if (lightMesh.instanceColor) lightMesh.instanceColor.needsUpdate = true;
  for (const [mesh, countKey, dest] of [
    [bodyMesh, 'bodies', group],
    [trimMesh, 'trim', group],
    [lightMesh, 'lights', group],
    [premiumWindows, 'windows', premium],
    [premiumAccents, 'accents', premium],
  ]) {
    mesh.count = counts[countKey];
    mesh.instanceMatrix.needsUpdate = true;
    dest.add(mesh);
  }
  group.add(premium);
  group.userData.districts = districts.map((x) => x.name);
  return group;
}
