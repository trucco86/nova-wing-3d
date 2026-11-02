// Reads live DOM state before mutating it. This remains correct when a gameplay
// handler (e.g. bomb/boost/skin select) writes directly between render frames.
// Cache element references only; never cache assumed text or attribute values.
export function createHudWriteGuard(getElement) {
  if (typeof getElement !== 'function') throw new TypeError('getElement required');
  const nodes = new Map();
  function element(id) {
    if (!nodes.has(id)) nodes.set(id, getElement(id));
    return nodes.get(id);
  }
  function text(id, value) {
    const node = element(id);
    const next = String(value);
    if (node.textContent === next) return false;
    node.textContent = next;
    return true;
  }
  function hidden(id, value) {
    const node = element(id);
    const next = Boolean(value);
    if (node.hidden === next) return false;
    node.hidden = next;
    return true;
  }
  function disabled(id, value) {
    const node = element(id);
    const next = Boolean(value);
    if (node.disabled === next) return false;
    node.disabled = next;
    return true;
  }
  function style(id, property, value) {
    const node = element(id);
    const next = String(value);
    if (node.style[property] === next) return false;
    node.style[property] = next;
    return true;
  }
  function cssVar(id, property, value) {
    const node = element(id);
    const next = String(value);
    const current = node.style.getPropertyValue?.(property) ?? node.style[property];
    if (current === next) return false;
    node.style.setProperty(property, next);
    return true;
  }
  function attribute(id, name, value) {
    const node = element(id);
    const next = String(value);
    const current = node.getAttribute?.(name) ?? node[name];
    // DOM getAttribute always yields strings; test adapters and direct input
    // handlers may store a numeric property on lightweight mock nodes.
    if (current !== null && current !== undefined && String(current) === next) return false;
    node.setAttribute(name, next);
    return true;
  }
  return Object.freeze({ element, text, hidden, disabled, style, cssVar, attribute });
}
