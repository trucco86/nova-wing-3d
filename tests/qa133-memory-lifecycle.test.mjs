import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createOwnedResourceScope } from '../src/owned-resource-scope.js';
import { createGpuMemoryAudit, formatGpuMemoryAudit } from '../src/gpu-memory-audit.js';
import { postProcessor } from '../src/visuals.js';

function rendererMemory(geometries, textures, programs) {
  return {
    info: {
      memory: { geometries, textures },
      programs: programs === null ? null : Array.from({ length: programs }, () => ({})),
    },
  };
}

test('GPU owner frees only explicitly registered resources, once', () => {
  const owner = createOwnedResourceScope();
  const released = [];
  const shared = {
    dispose() {
      released.push('shared (must never run)');
    },
  };
  const first = {
    dispose() {
      released.push('first');
    },
  };
  const second = {
    dispose() {
      released.push('second');
    },
  };
  owner.own(first);
  owner.own(first);
  owner.own(second);
  assert.deepEqual(owner.stats(), { closed: false, registered: 2 });
  assert.equal(owner.dispose(), 2);
  assert.equal(owner.dispose(), 0);
  assert.deepEqual(released, ['first', 'second']);
  assert.ok(shared.dispose);
  assert.deepEqual(owner.stats(), { closed: true, registered: 0 });
  assert.throws(() => owner.own(first), /already disposed/);
  assert.throws(() => createOwnedResourceScope().own(null), TypeError);
});

test('compositor owns render targets, shaders and fullscreen quad, never gameplay scene', () => {
  const scene = new T.Scene();
  const fighter = new T.Mesh(new T.BoxGeometry(2, 3, 4), new T.MeshStandardMaterial());
  scene.add(fighter);
  let sharedDisposes = 0;
  fighter.geometry.addEventListener('dispose', () => sharedDisposes++);
  fighter.material.addEventListener('dispose', () => sharedDisposes++);
  const renderer = {
    extensions: { has: () => false },
    info: { render: { calls: 0, triangles: 0 } },
    getPixelRatio: () => 1,
    setRenderTarget() {},
    render() {},
  };
  const post = postProcessor(renderer, scene, new T.PerspectiveCamera(), { coarsePointer: false });
  post.setGraphicsQuality('high');
  post.resize(390, 844);
  assert.equal(post.destroy(), 6, '3 targets, 2 shader materials, 1 fullscreen quad');
  assert.equal(post.destroy(), 0, 'destroy is idempotent');
  assert.equal(sharedDisposes, 0, 'the live enemy and its shared resources remain untouched');
  assert.equal(fighter.parent, scene);
  fighter.geometry.dispose();
  fighter.material.dispose();
});

test('audit exposes renderer resource counters and deltas, not invented GPU VRAM bytes', () => {
  const audit = createGpuMemoryAudit();
  assert.equal(audit.report().samples, 0);
  assert.equal(audit.capture(null), null);
  assert.equal(audit.capture({ info: { memory: { geometries: -1, textures: 5 } } }), null);
  audit.capture(rendererMemory(120, 34, 12), { phase: 'start', sector: 1 });
  audit.capture(rendererMemory(150, 41, 13), { phase: 'city', sector: 1 });
  audit.capture(rendererMemory(122, 35, 12), { phase: 'after-cleanup', sector: 2 });
  const report = audit.report();
  assert.equal(report.samples, 3);
  assert.deepEqual(report.delta, {
    geometries: 2,
    textures: 1,
    programs: 0,
    jsHeapBytes: null,
  });
  assert.equal(report.peak.geometries, 150);
  assert.equal(report.latest.phase, 'after-cleanup');
  assert.match(formatGpuMemoryAudit(report), /Geometrias: 122 \(\+2\)/);
  assert.match(formatGpuMemoryAudit(report, { language: 'en' }), /counts, not MB/);
  assert.match(formatGpuMemoryAudit(report, { language: 'es' }), /conteos, no MB/);
  assert.ok(
    !Object.hasOwn(report, 'vramBytes'),
    'GPU memory usage is not inferred from resource counts',
  );
  audit.clear();
  assert.equal(audit.report().samples, 0);
});

test('cyclic changes expose retained resources without confusing a peak with a leak', () => {
  const audit = createGpuMemoryAudit({ capacity: 4 });
  for (const [geometries, textures, phase] of [
    [90, 14, 'sector-1'],
    [180, 32, 'sector-1-peak'],
    [93, 15, 'sector-2'],
    [220, 39, 'sector-2-peak'],
    [95, 15, 'sector-3'],
  ])
    audit.capture(rendererMemory(geometries, textures, null), { phase });
  const r = audit.report();
  assert.equal(r.samples, 4);
  assert.equal(r.baseline.geometries, 180, 'bounded history removes oldest snapshot');
  assert.equal(r.latest.geometries, 95);
  assert.equal(r.peak.geometries, 220);
  assert.equal(r.latest.programs, null);
  assert.equal(r.delta.programs, null);
  assert.equal(r.delta.geometries, -85);
});

test('JS heap is optional and is never presented as VRAM', () => {
  const audit = createGpuMemoryAudit();
  audit.capture(rendererMemory(1, 1, 0), { jsHeapBytes: 1024 * 1024 });
  audit.capture(rendererMemory(1, 1, 0), { jsHeapBytes: 3 * 1024 * 1024 });
  assert.equal(audit.report().delta.jsHeapBytes, 2 * 1024 * 1024);
  assert.match(formatGpuMemoryAudit(audit.report()), /Heap JS.*3\.0 MiB/);
  assert.throws(() => createGpuMemoryAudit({ capacity: 1 }), RangeError);
  assert.throws(() => createGpuMemoryAudit({ capacity: 2000 }), RangeError);
});
