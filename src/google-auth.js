// Web-only Firebase adapter: production uses its own runtime configuration.
// Native/offline and PR previews never load the Google SDK.
import { novaEnvironment, loadPublicConfig } from './runtime-config.js';
const SDK_VERSION = '11.10.0';
const APP_URL = 'https://www.gstatic.com/firebasejs/' + SDK_VERSION + '/firebase-app.js';
const AUTH_URL = 'https://www.gstatic.com/firebasejs/' + SDK_VERSION + '/firebase-auth.js';

export async function signOutToGuest({ auth, authSdk, setUser, setStatus, closePanel }) {
  if (!auth || !authSdk) {
    setStatus('Não foi possível verificar a sessão Google. Tente novamente.');
    return false;
  }
  try {
    await authSdk.signOut(auth);
    // Keep state immediately consistent even when the Firebase observer is delayed.
    setUser(null);
    closePanel();
    return true;
  } catch {
    setStatus('Não foi possível sair do Google. Sua sessão continua ativa.');
    return false;
  }
}

export function installGoogleLogin({
  loadSdks = () =>
    Promise.all([import(/* @vite-ignore */ APP_URL), import(/* @vite-ignore */ AUTH_URL)]),
  loadConfig = loadPublicConfig,
  onAuthChange = () => {},
  onRuntimeConfig = () => {},
} = {}) {
  const panel = document.getElementById('novaAuth');
  if (!panel) return () => {};
  // Only exact, approved hosts can start OAuth. Hostnames are NOT backend authorization.
  const environment = novaEnvironment(window.location.hostname, window.location.search);
  if (!environment) {
    panel.hidden = true;
    return () => {};
  }
  // All layout belongs to the responsive title-menu stylesheet. Dynamic fixed
  // positioning previously detached Google login from the menu on small screens.
  const summary = panel.querySelector('[data-auth-summary]');
  const ranking = document.getElementById('novaRanking');
  const collapseRanking = () => {
    if (panel.open && ranking?.open) ranking.open = false;
  };
  panel.addEventListener?.('toggle', collapseRanking);
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
  let resolveInitialization;
  const initialization = new Promise((resolve) => {
    resolveInitialization = resolve;
  });
  const setStatus = (message) => {
    if (!disposed) status.textContent = message;
  };
  const setUser = (user) => {
    if (disposed) return;
    name.textContent = user ? user.displayName || 'Piloto Google' : 'Piloto visitante';
    if (summary) summary.textContent = user ? 'GOOGLE · CONECTADO' : 'LOGIN SOCIAL · GOOGLE';
    login.hidden = !!user;
    logout.hidden = !user;
    setStatus(user ? 'Sessão Google ativa' : 'Modo visitante · progresso local');
    onAuthChange(user);
  };
  login.addEventListener('click', async () => {
    if (!auth || !authSdk) return;
    login.disabled = true;
    guest.disabled = true;
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
      if (!disposed) {
        login.disabled = false;
        guest.disabled = false;
      }
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
  guest.addEventListener('click', async () => {
    guest.disabled = true;
    setStatus('Verificando sessão Google...');
    try {
      await initialization;
      if (disposed) return;
      if (environment === 'prod' && !auth) {
        setUser(null);
        panel.open = false;
        return;
      }
      await signOutToGuest({
        auth,
        authSdk,
        setUser,
        setStatus,
        closePanel: () => {
          panel.open = false;
        },
      });
    } finally {
      if (!disposed) guest.disabled = false;
    }
  });
  (async () => {
    try {
      const runtimeConfig = await loadConfig(environment);
      if (disposed) return;
      if (!runtimeConfig) {
        setStatus('Login de produção ainda não configurado. Jogue como visitante.');
        return;
      }
      onRuntimeConfig(runtimeConfig);
      const [appSdk, loadedAuthSdk] = await loadSdks();
      authSdk = loadedAuthSdk;
      if (disposed) return;
      const appName = 'nova-wing-' + environment;
      const app = appSdk.getApps().some((item) => item.name === appName)
        ? appSdk.getApp(appName)
        : appSdk.initializeApp(runtimeConfig.firebase, appName);
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
  })().finally(() => resolveInitialization());
  return () => {
    panel.removeEventListener?.('toggle', collapseRanking);
    disposed = true;
    unsubscribe();
  };
}
