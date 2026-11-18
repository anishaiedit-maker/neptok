const DEFAULT_FALLBACK_SECRET = 'neptok-cloudflare-session-secret-2026';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPassword(password: string, salt = 'neptok-salt'): Promise<string> {
  return sha256Hex(`${salt}:${password}`);
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(secret || DEFAULT_FALLBACK_SECRET);
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export interface SessionPayload {
  userId: string;
  handle: string;
  exp: number;
}

export async function signSessionToken(
  payload: Omit<SessionPayload, 'exp'>,
  secret?: string,
  ttlMs = 30 * 24 * 60 * 60 * 1000
): Promise<string> {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Date.now() + ttlMs,
  };
  const headerB64 = toBase64Url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(fullPayload)));
  const signingInput = `${headerB64}.${payloadB64}`;
  const key = await importHmacKey(secret || DEFAULT_FALLBACK_SECRET);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  return `${signingInput}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifySessionToken(
  token: string,
  secret?: string
): Promise<SessionPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const signingInput = `${headerB64}.${payloadB64}`;
    const key = await importHmacKey(secret || DEFAULT_FALLBACK_SECRET);
    const sigBytes = fromBase64Url(sigB64);
    const sigBuf = new Uint8Array(sigBytes).buffer;
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBuf,
      new TextEncoder().encode(signingInput)
    );
    if (!valid) return null;
    const decoded = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64))) as SessionPayload;
    if (!decoded.userId || decoded.exp < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}
