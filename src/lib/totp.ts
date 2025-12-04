/**
 * TOTP (Time-based One-Time Password) Utility
 * Implements RFC 6238 for 2FA/MFA
 */

// Base32 encoding/decoding
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buffer: Uint8Array): string {
  let result = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return result;
}

export function base32Decode(encoded: string): Uint8Array {
  const cleanedInput = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const result: number[] = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cleanedInput.length; i++) {
    const charIndex = BASE32_CHARS.indexOf(cleanedInput[i]);
    if (charIndex === -1) continue;

    value = (value << 5) | charIndex;
    bits += 5;

    if (bits >= 8) {
      result.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(result);
}

/**
 * Generate a cryptographically secure random secret
 */
export function generateSecret(length = 20): string {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return base32Encode(buffer);
}

/**
 * Generate TOTP code from secret and time
 */
export async function generateTOTP(
  secret: string,
  options: {
    digits?: number;
    period?: number;
    algorithm?: 'SHA-1' | 'SHA-256' | 'SHA-512';
    counter?: number;
  } = {}
): Promise<string> {
  const { digits = 6, period = 30, algorithm = 'SHA-1', counter } = options;

  // Calculate counter (time-based or custom)
  const timeCounter = counter ?? Math.floor(Date.now() / 1000 / period);

  // Convert counter to 8-byte buffer (big-endian)
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  counterView.setBigUint64(0, BigInt(timeCounter), false);

  // Decode secret from base32
  const secretBytes = base32Decode(secret);

  // Import key for HMAC
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign']
  );

  // Generate HMAC
  const signature = await crypto.subtle.sign('HMAC', key, counterBuffer);
  const hmacResult = new Uint8Array(signature);

  // Dynamic truncation
  const offset = hmacResult[hmacResult.length - 1] & 0x0f;
  const binary =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);

  // Generate OTP
  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, '0');
}

/**
 * Verify TOTP code
 */
export async function verifyTOTP(
  token: string,
  secret: string,
  options: {
    digits?: number;
    period?: number;
    algorithm?: 'SHA-1' | 'SHA-256' | 'SHA-512';
    window?: number; // Number of periods to check before/after current
  } = {}
): Promise<{ valid: boolean; delta: number | null }> {
  const { digits = 6, period = 30, algorithm = 'SHA-1', window = 1 } = options;

  const currentCounter = Math.floor(Date.now() / 1000 / period);

  // Check current time and window on each side
  for (let i = -window; i <= window; i++) {
    const counter = currentCounter + i;
    const expectedToken = await generateTOTP(secret, {
      digits,
      period,
      algorithm,
      counter,
    });

    if (token === expectedToken) {
      return { valid: true, delta: i };
    }
  }

  return { valid: false, delta: null };
}

/**
 * Generate OTP Auth URI for QR codes
 */
export function generateOTPAuthURI(
  secret: string,
  options: {
    issuer: string;
    accountName: string;
    digits?: number;
    period?: number;
    algorithm?: string;
  }
): string {
  const { issuer, accountName, digits = 6, period = 30, algorithm = 'SHA1' } = options;

  const params = new URLSearchParams({
    secret: secret,
    issuer: issuer,
    algorithm: algorithm,
    digits: digits.toString(),
    period: period.toString(),
  });

  // URL encode the account name and issuer
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);

  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?${params.toString()}`;
}

/**
 * Generate backup codes for account recovery
 */
export function generateBackupCodes(count = 10, length = 8): string[] {
  const codes: string[] = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous characters

  for (let i = 0; i < count; i++) {
    let code = '';
    const buffer = new Uint8Array(length);
    crypto.getRandomValues(buffer);

    for (let j = 0; j < length; j++) {
      code += chars[buffer[j] % chars.length];
    }

    // Format as XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }

  return codes;
}

/**
 * Hash a backup code for storage
 */
export async function hashBackupCode(code: string): Promise<string> {
  const normalizedCode = code.replace(/-/g, '').toUpperCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedCode);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a backup code against stored hashes
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<{ valid: boolean; usedIndex: number | null }> {
  const hashedInput = await hashBackupCode(code);

  for (let i = 0; i < hashedCodes.length; i++) {
    if (hashedInput === hashedCodes[i]) {
      return { valid: true, usedIndex: i };
    }
  }

  return { valid: false, usedIndex: null };
}

// MFA-related types
export interface MFASetupData {
  secret: string;
  qrCodeUri: string;
  backupCodes: string[];
}

export interface MFAVerificationResult {
  success: boolean;
  method: 'totp' | 'backup' | null;
  error?: string;
}
