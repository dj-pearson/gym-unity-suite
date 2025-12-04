import { describe, it, expect } from 'vitest';
import {
  base32Encode,
  base32Decode,
  generateSecret,
  generateTOTP,
  verifyTOTP,
  generateOTPAuthURI,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
} from './totp';

describe('Base32 Encoding', () => {
  it('should encode and decode correctly', () => {
    const original = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const encoded = base32Encode(original);
    const decoded = base32Decode(encoded);

    expect(Array.from(decoded)).toEqual(Array.from(original));
  });

  it('should handle empty input', () => {
    const encoded = base32Encode(new Uint8Array([]));
    expect(encoded).toBe('');
  });

  it('should produce valid base32 characters', () => {
    const buffer = new Uint8Array([1, 2, 3, 4, 5]);
    const encoded = base32Encode(buffer);
    expect(encoded).toMatch(/^[A-Z2-7]*$/);
  });
});

describe('generateSecret', () => {
  it('should generate a secret of correct length', () => {
    const secret = generateSecret(20);
    // Base32 encoding increases length by ~1.6x, so 20 bytes = ~32 chars
    expect(secret.length).toBeGreaterThanOrEqual(30);
  });

  it('should generate unique secrets', () => {
    const secret1 = generateSecret();
    const secret2 = generateSecret();
    expect(secret1).not.toBe(secret2);
  });

  it('should generate valid base32 strings', () => {
    const secret = generateSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
  });
});

describe('generateTOTP', () => {
  it('should generate a 6-digit code by default', async () => {
    const secret = generateSecret();
    const code = await generateTOTP(secret);

    expect(code).toHaveLength(6);
    expect(code).toMatch(/^\d{6}$/);
  });

  it('should generate codes with custom digits', async () => {
    const secret = generateSecret();
    const code = await generateTOTP(secret, { digits: 8 });

    expect(code).toHaveLength(8);
    expect(code).toMatch(/^\d{8}$/);
  });

  it('should generate consistent codes for same counter', async () => {
    const secret = generateSecret();
    const counter = Math.floor(Date.now() / 1000 / 30);

    const code1 = await generateTOTP(secret, { counter });
    const code2 = await generateTOTP(secret, { counter });

    expect(code1).toBe(code2);
  });

  it('should generate different codes for different counters', async () => {
    const secret = generateSecret();

    const code1 = await generateTOTP(secret, { counter: 1000 });
    const code2 = await generateTOTP(secret, { counter: 1001 });

    expect(code1).not.toBe(code2);
  });
});

describe('verifyTOTP', () => {
  it('should verify a valid code', async () => {
    const secret = generateSecret();
    const code = await generateTOTP(secret);
    const result = await verifyTOTP(code, secret);

    expect(result.valid).toBe(true);
    expect(result.delta).toBe(0);
  });

  it('should reject an invalid code', async () => {
    const secret = generateSecret();
    const result = await verifyTOTP('000000', secret);

    // This might occasionally pass if 000000 happens to be valid, so we generate a known invalid code
    const validCode = await generateTOTP(secret);
    const invalidCode = validCode === '123456' ? '654321' : '123456';
    const result2 = await verifyTOTP(invalidCode, secret);

    // At least one should be invalid
    expect(result.valid || result2.valid).toBe(false);
  });

  it('should accept codes within window', async () => {
    const secret = generateSecret();
    const counter = Math.floor(Date.now() / 1000 / 30);

    // Generate code for previous period
    const prevCode = await generateTOTP(secret, { counter: counter - 1 });

    // Verify with window of 1
    const result = await verifyTOTP(prevCode, secret, { window: 1 });

    expect(result.valid).toBe(true);
    expect(result.delta).toBe(-1);
  });

  it('should reject codes outside window', async () => {
    const secret = generateSecret();
    const counter = Math.floor(Date.now() / 1000 / 30);

    // Generate code for a period far in the past
    const oldCode = await generateTOTP(secret, { counter: counter - 10 });

    // Verify with small window
    const result = await verifyTOTP(oldCode, secret, { window: 1 });

    expect(result.valid).toBe(false);
  });
});

describe('generateOTPAuthURI', () => {
  it('should generate a valid otpauth URI', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const uri = generateOTPAuthURI(secret, {
      issuer: 'TestApp',
      accountName: 'user@example.com',
    });

    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain('TestApp');
    expect(uri).toContain('user@example.com');
    expect(uri).toContain(`secret=${secret}`);
  });

  it('should include all parameters', () => {
    const uri = generateOTPAuthURI('SECRET123', {
      issuer: 'MyApp',
      accountName: 'test@test.com',
      digits: 8,
      period: 60,
      algorithm: 'SHA256',
    });

    expect(uri).toContain('digits=8');
    expect(uri).toContain('period=60');
    expect(uri).toContain('algorithm=SHA256');
  });

  it('should properly encode special characters', () => {
    const uri = generateOTPAuthURI('SECRET', {
      issuer: 'My App & Co.',
      accountName: 'user+test@example.com',
    });

    expect(uri).toContain(encodeURIComponent('My App & Co.'));
  });
});

describe('generateBackupCodes', () => {
  it('should generate the correct number of codes', () => {
    const codes = generateBackupCodes(10);
    expect(codes).toHaveLength(10);
  });

  it('should generate unique codes', () => {
    const codes = generateBackupCodes(100);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(100);
  });

  it('should generate codes in correct format', () => {
    const codes = generateBackupCodes(5);
    codes.forEach((code) => {
      expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    });
  });

  it('should not include ambiguous characters', () => {
    const codes = generateBackupCodes(100);
    const allChars = codes.join('').replace(/-/g, '');
    expect(allChars).not.toMatch(/[01IOL]/);
  });
});

describe('hashBackupCode', () => {
  it('should produce a consistent hash', async () => {
    const code = 'ABCD-EFGH';
    const hash1 = await hashBackupCode(code);
    const hash2 = await hashBackupCode(code);
    expect(hash1).toBe(hash2);
  });

  it('should produce a hex string', async () => {
    const hash = await hashBackupCode('TEST-CODE');
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('should normalize codes', async () => {
    const hash1 = await hashBackupCode('ABCD-EFGH');
    const hash2 = await hashBackupCode('abcd-efgh');
    const hash3 = await hashBackupCode('ABCDEFGH');

    expect(hash1).toBe(hash2);
    expect(hash1).toBe(hash3);
  });
});

describe('verifyBackupCode', () => {
  it('should verify a valid backup code', async () => {
    const code = 'ABCD-EFGH';
    const hash = await hashBackupCode(code);
    const result = await verifyBackupCode(code, [hash]);

    expect(result.valid).toBe(true);
    expect(result.usedIndex).toBe(0);
  });

  it('should reject an invalid backup code', async () => {
    const hash = await hashBackupCode('REAL-CODE');
    const result = await verifyBackupCode('FAKE-CODE', [hash]);

    expect(result.valid).toBe(false);
    expect(result.usedIndex).toBe(null);
  });

  it('should find code at correct index', async () => {
    const codes = ['CODE-0001', 'CODE-0002', 'CODE-0003'];
    const hashes = await Promise.all(codes.map(hashBackupCode));

    const result = await verifyBackupCode('CODE-0002', hashes);

    expect(result.valid).toBe(true);
    expect(result.usedIndex).toBe(1);
  });

  it('should handle empty hash array', async () => {
    const result = await verifyBackupCode('ANY-CODE', []);

    expect(result.valid).toBe(false);
    expect(result.usedIndex).toBe(null);
  });
});
