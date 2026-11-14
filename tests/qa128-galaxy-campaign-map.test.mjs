import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SECTORS } from '../src/campaign.js';
import { campaignMapSteps, drawCampaignMap } from '../src/campaign-map.js';
import { campaignSectorArtwork } from '../src/campaign-map-art.js';

class FakeElement {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.attributes = {};
    this.textContent = '';
    this.className = '';
    this.hidden = false;
    this.disabled = false;
    this.styles = {};
    this.style = {
      setProperty: (name, value) => { this.styles[name] = value; },
      set width(value) { this.element.styles.width = value; },
      get width() { return this.element.styles.width; },
    };
    this.style.element = this;
    this.events = {};
    this.classList = {
      toggle: (name, enabled) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        if (enabled) classes.add(name);
        else classes.delete(name);
        this.className = [...classes].join(' ');
      },
    };
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = [...children]; }
  addEventListener(name, callback) { this.events[name] = callback; }
  click() { this.events.click?.(); }
}
class FakeDocument {
  constructor() {
    this.ids = Object.fromEntries(
      ['campaignRoute', 'mapProgress', 'mapProgressFill', 'mapProgressCount',
        'mapProgressMeter', 'mapSectorTitle', 'mapSectorBrief',
        'mapSectorThreat', 'mapSectorBoss', 'mapIntelStatus', 'mapLaunch']
        .map((id) => [id, new FakeElement('div')]),
    );
  }
  getElementById(id) { return this.ids[id] ?? null; }
  createElement(tag) { return new FakeElement(tag); }
  createElementNS(_namespace, tag) { return new FakeElement(tag); }
}

test('all ten destinations match the actual campaign and maintain real unlock states', () => {
  const steps = campaignMapSteps(SECTORS, 1);
  assert.equal(steps.length, 10);
  assert.deepEqual(steps.map(({ name }) => name), SECTORS.map(({ name }) => name));
  assert.deepEqual(steps.map(({ status }) => status), [
    'completed', 'next', 'locked', 'locked', 'locked', 'locked',
    'locked', 'locked', 'locked', 'locked',
  ]);
  assert.deepEqual(
    campaignMapSteps(SECTORS, -2).map(({ status }) => status).slice(0, 2),
    ['next', 'locked'],
  );
  assert.ok(campaignMapSteps(SECTORS, 100).every(({ status }) => status === 'completed'));
});

test('all sector illustrations are unique, offline SVG and reuse cached data', () => {
  const art = SECTORS.map(({ theme }) => campaignSectorArtwork(theme));
  assert.equal(new Set(art).size, 10);
  for (const url of art) {
    assert.ok(url.startsWith('url("data:image/svg+xml,'));
    assert.ok(url.includes('%3Csvg'));
    assert.ok(!url.includes('https:') && !url.includes('http%3A'));
  }
  assert.equal(campaignSectorArtwork('city'), art[0]);
});

test('rendered route has ten inspectable mission buttons, linked lane and correct progress', () => {
  const doc = new FakeDocument();
  drawCampaignMap(doc, SECTORS, 1);
  const route = doc.getElementById('campaignRoute');
  assert.equal(route.children.length, 11, 'one route SVG and ten real mission buttons');
  assert.equal(route.children[0].tagName, 'svg');
  const buttons = route.children.slice(1);
  assert.ok(buttons.every((button) => button.tagName === 'button'));
  assert.ok(buttons.every((button) => button.children.length === 3));
  assert.ok(buttons.every((button) => button.children[0].styles['--sector-art']?.startsWith('url(')));
  assert.equal(buttons[0].className.includes('completed'), true);
  assert.equal(buttons[1].className.includes('next'), true);
  assert.equal(buttons[1].getAttribute('aria-current'), 'step');
  assert.equal(buttons[1].getAttribute('aria-pressed'), 'true');
  assert.equal(doc.getElementById('mapProgress').textContent, '1 / 10 SETORES CONCLUÍDOS');
  assert.equal(doc.getElementById('mapProgressFill').styles.width, '10%');
  assert.equal(doc.getElementById('mapProgressCount').textContent, '1 / 10');
  assert.equal(doc.getElementById('mapProgressMeter').getAttribute('aria-valuenow'), '1');
  assert.equal(doc.getElementById('mapLaunch').disabled, false);

  // Future encounters are inspectable, not unlocked. The launch target stays
  // owned by the game state and is never changed by selecting a locked card.
  buttons[9].click();
  assert.equal(buttons[9].getAttribute('aria-pressed'), 'true');
  assert.equal(buttons[1].getAttribute('aria-pressed'), 'false');
  assert.match(doc.getElementById('mapSectorTitle').textContent, /MARVIN/);
  assert.match(doc.getElementById('mapIntelStatus').textContent, /SETOR FUTURO/);
  assert.equal(doc.getElementById('mapProgressFill').styles.width, '10%');
  assert.equal(doc.getElementById('mapLaunch').disabled, false);
});

test('completion of every sector shows 100% and prevents launching sector 11', () => {
  const doc = new FakeDocument();
  drawCampaignMap(doc, SECTORS, 10);
  assert.equal(doc.getElementById('mapProgressFill').styles.width, '100%');
  assert.equal(doc.getElementById('mapLaunch').disabled, true);
  assert.ok(doc.getElementById('campaignRoute').children.slice(1).every(
    (button) => button.className.includes('completed'),
  ));
});

test('campaign UI preserves actual game button IDs and scrollable touch view', () => {
  const html = readFileSync(new URL('../src/shell.html', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  for (const id of ['campaignMap', 'campaignRoute', 'mapProgress', 'mapProgressFill',
    'mapProgressCount', 'mapIntelStatus', 'mapBack', 'mapLaunch']) {
    assert.ok(html.includes('id="' + id + '"'), id);
  }
  assert.match(css, /#campaignMap\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /touch-action:\s*pan-y/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.campaign-route-marker/);
});
