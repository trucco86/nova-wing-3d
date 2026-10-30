import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('premium NOVA-7 is a real embedded glTF 2.0 binary with six authored PBR surface classes', async () => {
  const encoded = (await readFile('src/assets/nova7-hero.glb.base64', 'utf8')).trim();
  const binary = Buffer.from(encoded, 'base64');
  assert.equal(binary.toString('ascii', 0, 4), 'glTF');
  assert.equal(binary.readUInt32LE(4), 2);
  assert.equal(binary.readUInt32LE(8), binary.byteLength);
  const jsonLength = binary.readUInt32LE(12);
  assert.equal(binary.readUInt32LE(16), 0x4e4f534a);
  const gltf = JSON.parse(binary.subarray(20, 20 + jsonLength).toString('utf8'));
  const binHeader = 20 + jsonLength;
  assert.equal(binary.readUInt32LE(binHeader + 4), 0x004e4942);
  assert.equal(binary.readUInt32LE(binHeader), gltf.buffers[0].byteLength);
  assert.deepEqual(gltf.scenes[0].nodes, [0]);
  assert.equal(gltf.materials.length, 6);
  assert.deepEqual(
    gltf.materials.map((m) => m.name),
    [
      'NOVA7_PAINT',
      'NOVA7_GRAPHITE',
      'NOVA7_TITANIUM',
      'NOVA7_CANOPY',
      'NOVA7_CYAN',
      'NOVA7_AMBER',
    ],
  );
  assert.equal(gltf.meshes[0].primitives.length, 6);
  let totalTriangles = 0;
  for (const primitive of gltf.meshes[0].primitives) {
    assert.equal(primitive.mode, 4);
    const positions = gltf.accessors[primitive.attributes.POSITION];
    const normals = gltf.accessors[primitive.attributes.NORMAL];
    assert.equal(positions.count, normals.count);
    assert.equal(positions.count % 3, 0);
    assert.ok(positions.min.every(Number.isFinite));
    assert.ok(positions.max.every(Number.isFinite));
    for (const id of [primitive.attributes.POSITION, primitive.attributes.NORMAL]) {
      const view = gltf.bufferViews[gltf.accessors[id].bufferView];
      assert.ok(view.byteOffset % 4 === 0 && view.byteLength === gltf.accessors[id].count * 12);
      assert.ok(view.byteOffset + view.byteLength <= gltf.buffers[0].byteLength);
    }
    totalTriangles += positions.count / 3;
  }
  assert.ok(totalTriangles >= 1500, 'asset must have significantly denser physical geometry');
  assert.ok(
    binary.byteLength < 650000,
    'offline WebGL GLB must be small enough for HTML embedding',
  );
});
