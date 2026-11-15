/**
 * Explicit lifecycle for GPU resources created exclusively by one subsystem.
 * Never recursively dispose an arbitrary scene graph: Three.js geometries,
 * materials and textures can be shared by many enemy meshes and prototypes.
 */
export function createOwnedResourceScope() {
  const resources = new Set();
  let closed = false;
  return Object.freeze({
    own(resource) {
      if (closed) throw new Error('GPU resource scope already disposed');
      if (!resource || typeof resource.dispose !== 'function') {
        throw new TypeError('Expected a disposable owned resource');
      }
      resources.add(resource);
      return resource;
    },
    dispose() {
      if (closed) return 0;
      closed = true;
      let disposed = 0;
      for (const resource of resources) {
        resource.dispose();
        disposed++;
      }
      resources.clear();
      return disposed;
    },
    stats() {
      return { closed, registered: resources.size };
    },
  });
}
