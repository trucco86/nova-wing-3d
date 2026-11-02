import test from 'node:test';
import assert from 'node:assert/strict';
import { createHudWriteGuard } from '../src/hud-write-guard.js';

function fixture() {
  const counts = {
    elements: 0,
    text: 0,
    hidden: 0,
    disabled: 0,
    style: 0,
    cssVar: 0,
    attribute: 0,
  };
  let currentText = '';
  let hidden = false;
  let disabled = false;
  const css = { width: '' };
  const attrs = new Map();
  const node = {
    get textContent() {
      return currentText;
    },
    set textContent(value) {
      counts.text++;
      currentText = value;
    },
    get hidden() {
      return hidden;
    },
    set hidden(value) {
      counts.hidden++;
      hidden = value;
    },
    get disabled() {
      return disabled;
    },
    set disabled(value) {
      counts.disabled++;
      disabled = value;
    },
    style: new Proxy(
      {
        setProperty(name, value) {
          counts.cssVar++;
          css[name] = value;
        },
        getPropertyValue(name) {
          return css[name] ?? '';
        },
      },
      {
        get(target, name) {
          if (name === 'width') return css.width;
          return target[name];
        },
        set(_target, name, value) {
          counts.style++;
          css[name] = value;
          return true;
        },
      },
    ),
    setAttribute(name, value) {
      counts.attribute++;
      attrs.set(name, value);
    },
    getAttribute(name) {
      return attrs.get(name) ?? null;
    },
  };
  const guard = createHudWriteGuard((id) => {
    counts.elements++;
    assert.equal(id, 'meter');
    return node;
  });
  return { node, guard, counts };
}

test('stable HUD text, style, visibility, attrs and inputs perform no repeated DOM writes', () => {
  const { guard, counts } = fixture();
  for (let i = 0; i < 100; i++) {
    guard.text('meter', '100');
    guard.hidden('meter', true);
    guard.disabled('meter', true);
    guard.style('meter', 'width', '100%');
    guard.cssVar('meter', '--meter', '100%');
    guard.attribute('meter', 'data-count', 3);
  }
  assert.deepEqual(counts, {
    elements: 1,
    text: 1,
    hidden: 1,
    disabled: 1,
    style: 1,
    cssVar: 1,
    attribute: 1,
  });
});

test('live DOM changes outside guard never cause stale HUD or delayed feedback', () => {
  const { guard, node, counts } = fixture();
  guard.text('meter', '3');
  guard.attribute('meter', 'data-count', 3);
  guard.style('meter', 'width', '30%');
  node.textContent = '2'; // Immediate bomb handler writes directly.
  node.setAttribute('data-count', '2');
  node.style.width = '20%';
  assert.equal(guard.text('meter', '2'), false);
  assert.equal(guard.attribute('meter', 'data-count', 2), false);
  assert.equal(guard.style('meter', 'width', '20%'), false);
  guard.text('meter', '1');
  guard.attribute('meter', 'data-count', 1);
  guard.style('meter', 'width', '10%');
  assert.equal(node.textContent, '1');
  assert.equal(node.getAttribute('data-count'), '1');
  assert.equal(node.style.width, '10%');
  assert.equal(counts.text, 3, 'only the direct input and real HUD changes wrote');
  assert.equal(counts.attribute, 3);
  assert.equal(counts.style, 3);
});

test('guard reads mock DOM attributes and rejects invalid element provider', () => {
  assert.throws(() => createHudWriteGuard(null), TypeError);
  const attrs = {};
  const node = {
    setAttribute(name, value) {
      this[name] = value;
      attrs[name] = value;
    },
  };
  const guard = createHudWriteGuard(() => node);
  assert.equal(guard.attribute('meter', 'data-count', 2), true);
  assert.equal(guard.attribute('meter', 'data-count', 2), false);
  assert.equal(attrs['data-count'], '2');
});
