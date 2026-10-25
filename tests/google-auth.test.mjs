import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installGoogleLogin, signOutToGuest } from '../src/google-auth.js';

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

test('guest mode only becomes active after Firebase sign-out completes', async () => {
  let resolveSignOut;
  let closed = false;
  let observedUser = { uid: 'pilot' };
  const status = [];
  const pending = new Promise((resolve) => {
    resolveSignOut = resolve;
  });
  const transition = signOutToGuest({
    auth: { currentUser: observedUser },
    authSdk: { signOut: () => pending },
    setUser: (user) => {
      observedUser = user;
    },
    setStatus: (value) => status.push(value),
    closePanel: () => {
      closed = true;
    },
  });
  assert.equal(closed, false);
  assert.notEqual(observedUser, null);
  resolveSignOut();
  assert.equal(await transition, true);
  assert.equal(closed, true);
  assert.equal(observedUser, null);
  assert.deepEqual(status, []);
});

test('guest mode cannot claim logout if Firebase sign-out fails', async () => {
  let closed = false;
  let observedUser = { uid: 'pilot' };
  const messages = [];
  const ok = await signOutToGuest({
    auth: { currentUser: observedUser },
    authSdk: {
      signOut: async () => {
        throw new Error('Network offline');
      },
    },
    setUser: (user) => {
      observedUser = user;
    },
    setStatus: (message) => messages.push(message),
    closePanel: () => {
      closed = true;
    },
  });
  assert.equal(ok, false);
  assert.equal(closed, false);
  assert.equal(observedUser.uid, 'pilot');
  assert.match(messages[0], /continua ativa/);
});

test('unavailable Firebase SDK refuses to misrepresent an authenticated session', async () => {
  const statuses = [];
  const ok = await signOutToGuest({
    auth: null,
    authSdk: undefined,
    setUser: () => assert.fail('User must not be cleared without Firebase sign-out'),
    setStatus: (message) => statuses.push(message),
    closePanel: () => assert.fail('Panel must stay open'),
  });
  assert.equal(ok, false);
  assert.match(statuses[0], /Não foi possível verificar/);
});

test('guest button queues sign-out until Firebase initialization completes', async () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  const elements = new Map();
  for (const name of ['login', 'logout', 'guest', 'name', 'status']) {
    const listeners = new Map();
    elements.set(name, {
      disabled: false,
      hidden: false,
      textContent: '',
      addEventListener: (event, callback) => listeners.set(event, callback),
      listeners,
    });
  }
  const panel = {
    open: true,
    querySelector(selector) {
      const name = selector.match(/data-auth-([a-z]+)/)?.[1];
      return elements.get(name);
    },
  };
  globalThis.document = {
    getElementById: (id) => (id === 'novaAuth' ? panel : null),
    createElement: () => ({ textContent: '', remove() {} }),
    head: { append() {} },
  };
  globalThis.window = {
    location: { hostname: 'dev.nova-wing-preview.pages.dev', search: '' },
  };
  let finishLoading;
  const sdkReady = new Promise((resolve) => {
    finishLoading = resolve;
  });
  let signedIn = true;
  let signOutCalls = 0;
  const auth = { currentUser: { uid: 'pilot' } };
  const authSdk = {
    getAuth: () => auth,
    GoogleAuthProvider: class {},
    setPersistence: async () => {},
    browserLocalPersistence: {},
    onAuthStateChanged: (_, callback) => {
      callback(auth.currentUser);
      return () => {};
    },
    getRedirectResult: async () => null,
    signOut: async () => {
      signOutCalls++;
      signedIn = false;
      auth.currentUser = null;
    },
  };
  const appSdk = {
    getApps: () => [],
    initializeApp: () => ({}),
  };
  try {
    const cleanup = installGoogleLogin({ loadSdks: () => sdkReady });
    const event = elements.get('guest').listeners.get('click');
    const transition = event();
    assert.equal(signOutCalls, 0);
    assert.equal(panel.open, true);
    finishLoading([appSdk, authSdk]);
    await transition;
    assert.equal(signedIn, false);
    assert.equal(signOutCalls, 1);
    assert.equal(panel.open, false);
    assert.equal(elements.get('name').textContent, 'Piloto visitante');
    cleanup();
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});
