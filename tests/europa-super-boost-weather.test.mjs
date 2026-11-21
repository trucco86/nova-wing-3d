import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { europaDescentAt } from '../src/europa-descent.js';
import { destinationArrivalAt } from '../src/destination-arrival.js';
import { createDestinationVista, updateDestinationVista } from '../src/destination-vista.js';
import {
  europaWeatherAt,
  createEuropaSurface,
  updateEuropaSurface,
} from '../src/europa-surface.js';
import { addEuropaEnemyIceSkin } from '../src/europa-enemy-ice-skin.js';

test('Europa super boost makes the moon grow and approach while consuming no scripted input', () => {
  const before = europaDescentAt(0);
  const during = europaDescentAt(3);
  const near = europaDescentAt(5.9);
  assert.equal(before.approachBoost, true);
  assert.equal(during.approachBoost, true);
  assert.equal(near.approachBoost, true);
  assert.ok(before.planetScale < during.planetScale);
  assert.ok(during.planetScale < near.planetScale);
  assert.ok(before.planetZ < during.planetZ);
  assert.ok(during.planetZ < near.planetZ);
  assert.ok(during.approachBoostVisual > 0.75);
  assert.equal(europaDescentAt(6).approachBoost, false);
  assert.equal(europaDescentAt(6).approachBoostVisual, 0);
  assert.equal(europaDescentAt(8).planetOpacity, 0);
  assert.equal(destinationArrivalAt(5, 3).globeZ, during.planetZ);
});

test('automatic super boost draws only one deterministic white speed-streak batch', () => {
  const root = createDestinationVista(5);
  const streaks = root.getObjectByName('europa-orbital-super-boost-streaks');
  const globe = root.getObjectByName('destination-celestial-body');
  assert.ok(streaks?.isLineSegments);
  assert.equal(streaks.userData.visualOnly, true);
  assert.equal(streaks.geometry.getAttribute('position').count, 152);
  assert.equal(streaks.visible, false);
  updateDestinationVista(root, 5, 3);
  assert.equal(streaks.visible, true);
  assert.ok(streaks.material.opacity > 0.3);
  assert.equal(globe.position.z, europaDescentAt(3).planetZ);
  assert.ok(globe.scale.x > europaDescentAt(0).planetScale);
  const initialZ = streaks.position.z;
  updateDestinationVista(root, 5, 4);
  assert.ok(streaks.position.z > initialZ);
  updateDestinationVista(root, 5, 3);
  assert.equal(streaks.position.z, initialZ, 'clock-based VFX replay must be deterministic');
  updateDestinationVista(root, 5, 8);
  assert.equal(streaks.visible, false);
  assert.equal(globe.visible, false);
  assert.equal(createDestinationVista(4).getObjectByName('europa-orbital-super-boost-streaks'), undefined);
});

test('three bounded weather windows add snow without hiding the whole Europa mission', () => {
  for (const second of [0, 10, 24, 39, 44, 62, 69, 84, 90]) {
    const weather = europaWeatherAt(second);
    assert.equal(weather.phase, 'clear');
    assert.equal(weather.active, false);
    assert.equal(weather.intensity, 0);
  }
  for (const [second, phase] of [[28, 'light-snow'], [53, 'ice-squall'], [75, 'light-snow']]) {
    const weather = europaWeatherAt(second);
    assert.equal(weather.phase, phase);
    assert.equal(weather.active, true);
    assert.ok(weather.intensity > 0.4 && weather.intensity <= 1);
    assert.deepEqual(weather, europaWeatherAt(second), 'no random weather on pause or replay');
  }
  assert.throws(() => europaWeatherAt(-1), RangeError);
  assert.throws(() => europaWeatherAt(NaN), RangeError);
});

test('existing 84-snowflake GPU draw activates only during scenic windows in High mode', () => {
  const surface = createEuropaSurface();
  const snow = surface.getObjectByName('europa-windborne-ice-snow');
  assert.ok(snow?.isPoints);
  assert.equal(snow.geometry.getAttribute('position').count, 84);
  updateEuropaSurface(surface, 20, true, true);
  assert.equal(snow.visible, false);
  updateEuropaSurface(surface, 28, true, true);
  assert.equal(snow.visible, true);
  assert.ok(snow.material.opacity > 0.2);
  const windPosition = snow.position.clone();
  updateEuropaSurface(surface, 44, true, true);
  assert.equal(snow.visible, false);
  updateEuropaSurface(surface, 28, true, true);
  assert.deepEqual(snow.position, windPosition);
  updateEuropaSurface(surface, 53, true, true);
  assert.equal(snow.visible, true);
  updateEuropaSurface(surface, 75, true, true);
  assert.equal(snow.visible, true);
  updateEuropaSurface(surface, 75, true, false);
  assert.equal(snow.visible, false, 'Medium does not incur extra snow particle draw');
  updateEuropaSurface(surface, 53, false, true);
  assert.equal(snow.visible, false, 'cave and boss transitions suppress background snow');
});

test('Europa enemies keep white crystalline silhouettes with localized dark contrast at same draw cost', () => {
  const enemy = new T.Group();
  const skin = addEuropaEnemyIceSkin(enemy);
  const armor = skin.getObjectByName('europa-white-ice-armor');
  const spikes = skin.getObjectByName('europa-crystal-ice-spines');
  assert.equal(skin.children.length, 2);
  assert.equal(armor.count, 5);
  assert.equal(spikes.count, 10);
  assert.equal(armor.instanceColor.count, 5);
  const white = new T.Color();
  const dark = new T.Color();
  armor.getColorAt(0, white);
  armor.getColorAt(2, dark);
  assert.ok(white.r > dark.r * 1.8);
  assert.ok(white.g > dark.g * 1.4);
  assert.equal(armor.userData.visualOnly, true);
  assert.equal(spikes.userData.visualOnly, true);
});
