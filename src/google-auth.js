// Web-only Firebase Authentication adapter. The Google SDK is loaded on demand so
// offline gameplay and native shells remain independent of the login provider.
const config = Object.freeze({
  apiKey: 'AIzaSyDtoNkvfeFPflcTIi4i6PsopXvkl6M-rME',
  authDomain: 'nova-wing-dev.firebaseapp.com',
  projectId: 'nova-wing-dev',
  appId: '1:402269620588:web:0ed643d7a712f7e9118b49',
});
const SDK_VERSION = '11.10.0';
const APP_URL = 'https://www.gstatic.com/firebasejs/' + SDK_VERSION + '/firebase-app.js';
const AUTH_URL = 'https://www.gstatic.com/firebasejs/' + SDK_VERSION + '/firebase-auth.js';

export function installGoogleLogin() {
  const panel = document.getElementById('novaAuth');
  if (!panel) return () => {};
  const status = panel.querySelector('[data-auth-status]');
  const login = panel.querySelector('[data-auth-login]');
  const logout = panel.querySelector('[data-auth-logout]');
  const guest = panel.querySelector('[data-auth-guest]');
  const name = panel.querySelector('[data-auth-name]');
  let disposed = false;
  let unsubscribe = () => {};
  let auth;
  let authSdk;
  let provider;
  const setStatus = (message) => {
    if (!disposed) status.textContent = message;
  };
  const setUser = (user) => {
    if (disposed) return;
    name.textContent = user ? user.displayName || 'Piloto Google' : 'Piloto visitante';
    login.hidden = !!user;
    logout.hidden = !user;
    setStatus(user ? 'Sessão Google ativa' : 'Modo visitante · progresso local');
  };
  login.addEventListener('click', async () => {
    if (!auth || !authSdk) return;
    login.disabled = true;
    setStatus('Conectando ao Google...');
    try {
      await authSdk.signInWithPopup(auth, provider);
    } catch (error) {
      if (
        error?.code === 'auth/popup-blocked' ||
        error?.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        try {
          await authSdk.signInWithRedirect(auth, provider);
          return;
        } catch {
          setStatus('Não foi possível abrir o login. Tente novamente.');
        }
      } else if (
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request'
      ) {
        setStatus('Login cancelado · modo visitante');
      } else {
        setStatus('Falha no login Google. Confira os domínios autorizados.');
        console.error('Firebase login:', error?.code || error);
      }
    } finally {
      if (!disposed) login.disabled = false;
    }
  });
  logout.addEventListener('click', async () => {
    if (!auth) return;
    try {
      await authSdk.signOut(auth);
    } catch {
      setStatus('Não foi possível sair da conta.');
    }
  });
  guest.addEventListener('click', () => {
    panel.open = false;
    setStatus('Modo visitante · progresso local');
  });
  (async () => {
    try {
      const appSdk = await import(/* @vite-ignore */ APP_URL);
      authSdk = await import(/* @vite-ignore */ AUTH_URL);
      if (disposed) return;
      const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(config);
      auth = authSdk.getAuth(app);
      provider = new authSdk.GoogleAuthProvider();
      await authSdk.setPersistence(auth, authSdk.browserLocalPersistence);
      if (disposed) return;
      unsubscribe = authSdk.onAuthStateChanged(auth, setUser, () =>
        setStatus('Sessão indisponível. Jogue como visitante.'),
      );
      await authSdk.getRedirectResult(auth).catch((error) => {
        console.error('Firebase redirect:', error?.code || error);
        setStatus('Não foi possível concluir o login Google.');
      });
      login.disabled = false;
    } catch (error) {
      console.error('Firebase initialization:', error);
      setStatus('Login indisponível. Você pode jogar como visitante.');
    }
  })();
  return () => {
    disposed = true;
    unsubscribe();
  };
}
