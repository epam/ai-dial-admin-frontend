/**
 * Generates a cryptographically random key secret suitable for use as a DIAL `PROJECT_KEY`.
 *
 * Uses `crypto.getRandomValues` rather than `Math.random` (not cryptographically secure) or
 * `uuidv4` (UUID format is not required by Core and limits entropy). Produces 32 random bytes
 * encoded as a lowercase hex string (64 characters).
 */
export function generateKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
