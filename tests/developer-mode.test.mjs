import { test } from 'node:test';
import assert from 'node:assert/strict';
import { developerToolsAllowed, parseDeveloperScenario } from '../src/developer-mode.js';

test('developer menu is restricted to isolated DEV/PR and local browser hosts', () => {
  for (const host of ['dev.nova-wing-preview.pages.dev', 'pr-134.nova-wing-preview.pages.dev', 'localhost', '127.0.0.1'])
    assert.equal(developerToolsAllowed(host), true, host);
  for (const host of ['nova-wing-preview.pages.dev', 'hml.nova-wing-preview.pages.dev', 'www.nova-wing-preview.pages.dev', 'dev.nova-wing-preview.pages.dev.evil.com', '', undefined])
    assert.equal(developerToolsAllowed(host), false, String(host));
  assert.equal(developerToolsAllowed('dev.nova-wing-preview.pages.dev', true), false);
});

test('developer QA scenarios accept only real campaign sectors and known encounters', () => {
  assert.deepEqual(parseDeveloperScenario('0', 'stage', 10), { sector: 0, encounter: 'stage' });
  assert.deepEqual(parseDeveloperScenario('9', 'boss', 10), { sector: 9, encounter: 'boss' });
  assert.deepEqual(parseDeveloperScenario(4, 'subboss', 10), { sector: 4, encounter: 'subboss' });
  for (const value of [-1, 10, '1.5', 'NaN', Infinity, 'abc']) assert.equal(parseDeveloperScenario(value, 'boss', 10), null);
  assert.equal(parseDeveloperScenario(0, 'production', 10), null);
});
