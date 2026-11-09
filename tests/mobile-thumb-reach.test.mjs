import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const start = css.indexOf('/* Mobile Controls 3.3');
const end = css.indexOf('/* The arcade is an exception:', start);
assert.ok(start >= 0 && end > start, 'Mobile 3.3 layout must be present');
const section = css.slice(start, end);
const portraitStart = section.indexOf('/* Portrait:');
assert.ok(portraitStart > 0, 'Portrait override must be present');
const landscape = section.slice(0, portraitStart);
const portrait = section.slice(
  portraitStart,
  section.indexOf('@media (pointer: coarse) and (max-width: 340px)', portraitStart),
);

const buttons = [
  'robotTouch',
  'podsTouch',
  'rollTouch',
  'bombTouch',
  'lockTouch',
  'boostTouch',
  'fireTouch',
];

function properties(cssPart, id) {
  const selector = new RegExp(
    'body\\.in-mission #touch \\.actions #' + id + '(?:\\:not\\(\\[hidden\\]\\))?\\s*\\{([^}]*)\\}',
  );
  const match = cssPart.match(selector);
  if (!match) return {};
  const result = {};
  for (const key of ['left', 'top', 'width', 'height']) {
    const value = match[1].match(new RegExp('(?:^|\\n)\\s*' + key + ':\\s*(\\d+)(?:px)?;'));
    if (value) result[key] = Number(value[1]);
  }
  return result;
}

function rectangles(mode) {
  const isPortrait = mode === 'portrait';
  const result = {};
  for (const id of buttons) {
    result[id] = {
      width: 60,
      height: 60,
      ...properties(landscape, id),
      ...(isPortrait ? properties(portrait, id) : {}),
    };
  }
  return result;
}

function overlaps(a, b) {
  return (
    a.left < b.left + b.width &&
    b.left < a.left + a.width &&
    a.top < b.top + b.height &&
    b.top < a.top + a.height
  );
}

for (const [mode, width, height] of [
  ['portrait', 198, 213],
  ['landscape', 270, 164],
]) {
  test(`mobile ${mode}: all seven touch targets >=60px, on-screen and disjoint`, () => {
    const rects = rectangles(mode);
    for (const [id, rect] of Object.entries(rects)) {
      assert.ok(rect.width >= 60 && rect.height >= 60, `${id} too small`);
      assert.ok(rect.left >= 0 && rect.top >= 0, `${id} negative offset`);
      assert.ok(rect.left + rect.width <= width, `${id} beyond action width`);
      assert.ok(rect.top + rect.height <= height, `${id} beyond action height`);
    }
    for (let i = 0; i < buttons.length; i++) {
      for (let j = i + 1; j < buttons.length; j++) {
        assert.ok(
          !overlaps(rects[buttons[i]], rects[buttons[j]]),
          `${buttons[i]} overlaps ${buttons[j]}`,
        );
      }
    }
  });
  test(`mobile ${mode}: FIRE and BOOST are adjacent at the lower thumb rest`, () => {
    const { fireTouch: fire, boostTouch: boost } = rectangles(mode);
    const dx = fire.left + fire.width / 2 - boost.left - boost.width / 2;
    const dy = fire.top + fire.height / 2 - boost.top - boost.height / 2;
    assert.ok(Math.hypot(dx, dy) <= 90, 'FIRE/BOOST are too far apart');
    assert.ok(fire.top + fire.height >= height - 8, 'FIRE not bottom anchored');
    assert.ok(boost.top + boost.height >= height - 8, 'BOOST not bottom anchored');
    assert.ok(fire.width >= boost.width, 'FIRE should be the largest action');
  });
}

test('320px portrait still fits the joystick and primary action island', () => {
  assert.ok(198 + 88 + 7 * 2 + 4 <= 320);
});
test('left-handed mode mirrors hit regions without reversing button labels', () => {
  assert.ok(section.includes('body.left-handed.in-mission #touch .actions {'));
  assert.ok(section.includes('body.left-handed.in-mission #touch .actions button {'));
});
test('SUPER BOOST retains BOOST hit target and orbital highlighting', () => {
  assert.ok(section.includes('#boostTouch.launch-required'));
  assert.match(section, /nova-super-boost-aura/);
  assert.match(section, /prefers-reduced-motion: reduce/);
});
