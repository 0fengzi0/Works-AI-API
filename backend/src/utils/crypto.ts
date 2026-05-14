/**
 * Crypto utilities for password hashing and token generation
 * All operations use Web Crypto API (Cloudflare Workers compatible)
 */

const ALGORITHM = { name: "PBKDF2", hash: "SHA-256" } as const;
const ITERATIONS = 100_000;
const KEY_LENGTH = 256;

/**
 * Hash password using PBKDF2 with random salt
 * Returns: salt:hash (base64url encoded)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    KEY_LENGTH,
  );
  const hash = new Uint8Array(derivedBits);
  return `${btoaUrl(salt)}:${btoaUrl(hash)}`;
}

/**
 * Verify password against stored hash
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(":");
  if (!saltB64 || !hashB64) return false;

  const salt = atobUrl(saltB64);
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    KEY_LENGTH,
  );
  const hash = btoaUrl(new Uint8Array(derivedBits));
  return hash === hashB64;
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Generate a secure random token string (for API keys)
 */
export function generateToken(length = 48): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return btoaUrl(bytes);
}

function btoaUrl(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function atobUrl(data: string): Uint8Array {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}