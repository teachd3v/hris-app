// PBKDF2 via WebCrypto: native di Workers, tidak membebani CPU seperti bcrypt JS.
// Workers membatasi iterasi PBKDF2 maksimal 100.000.
const ITERATIONS = 100_000;
const KEY_BITS = 256;

export const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || 'HR@2026!';
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

const b64 = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations }, key, KEY_BITS),
  );
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(hash)}`;
}

/** storedHash null -> bandingkan dengan password default. */
export async function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash) {
    const salt = new Uint8Array(16);
    const [a, b] = await Promise.all([derive(password, salt, ITERATIONS), derive(DEFAULT_PASSWORD, salt, ITERATIONS)]);
    return timingSafeEqual(a, b);
  }
  const [scheme, iter, salt, hash] = storedHash.split('$');
  if (scheme !== 'pbkdf2') return false;
  const actual = await derive(password, unb64(salt), Number(iter));
  return timingSafeEqual(actual, unb64(hash));
}

export function validateNewPassword(password: string): string | null {
  if (password.length < 8) return 'Password minimal 8 karakter';
  if (password.length > 128) return 'Password terlalu panjang';
  if (password === DEFAULT_PASSWORD) return 'Password baru tidak boleh sama dengan password default';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return 'Password harus mengandung huruf dan angka';
  return null;
}
