import * as T from 'three';

/**
 * Source-authored, watertight high-fidelity fighter overlay.
 * Replaces box-only detailing with actual faceted hull, swept thickness
 * and mechanical rear turbines. Rendered only in the existing HIGH tier.
 * No extra collision mesh, physics, remote asset, or gameplay changes.
 */
export function createSculptedStarfighter(model = 'nova7', paintMaterial) {
  const g = new T.Group();
  g.name = 'ship-sculpted-high-detail';
  const chassis = ['aegis', 'specter'].includes(model) ? model : 'nova7';
  const dark = new T.MeshPhysicalMaterial({
    color: '#15293b',
    metalness: 0.8,
    roughness: 0.29,
    clearcoat: 0.48,
  });
  const titanium = new T.MeshPhysicalMaterial({
    color: '#9cbbc8',
    metalness: 0.88,
    roughness: 0.24,
    clearcoat: 0.58,
  });
  const glass = new T.MeshPhysicalMaterial({
    color: '#237c9b',
    metalness: 0.28,
    roughness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    emissive: '#05374b',
    emissiveIntensity: 0.48,
  });
  const light = new T.MeshBasicMaterial({
    color: '#76eaff',
    toneMapped: false,
  });
  const materials = [dark, titanium, glass, light];
  const rotors = [];

  // Continuous multi-section fuselage with a true 3D surface and vertex normals.
  const sections = [
    [-3.65, 0.025, 0.05],
    [-3.18, 0.25, 0.2],
    [-2.65, 0.6, 0.28],
    [-1.92, 0.81, 0.38],
    [-0.95, 0.91, 0.48],
    [-0.2, 0.84, 0.46],
    [0.78, 0.9, 0.42],
    [1.56, 0.72, 0.35],
    [2.46, 0.49, 0.3],
    [2.9, 0.2, 0.14],
  ];
  const around = 16;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i < sections.length; i++) {
    const [z, width, height] = sections[i];
    for (let j = 0; j < around; j++) {
      const a = (2 * Math.PI * j) / around;
      positions.push(Math.sin(a) * width, 0.26 + Math.cos(a) * height, z);
      uvs.push(j / around, i / (sections.length - 1));
    }
  }
  for (let i = 0; i < sections.length - 1; i++) {
    for (let j = 0; j < around; j++) {
      const next = (j + 1) % around;
      const a = i * around + j;
      const c = i * around + next;
      const b = (i + 1) * around + j;
      const d = (i + 1) * around + next;
      indices.push(a, b, c, c, b, d);
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const hull = new T.Mesh(geometry, paintMaterial);
  hull.name = 'ship-sculpted-continuous-hull';
  g.add(hull);

  // Raised glass canopy and structural bridge with painted side ribs.
  const canopy = new T.Mesh(new T.SphereGeometry(0.68, 20, 12), glass);
  canopy.name = 'ship-sculpted-cockpit-glass';
  canopy.scale.set(0.79, 0.52, 1.75);
  canopy.position.set(0, 0.85, -1.37);
  g.add(canopy);
  const cockpitSpine = new T.Mesh(new T.CylinderGeometry(0.055, 0.08, 2.35, 8), titanium);
  cockpitSpine.name = 'ship-sculpted-canopy-frame';
  cockpitSpine.rotation.x = Math.PI / 2;
  cockpitSpine.position.set(0, 1.18, -1.27);
  g.add(cockpitSpine);

  const wingspan = chassis === 'specter' ? 5.45 : chassis === 'aegis' ? 4.22 : 4.75;
  const buildWing = (points, depth, bevel = 0.055) => {
    const shape = new T.Shape();
    points.forEach(([x, z], i) => {
      if (i === 0) shape.moveTo(x, z);
      else shape.lineTo(x, z);
    });
    shape.closePath();
    const wing = new T.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
      steps: 1,
      curveSegments: 2,
    });
    wing.rotateX(Math.PI / 2);
    return wing;
  };
  for (const side of [-1, 1]) {
    const contour = [
      [side * 0.73, -1.32],
      [side * 1.85, -0.72],
      [side * (wingspan - 0.68), 0.08],
      [side * wingspan, 0.63],
      [side * (wingspan - 0.12), 1.04],
      [side * (wingspan - 1.25), 1.37],
      [side * 1.25, 1.15],
    ];
    const main = new T.Mesh(buildWing(contour, 0.24), paintMaterial);
    main.name = 'ship-sculpted-swept-wing';
    main.position.y = 0.46;
    g.add(main);

    const spine = new T.Mesh(buildWing([
      [side * 1.7, -0.15],
      [side * (wingspan - 0.65), 0.53],
      [side * (wingspan - 1.38), 0.83],
      [side * 2.0, 0.63],
    ], 0.09, 0.026), dark);
    spine.name = 'ship-sculpted-wing-recess';
    spine.position.y = 0.61;
    g.add(spine);

    // Mechanical articulated panel ribs; three per wing, not opaque boxes.
    for (let i = 0; i < 3; i++) {
      const x = side * (2.2 + i * 0.63);
      const rib = new T.Mesh(
        new T.CylinderGeometry(0.045, 0.075, 0.75 - i * 0.07, 8),
        titanium,
      );
      rib.rotation.x = Math.PI / 2;
      rib.rotation.z = side * 0.22;
      rib.position.set(x, 0.7, 0.34 + i * 0.1);
      rib.name = 'ship-sculpted-armor-rib';
      g.add(rib);
    }

    // High-resolution, open nacelle: multiple spaced elements show silhouette depth.
    const base = side * (chassis === 'aegis' ? 1.65 : 1.26);
    const nacelle = new T.Mesh(new T.CylinderGeometry(0.46, 0.54, 2.1, 20), dark);
    nacelle.name = 'ship-sculpted-engine-nacelle';
    nacelle.rotation.x = Math.PI / 2;
    nacelle.position.set(base, -0.22, 2.05);
    g.add(nacelle);
    for (const [k, radius] of [0.54, 0.49, 0.38].entries()) {
      const ring = new T.Mesh(new T.TorusGeometry(radius, 0.052, 8, 28), k === 2 ? light : titanium);
      ring.name = 'ship-sculpted-exhaust-ring';
      ring.position.set(base, -0.22, 2.82 + k * 0.15);
      g.add(ring);
    }
    const rotor = new T.Group();
    rotor.name = 'ship-sculpted-engine-rotor';
    rotor.position.set(base, -0.22, 2.93);
    for (let i = 0; i < 6; i++) {
      const fin = new T.Mesh(new T.BoxGeometry(0.09, 0.32, 0.08), titanium);
      fin.position.y = 0.2;
      fin.rotation.z = -0.24;
      const pivot = new T.Group();
      pivot.rotation.z = (i * Math.PI) / 3;
      pivot.add(fin);
      rotor.add(pivot);
    }
    rotors.push(rotor);
    g.add(rotor);
  }
  return { group: g, rotors, materials };
}
