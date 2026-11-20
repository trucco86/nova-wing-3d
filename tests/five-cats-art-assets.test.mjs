import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { copyGameArt, FIVE_CATS_ART_FILES } from '../tools/copy-art-assets.mjs';
import { CAT_RANKS } from '../src/cat-rank-catalog.js';

test('original Five Cats art exports all ten standalone WebP files for offline and Pages', async (t) => {
  const dest = await mkdtemp(join(tmpdir(), 'five-cats-art-'));
  t.after(() => rm(dest, { recursive: true, force: true }));
  assert.equal(FIVE_CATS_ART_FILES.length, 10);
  assert.equal(await copyGameArt(dest), 10);
  for (const name of FIVE_CATS_ART_FILES) {
    const source = await readFile(resolve('src/assets', name));
    const installed = await readFile(join(dest, 'src/assets', name));
    assert.deepEqual(installed, source, name + ' must be included without degrading art');
    assert.equal(source.toString('ascii', 0, 4), 'RIFF', 'WebP container required');
    assert.equal(source.toString('ascii', 8, 12), 'WEBP', 'WebP format required');
    assert.ok((await stat(join(dest, 'src/assets', name))).size > 1000);
  }
});

test('Bob gets the latest dedicated visual without changing the pilot identities', async () => {
  const html = await readFile(resolve('src/shell.html'), 'utf8');
  const css = await readFile(resolve('src/styles.css'), 'utf8');
  const showroom = await readFile(resolve('src/showroom.js'), 'utf8');
  assert.match(css, /data-pilot='bob'\] \.profile-portrait/);
  for (const pilot of ['bia', 'bob', 'christopher', 'calvin', 'jenifer'])
    assert.match(css, new RegExp(pilot + '-spotlight\\.webp'));
  assert.match(css, /bob-spotlight\.webp/);
  assert.match(css, /data-pilot='bob'\] \.hangar-art-portrait/);
  assert.match(html, /id="hangarArtImage"/);
  assert.match(showroom, /piloto Five Cats|arte de destaque dos Five Cats/);
  assert.match(html, /id="pilot-bia"/);
  assert.match(html, /id="pilot-jenifer"/);
  assert.equal(CAT_RANKS.length, 10, 'original progression remains authoritative');
  assert.match(css, /\[data-rank='10'\]/);
});

test('all five identities use their individual artwork in every character surface', async () => {
  const css = await readFile(resolve('src/styles.css'), 'utf8');
  const html = await readFile(resolve('src/shell.html'), 'utf8');
  for (const pilot of ['bia', 'bob', 'christopher', 'calvin', 'jenifer']) {
    assert.ok(
      css.includes(`--nw-${pilot}-portrait: url('src/assets/${pilot}-spotlight.webp')`),
      'individual artwork variable missing for ' + pilot,
    );
    for (const selector of [
      `#pilot-${pilot} .cat-avatar`,
      `#comms #commsPortrait[data-pilot='${pilot}']`,
      `#cinematicPortrait[data-pilot='${pilot}']`,
      `.cat-service-card[data-pilot='${pilot}'] .cat-service-avatar`,
    ])
      assert.ok(css.includes(selector), selector + ' must use individual art');
  }
  assert.match(css, /background-size: cover;/);
  assert.match(html, /id="hangarArt"/);
  assert.match(html, /id="hangarArtImage"/);
  for (const unexpected of ['pilot-boa', 'pilot-luna'])
    assert.ok(
      !html.includes('id="' + unexpected + '"'),
      unexpected + ' is not in the Five Cats roster',
    );
});
