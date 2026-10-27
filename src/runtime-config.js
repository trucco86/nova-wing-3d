// Public (non-secret) web configuration. Host allowlisting controls UX only;
// the Cloudflare API must independently verify ID tokens and Firebase project ID.
export const DEV_FIREBASE = Object.freeze({
  apiKey: 'AIzaSyDtoNkvfeFPflcTIi4i6PsopXvkl6M-rME',
  authDomain: 'nova-wing-dev.firebaseapp.com',
  projectId: 'nova-wing-dev',
  appId: '1:402269620588:web:0ed643d7a712f7e9118b49',
});

export function novaEnvironment(hostname, search = '') {
  if (hostname === 'dev.nova-wing-preview.pages.dev') return 'dev';
  if (hostname === 'hml.nova-wing-preview.pages.dev') return 'hml';
  if (hostname === 'trucco86.github.io') return 'prod';
  if (
    ['127.0.0.1', 'localhost'].includes(hostname) &&
    new URLSearchParams(search).get('auth') === '1'
  ) return 'local';
  return null;
}

function firebaseIsValid(value, environment) {
  if (!value || typeof value !== 'object') return false;
  if (!['apiKey', 'authDomain', 'projectId', 'appId'].every(
    (field) => typeof value[field] === 'string' && value[field].length > 3 &&
      value[field].length < 200
  )) return false;
  if (!/^[a-z0-9][a-z0-9-]{4,60}$/.test(value.projectId)) return false;
  if (environment === 'prod' && value.projectId === DEV_FIREBASE.projectId) return false;
  return true;
}

export function parsePublicConfig(json, environment) {
  if (!json || typeof json !== 'object' || json.environment !== environment) return null;
  if (!firebaseIsValid(json.firebase, environment)) return null;
  let rankingApiUrl = null;
  if (json.rankingApiUrl) {
    try {
      const url = new URL(json.rankingApiUrl);
      if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
          (url.pathname !== '/' && url.pathname !== '')) return null;
      rankingApiUrl = url.origin;
    } catch {
      return null;
    }
  }
  return { environment, firebase: json.firebase, rankingApiUrl };
}

export async function loadPublicConfig(environment, {
  fetchConfig = (url) => fetch(url, { cache: 'no-store' }),
} = {}) {
  if (!environment) return null;
  try {
    const response = await fetchConfig('nova-config.json');
    if (response.ok) {
      const parsed = parsePublicConfig(await response.json(), environment);
      if (parsed) return parsed;
    }
  } catch {
    // Missing offline configuration must never prevent guest gameplay.
  }
  // Only non-production environments may use the known DEV Firebase project.
  // Production never falls back to testing identities or tokens.
  if (environment === 'dev' || environment === 'hml' || environment === 'local')
    return { environment, firebase: DEV_FIREBASE, rankingApiUrl: null };
  return null;
}
