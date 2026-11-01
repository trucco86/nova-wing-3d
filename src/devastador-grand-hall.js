import * as T from 'three';

// An authored, colossal interior chamber for the Devastador sabotage climax.
// The central orbit is clear: every structural machine is outside the playable
// envelope, while the reactor remains in the center of the chamber.
export const DEVASTADOR_GRAND_HALL = Object.freeze({
  radius: 240,
  safeOrbitRadius: 190,
  floorY: -83,
  ceilingY: 129,
  reactorRadius: 65,
  wallSegments: 20,
  minMachineryRadius: 208,
});

export function createDevastadorGrandHall() {
  const hall = new T.Group();
  hall.name = 'devastador-colossal-reactor-hall';
  hall.userData.visualOnly = true;
  const ownedMaterials = [];
  const mat = (color, luminous = false) => {
    const m = luminous
      ? new T.MeshBasicMaterial({ color, toneMapped: false, side: T.DoubleSide })
      : new T.MeshStandardMaterial({
          color,
          roughness: 0.38,
          metalness: 0.87,
          side: T.DoubleSide,
        });
    ownedMaterials.push(m);
    return m;
  };
  const dark = mat('#101d2c');
  const hull = mat('#2d435b');
  const plate = mat('#516a7d');
  const chrome = mat('#8ca8b4');
  const blue = mat('#2cbbe8', true);
  const amber = mat('#ff9a3d', true);
  const warning = mat('#f34b3d', true);
  const geo = new T.BoxGeometry(1, 1, 1);
  const cylinder = new T.CylinderGeometry(1, 1, 1, 18);
  const round = new T.TorusGeometry(1, 0.055, 6, 36);
  const visualMeshes = [];
  const createBox = (parent, name, material, x, y, z, sx, sy, sz, yaw = 0) => {
    const mesh = new T.Mesh(geo, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.rotation.y = yaw;
    mesh.userData.visualOnly = true;
    parent.add(mesh);
    visualMeshes.push(mesh);
    return mesh;
  };
  // Full floor and ceiling with annular service decks. They are visual-only:
  // the cockpit never collides with artificial planes on the orbital path.
  const deck = new T.Mesh(
    new T.RingGeometry(
      DEVASTADOR_GRAND_HALL.reactorRadius + 23,
      DEVASTADOR_GRAND_HALL.radius + 12,
      64,
    ),
    dark,
  );
  deck.name = 'devastador-grand-hall-deep-service-floor';
  deck.rotation.x = -Math.PI / 2;
  deck.position.y = DEVASTADOR_GRAND_HALL.floorY;
  deck.userData.visualOnly = true;
  hall.add(deck);
  const ceiling = new T.Mesh(new T.RingGeometry(90, DEVASTADOR_GRAND_HALL.radius + 12, 64), hull);
  ceiling.name = 'devastador-grand-hall-vaulted-ceiling';
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = DEVASTADOR_GRAND_HALL.ceilingY;
  ceiling.userData.visualOnly = true;
  hall.add(ceiling);

  // Twenty large perimeter bulkheads; the near side has an open hangar throat.
  // Nothing may intrude into the inner 190-unit swept orbit.
  for (let i = 0; i < DEVASTADOR_GRAND_HALL.wallSegments; i++) {
    const a = (i / DEVASTADOR_GRAND_HALL.wallSegments) * Math.PI * 2;
    const x = Math.sin(a) * DEVASTADOR_GRAND_HALL.radius;
    const z = Math.cos(a) * DEVASTADOR_GRAND_HALL.radius;
    const isEntrance = i === 0 || i === 1 || i === DEVASTADOR_GRAND_HALL.wallSegments - 1;
    if (!isEntrance) {
      createBox(hall, 'hall-perimeter-armor-wall', hull, x, 22, z, 73, 193, 12, a);
      createBox(hall, 'hall-observation-deck', plate, x * 0.965, 52, z * 0.965, 64, 6, 22, a);
      // Distinct indicator buses, recessed into wall panels.
      createBox(
        hall,
        'hall-wall-energy-bus',
        i % 4 ? blue : amber,
        x * 0.968,
        63,
        z * 0.968,
        47,
        1.2,
        1.5,
        a,
      );
    }
    createBox(
      hall,
      isEntrance ? 'hall-entrance-giant-pillar' : 'hall-structural-column',
      chrome,
      x,
      20,
      z,
      13,
      215,
      17,
      a,
    );
    createBox(hall, 'hall-overhead-beam', plate, x * 0.83, 119, z * 0.83, 13, 11, 62, a);
  }
  const entrance = createBox(
    hall,
    'hall-open-hangar-throat-gantry',
    chrome,
    0,
    113,
    DEVASTADOR_GRAND_HALL.radius - 5,
    145,
    15,
    24,
  );
  entrance.userData.entrance = true;

  // Four unmistakable facilities instead of a wallpaper of identical panels:
  // power distribution, cryocooling, engine works, and control/diagnostics.
  const sectors = [
    { name: 'capacitor-farm', a: -2.36, color: amber },
    { name: 'cryo-refrigeration-works', a: -0.78, color: blue },
    { name: 'twin-propulsion-works', a: 0.78, color: warning },
    { name: 'systems-bridge-control', a: 2.36, color: blue },
  ];
  const movable = [];
  const facilityGroups = [];
  for (const sector of sectors) {
    const facility = new T.Group();
    facility.name = 'hall-facility-' + sector.name;
    facility.position.set(Math.sin(sector.a) * 223, 0, Math.cos(sector.a) * 223);
    facility.rotation.y = sector.a;
    facility.userData.visualOnly = true;
    hall.add(facility);
    facilityGroups.push(facility);
    createBox(facility, 'facility-heavy-hydraulic-foundation', dark, 0, -33, 0, 69, 17, 34);
    createBox(facility, 'facility-raised-industrial-deck', plate, 0, -21, 0, 64, 4, 30);
    createBox(facility, 'facility-overhead-service-crane', chrome, 0, 97, 0, 64, 6, 17);
    for (const side of [-1, 1]) {
      createBox(facility, 'facility-gantry-pylon', hull, side * 28, 25, 4, 7, 131, 12);
      createBox(
        facility,
        'facility-diagnostic-monitor',
        sector.color,
        side * 23,
        30,
        -17.1,
        19,
        11,
        1.3,
      );
    }
    if (sector.name === 'capacitor-farm') {
      for (let k = 0; k < 4; k++) {
        const x = -23 + k * 15;
        const bank = new T.Mesh(cylinder, plate);
        bank.name = 'hall-capacitor-megacoil-' + k;
        bank.scale.set(5, 49, 5);
        bank.position.set(x, 22, 6);
        facility.add(bank);
        const coil = new T.Mesh(round, amber);
        coil.name = 'hall-capacitor-induction-bus';
        coil.scale.set(6, 6, 1);
        coil.rotation.x = Math.PI / 2;
        coil.position.set(x, 44, 6);
        facility.add(coil);
      }
    } else if (sector.name === 'cryo-refrigeration-works') {
      for (let k = 0; k < 3; k++) {
        const x = -21 + k * 20;
        createBox(facility, 'hall-cryogenic-heat-exchanger', chrome, x, 17, 4, 15, 75, 14);
        for (let pipe = 0; pipe < 3; pipe++)
          createBox(
            facility,
            'hall-coolant-translucent-pipe',
            blue,
            x - 4 + pipe * 4,
            28,
            -5,
            1.4,
            49,
            1.4,
          );
      }
    } else if (sector.name === 'twin-propulsion-works') {
      for (const side of [-1, 1]) {
        const engine = new T.Mesh(new T.CylinderGeometry(19, 22, 42, 20), hull);
        engine.name = 'hall-colossal-engine-housing';
        engine.rotation.x = Math.PI / 2;
        engine.position.set(side * 17, 20, 0);
        facility.add(engine);
        const rotor = new T.Group();
        rotor.name = 'hall-engine-turbine-rotor';
        rotor.position.set(side * 17, 20, -25);
        for (let k = 0; k < 8; k++) {
          const blade = createBox(rotor, 'hall-turbine-radial-blade', chrome, 0, 9, 0, 3, 13, 1.4);
          blade.rotation.z = (k * Math.PI) / 4;
          blade.position.set(Math.cos((k * Math.PI) / 4) * 8, Math.sin((k * Math.PI) / 4) * 8, 0);
        }
        movable.push(rotor);
        facility.add(rotor);
        const nozzle = new T.Mesh(new T.TorusGeometry(21, 2.2, 8, 28), warning);
        nozzle.name = 'hall-engine-ignition-ring';
        nozzle.position.copy(rotor.position);
        facility.add(nozzle);
      }
    } else {
      createBox(facility, 'hall-bridge-control-platform', hull, 0, 38, 1, 60, 14, 31);
      createBox(facility, 'hall-bridge-hologram-table', blue, 0, 49, -12, 31, 2, 17);
      for (let k = 0; k < 5; k++)
        createBox(
          facility,
          'hall-bridge-systems-console',
          k % 2 ? blue : amber,
          -24 + k * 12,
          25,
          -16,
          9,
          8,
          2,
        );
    }
  }

  // Instanced strips + armor fasteners give the walls industrial scale on mobile.
  // The renderer sees only two extra draw calls, not 200 individual bolts.
  const fastener = new T.InstancedMesh(geo, chrome, 160);
  fastener.name = 'hall-structural-fasteners-instanced';
  const cable = new T.InstancedMesh(geo, blue, 100);
  cable.name = 'hall-perimeter-energy-traces-instanced';
  const helper = new T.Object3D();
  for (let i = 0; i < 160; i++) {
    const a = ((i % 20) / 20) * Math.PI * 2;
    const radial = 238;
    helper.position.set(Math.sin(a) * radial, -45 + Math.floor(i / 20) * 22, Math.cos(a) * radial);
    helper.rotation.set(0, a, 0);
    helper.scale.set(3, 5.2, 1.4);
    helper.updateMatrix();
    fastener.setMatrixAt(i, helper.matrix);
  }
  for (let i = 0; i < 100; i++) {
    const a = ((i % 20) / 20) * Math.PI * 2;
    helper.position.set(Math.sin(a) * 230, -52 + Math.floor(i / 20) * 26, Math.cos(a) * 230);
    helper.rotation.set(0, a, 0);
    helper.scale.set(37, 1.3, 1.4);
    helper.updateMatrix();
    cable.setMatrixAt(i, helper.matrix);
  }
  fastener.instanceMatrix.needsUpdate = true;
  cable.instanceMatrix.needsUpdate = true;
  fastener.userData.visualOnly = true;
  cable.userData.visualOnly = true;
  hall.add(fastener, cable);
  hall.userData = {
    visualOnly: true,
    fixedToChamber: true,
    radius: DEVASTADOR_GRAND_HALL.radius,
    safeOrbitRadius: DEVASTADOR_GRAND_HALL.safeOrbitRadius,
    minMachineryRadius: DEVASTADOR_GRAND_HALL.minMachineryRadius,
    walls: DEVASTADOR_GRAND_HALL.wallSegments - 3,
    facilities: facilityGroups,
    rotors: movable,
    visualMeshes,
    materials: ownedMaterials,
  };
  return hall;
}

export function updateDevastadorGrandHall(
  hall,
  { time = 0, driveSpeed = 1, blackout = 0 } = {},
) {
  if (!hall) return;
  // The pilot now physically circles the chamber. No artificial rotation
  // of the reactor, architecture or scenery is allowed.
  hall.rotation.y = 0;
  hall.userData.rotors.forEach((r, i) => {
    r.rotation.z = time * (i % 2 ? -1 : 1) * 1.55 * driveSpeed;
  });
  hall.userData.facilities.forEach((group, i) => {
    // Power loss cascades across peripheral factories rather than merely hiding core meshes.
    const fault = blackout > 0.1 && Math.sin(time * 7 + i * 1.4) > 0.65 + blackout * 0.18;
    for (const obj of group.children)
      if (obj.name === 'facility-diagnostic-monitor') obj.visible = !fault;
  });
}
