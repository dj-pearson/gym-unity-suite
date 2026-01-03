/**
 * Encryption Utility for MFA Secrets
 *
 * Uses AES-GCM for authenticated encryption of sensitive data.
 * The encryption key is derived from a master secret stored as an environment variable.
 *
 * @module security/encryption
 */

// Encryption configuration
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM
const TAG_LENGTH = 128; // 128 bits authentication tag

/**
 * Get the encryption key from environment or derive from a secret
 * In production, this should come from VITE_ENCRYPTION_KEY environment variable
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  // Get the master secret from environment
  const masterSecret = import.meta.env.VITE_ENCRYPTION_KEY;

  if (!masterSecret) {
    console.warn(
      '[Encryption] VITE_ENCRYPTION_KEY not set. Using fallback key derivation. ' +
      'This is not recommended for production!'
    );
    // Fallback: derive a key from a combination of factors
    // This is NOT secure for production - set VITE_ENCRYPTION_KEY!
    const fallbackSecret = 'gym-unity-mfa-encryption-key-change-me';
    return deriveKeyFromSecret(fallbackSecret);
  }

  return deriveKeyFromSecret(masterSecret);
}

/**
 * Derive an AES key from a secret string using PBKDF2
 */
async function deriveKeyFromSecret(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(secret);

  // Import the secret as a key for PBKDF2
  const baseKey = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Use a fixed salt (in production, consider per-user salts stored separately)
  const salt = encoder.encode('gym-unity-mfa-salt-v1');

  // Derive the actual encryption key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plaintext string using AES-GCM
 * Returns a base64-encoded string containing IV + ciphertext + tag
 */
export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  // Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encrypt the data
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: TAG_LENGTH,
    },
    key,
    plaintextBytes
  );

  // Combine IV + ciphertext into a single array
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  // Encode as base64 for storage
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a base64-encoded encrypted string
 * Expects format: IV (12 bytes) + ciphertext + tag
 */
export async function decryptSecret(encrypted: string): Promise<string> {
  const key = await getEncryptionKey();

  // Decode from base64
  const combined = new Uint8Array(
    atob(encrypted)
      .split('')
      .map(c => c.charCodeAt(0))
  );

  // Extract IV and ciphertext
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  // Decrypt the data
  const decrypted = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: TAG_LENGTH,
    },
    key,
    ciphertext
  );

  // Convert back to string
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Check if a string appears to be encrypted (base64 with minimum length)
 * This is a heuristic check, not a guarantee
 */
export function isEncrypted(value: string): boolean {
  // Minimum length: IV (12 bytes) + some ciphertext + tag (16 bytes)
  // Base64 encoding increases size by ~33%
  const minBase64Length = Math.ceil((IV_LENGTH + 16 + 16) * 4 / 3);

  if (value.length < minBase64Length) {
    return false;
  }

  // Check if it's valid base64
  try {
    const decoded = atob(value);
    // Check if first bytes could be an IV (any bytes are valid)
    return decoded.length >= IV_LENGTH + 16;
  } catch {
    return false;
  }
}

/**
 * Encrypt if not already encrypted, or return as-is if already encrypted
 * Useful for migration scenarios
 */
export async function ensureEncrypted(value: string): Promise<string> {
  if (isEncrypted(value)) {
    // Verify it can be decrypted (validates the encryption)
    try {
      await decryptSecret(value);
      return value; // Already encrypted and valid
    } catch {
      // Not actually encrypted or wrong key, encrypt it
    }
  }
  return encryptSecret(value);
}

/**
 * Decrypt if encrypted, or return as-is if plaintext
 * Useful for backward compatibility during migration
 */
export async function ensureDecrypted(value: string): Promise<string> {
  if (isEncrypted(value)) {
    try {
      return await decryptSecret(value);
    } catch {
      // Decryption failed, might be plaintext that looks like base64
      return value;
    }
  }
  return value;
}

// Re-export for convenience
export { ALGORITHM, KEY_LENGTH, IV_LENGTH, TAG_LENGTH };
