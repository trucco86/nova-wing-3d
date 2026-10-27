// Firebase Authentication verifier for a Cloudflare Worker (Web Crypto only).
// IMPORTANT: Security review and emulator tests are required before production use.
const JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let cachedKeys;
let cacheUntil = 0;

export class UnauthorizedError extends Error {
  constructor() {
    super('Invalid Firebase ID token');
    this.name = 'UnauthorizedError';
  }
}

function decodeBase64Url(encoded) {
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) throw new UnauthorizedError();
  const padded = encoded.replaceAll('-', '+').replaceAll('_', '/');
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function readJsonSegment(segment) {
  try {
    return JSON.parse(new TextDecoder().decode(decodeBase64Url(segment)));
  } catch {
    throw new UnauthorizedError();
  }
}

async function getPublicKeys(fetchKeys, now) {
  if (!fetchKeys && cachedKeys && cacheUntil > now) return cachedKeys;
  const response = await (fetchKeys || fetch)(JWKS_URL);
  if (!response.ok) throw new UnauthorizedError();
  const json = await response.json();
  if (!Array.isArray(json.keys)) throw new UnauthorizedError();
  if (!fetchKeys) {
    const maxAge = Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] || 60);
    cachedKeys = json.keys;
    cacheUntil = now + Math.min(Math.max(maxAge, 0), 3600) * 1000;
  }
  return json.keys;
}

export async function verifyFirebaseIdToken(token, projectId, options = {}) {
  if (!projectId || typeof token !== 'string' || token.length > 12000)
    throw new UnauthorizedError();
  const parts = token.split('.');
  if (parts.length !== 3) throw new UnauthorizedError();
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = readJsonSegment(encodedHeader);
  const claims = readJsonSegment(encodedPayload);
  const now = Math.floor((options.nowMs ?? Date.now()) / 1000);
  if (
    header.alg !== 'RS256' ||
    typeof header.kid !== 'string' ||
    !header.kid ||
    claims.aud !== projectId ||
    claims.iss !== 'https://securetoken.google.com/' + projectId ||
    typeof claims.sub !== 'string' ||
    !claims.sub ||
    claims.sub.length > 128 ||
    !Number.isInteger(claims.exp) ||
    claims.exp <= now ||
    !Number.isInteger(claims.iat) ||
    claims.iat > now ||
    !Number.isInteger(claims.auth_time) ||
    claims.auth_time > now
  ) {
    throw new UnauthorizedError();
  }
  try {
    const keys = await getPublicKeys(options.fetchKeys, (options.nowMs ?? Date.now()));
    const jwk = keys.find((key) => key.kid === header.kid && key.kty === 'RSA');
    if (!jwk) throw new UnauthorizedError();
    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const verified = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      decodeBase64Url(encodedSignature),
      new TextEncoder().encode(encodedHeader + '.' + encodedPayload),
    );
    if (!verified) throw new UnauthorizedError();
    return { uid: claims.sub };
  } catch {
    throw new UnauthorizedError();
  }
}
