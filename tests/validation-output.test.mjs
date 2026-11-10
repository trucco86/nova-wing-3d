import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  symlinkSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validationOutput, writeValidationFile } from '../tools/validation-output.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'nw-output-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test('default and isolated validation outputs remain separate and replace evidence atomically', (t) => {
  const root = fixture(t),
    normal = validationOutput({ root }),
    isolated = validationOutput({ root, requested: 'artifacts/orchestrator/run-one' });
  writeValidationFile(normal, 'validation.json', 'original');
  writeValidationFile(isolated, 'validation.json', 'isolated');
  writeValidationFile(isolated, 'validation.json', 'new');
  assert.equal(readFileSync(join(normal, 'validation.json'), 'utf8'), 'original');
  assert.equal(readFileSync(join(isolated, 'validation.json'), 'utf8'), 'new');
  assert.throws(() => writeValidationFile(isolated, '../outside.json', 'bad'), /Nome/);
});

test('output paths reject traversal and symlink ancestors including dangling links', (t) => {
  const root = fixture(t);
  assert.throws(() => validationOutput({ root, requested: '../escape' }), /artifacts/);
  assert.throws(
    () => validationOutput({ root, requested: 'artifacts/foo\\..\\..\\escaped' }),
    /inválida/,
  );
  assert.equal(existsSync(join(root, 'escaped')), false);
  const directory = validationOutput({ root });
  symlinkSync(join(root, 'absent'), join(directory, 'redirect'));
  assert.throws(
    () => validationOutput({ root, requested: 'artifacts/redirect/child' }),
    /redirecionada/,
  );
  assert.equal(existsSync(join(root, 'absent')), false);
  mkdirSync(join(root, 'outside'));
  symlinkSync(join(root, 'outside'), join(directory, 'linked'));
  assert.throws(() => validationOutput({ root, requested: 'artifacts/linked' }), /redirecionada/);
});

test('evidence leaf symlinks never overwrite an external target', (t) => {
  const root = fixture(t),
    directory = validationOutput({ root }),
    outside = join(root, 'outside');
  writeFileSync(outside, 'preserve');
  symlinkSync(outside, join(directory, 'validation.json'));
  assert.throws(() => writeValidationFile(directory, 'validation.json', 'bad'), /redirecionado/);
  assert.equal(readFileSync(outside, 'utf8'), 'preserve');
});
