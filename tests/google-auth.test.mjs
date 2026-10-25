import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installGoogleLogin } from '../src/google-auth.js';

for (const hostname of ['127.0.0.1', 'pr-59.nova-wing-preview.pages.dev']) {
  test(`Google login remains inactive by default on ${hostname}`, () => {
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;
    const panel = { hidden: false };
    let appendedStyles = 0;
    globalThis.document = {
      getElementById: (id) => (id === 'novaAuth' ? panel : null),
      head: {
        append: () => {
          appendedStyles++;
        },
      },
    };
    globalThis.window = { location: { hostname, search: '' } };
    try {
      const cleanup = installGoogleLogin();
      assert.equal(panel.hidden, true);
      assert.equal(appendedStyles, 0);
      cleanup();
    } finally {
      if (originalDocument === undefined) delete globalThis.document;
      else globalThis.document = originalDocument;
      if (originalWindow === undefined) delete globalThis.window;
      else globalThis.window = originalWindow;
    }
  });
}
