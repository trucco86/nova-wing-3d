import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installGoogleLogin } from '../src/google-auth.js';

function fakeUi(hostname) {
  const elements = new Map();
  for (const field of ['login','logout','guest','name','status']) {
    const listeners = new Map();
    elements.set(field, {
      disabled: field === 'login', hidden: false, textContent: '',
      addEventListener: (name, callback) => listeners.set(name, callback),
      listeners,
    });
  }
  const panel = {
    open: false, hidden: false,
    querySelector: (selector) => elements.get(selector.match(/data-auth-([a-z]+)/)?.[1]),
  };
  const original = { document: globalThis.document, window: globalThis.window };
  globalThis.document = {
    getElementById: (id) => id === 'novaAuth' ? panel : null,
    createElement: () => ({ textContent: '', remove() {} }),
    head: { append() {} },
  };
  globalThis.window = { location: { hostname, search: '' } };
  return {
    panel, elements,
    restore() {
      if (original.document === undefined) delete globalThis.document;
      else globalThis.document = original.document;
      if (original.window === undefined) delete globalThis.window;
      else globalThis.window = original.window;
    },
  };
}

test('production never initializes Firebase with missing config', async () => {
  const ui = fakeUi('trucco86.github.io');
  let sdkLoads = 0;
  try {
    const close = installGoogleLogin({
      loadConfig: async () => null,
      loadSdks: () => { sdkLoads++; throw Error('Must not load'); },
    });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(sdkLoads, 0);
    assert.equal(ui.panel.hidden, false);
    assert.equal(ui.elements.get('login').disabled, true);
    assert.match(ui.elements.get('status').textContent, /produção ainda não configurado/);
    close();
  } finally {
    ui.restore();
  }
});

test('production uses its own Firebase project and passes current user through callback', async () => {
  const ui = fakeUi('trucco86.github.io');
  const apps = [];
  let projectId;
  let observedUser;
  const productionConfig = {
    environment: 'prod',
    rankingApiUrl: 'https://ranking.example.org',
    firebase: {
      apiKey: 'public-example-key',
      authDomain: 'nova-wing-prod.firebaseapp.com',
      projectId: 'nova-wing-prod',
      appId: 'prod-app-id',
    },
  };
  try {
    const close = installGoogleLogin({
      loadConfig: async () => productionConfig,
      loadSdks: async () => [
        {
          getApps: () => apps,
          initializeApp: (config, name) => {
            projectId = config.projectId;
            const app = { name };
            apps.push(app);
            return app;
          },
        },
        {
          getAuth: () => ({ currentUser: null }),
          GoogleAuthProvider: class {},
          setPersistence: async () => {},
          browserLocalPersistence: {},
          onAuthStateChanged: (_, fn) => { fn({ uid: 'test', displayName: 'Teste' }); return () => {}; },
          getRedirectResult: async () => null,
        },
      ],
      onAuthChange: (user) => { observedUser = user; },
    });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(projectId, 'nova-wing-prod');
    assert.equal(observedUser.uid, 'test');
    assert.equal(ui.elements.get('login').hidden, true);
    close();
  } finally { ui.restore(); }
});
