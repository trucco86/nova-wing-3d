import test from 'node:test';
import assert from 'node:assert/strict';
import { SECTORS } from '../src/campaign.js';
import { drawCampaignMap } from '../src/campaign-map.js';
import {
  CINEMATIC_SECTOR_ATLAS,
  CINEMATIC_SECTOR_COORDS,
} from '../src/campaign-map-cinematic-atlas.js';

class Element {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.className = '';
    this.attrs = {};
    this.styles = {};
    this.style = {
      setProperty: (name, value) => (this.styles[name] = value),
      set width(v) {
        this.ref.styles.width = v;
      },
      get width() {
        return this.ref.styles.width;
      },
    };
    this.style.ref = this;
    this.classList = {
      toggle: (name, force) => {
        const items = new Set(this.className.split(' ').filter(Boolean));
        if (force) items.add(name);
        else items.delete(name);
        this.className = [...items].join(' ');
      },
    };
    this.textContent = '';
    this.disabled = false;
  }
  setAttribute(n, v) {
    this.attrs[n] = String(v);
  }
  getAttribute(n) {
    return this.attrs[n] ?? null;
  }
  append(...nodes) {
    this.children.push(...nodes);
  }
  replaceChildren(...nodes) {
    this.children = nodes;
  }
  addEventListener(_type, handler) {
    this.click = handler;
  }
}

const fakeDocument = () => {
  const ids = {};
  for (const name of [
    'campaignRoute',
    'mapSectorTitle',
    'mapSectorBrief',
    'mapSectorThreat',
    'mapSectorBoss',
    'mapIntelStatus',
    'mapProgress',
    'mapProgressFill',
    'mapProgressCount',
    'mapProgressMeter',
    'mapLaunch',
  ])
    ids[name] = new Element('div');
  return {
    ids,
    getElementById: (id) => ids[id],
    createElement: (tag) => new Element(tag),
    createElementNS: (_ns, tag) => new Element(tag),
  };
};

test('concept artwork is genuine compact offline WebP with intact RIFF signature', () => {
  assert.ok(CINEMATIC_SECTOR_ATLAS.startsWith('data:image/webp;base64,'));
  const encoded = CINEMATIC_SECTOR_ATLAS.split(',')[1];
  const bytes = Buffer.from(encoded, 'base64');
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  assert.equal(bytes.readUInt32LE(4), bytes.length - 8);
  assert.ok(bytes.length < 16000, 'ten cinematic cards remain under 16 KB encoded asset');
});

test('each of the ten sectors maps to a unique art tile, never reusing unrelated planets', () => {
  assert.equal(SECTORS.length, 10);
  const coordinates = SECTORS.map((s) => CINEMATIC_SECTOR_COORDS[s.theme]);
  assert.equal(coordinates.filter(Boolean).length, 10);
  assert.equal(new Set(coordinates.map((v) => v.join(','))).size, 10);
  assert.ok(coordinates.every(([col, row]) => [0, 1].includes(col) && row >= 0 && row < 5));
});

test('cinematic images are bound to live mission cards while progress remains dynamic', () => {
  const doc = fakeDocument();
  drawCampaignMap(doc, SECTORS, 1);
  const route = doc.ids.campaignRoute;
  assert.ok(route.styles['--campaign-sector-atlas'].includes('data:image/webp;base64,'));
  const cards = route.children.slice(1);
  assert.equal(cards.length, 10);
  assert.deepEqual(
    cards.map((card) => card.children[0].styles['--sector-sprite-position']),
    [
      '0% 0%',
      '100% 0%',
      '0% 25%',
      '100% 25%',
      '0% 50%',
      '100% 50%',
      '0% 75%',
      '100% 75%',
      '0% 100%',
      '100% 100%',
    ],
  );
  assert.ok(
    cards.every((card) => card.children[0].attrs['data-art-source'] === 'cinematic-concept'),
  );
  assert.equal(doc.ids.mapProgress.textContent, '1 / 10 SETORES CONCLUÍDOS');
  assert.equal(doc.ids.mapProgressFill.styles.width, '10%');
  cards[9].click();
  assert.ok(doc.ids.mapSectorTitle.textContent.includes('MARVIN'));
  assert.equal(doc.ids.mapLaunch.disabled, false);
  drawCampaignMap(doc, SECTORS, 10);
  assert.equal(doc.ids.mapProgressFill.styles.width, '100%');
  assert.equal(doc.ids.mapLaunch.disabled, true);
});
