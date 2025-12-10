/**
 * Password Policy Enforcement
 *
 * Provides comprehensive password validation with configurable complexity
 * requirements including uppercase, lowercase, numbers, and special characters.
 *
 * @module security/password-policy
 */

import { z } from 'zod';

// Password validation result
export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-100 strength score
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  errors: string[];
  warnings: string[];
  suggestions: string[];
  requirements: {
    minLength: boolean;
    maxLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    noCommonPatterns: boolean;
    noRepeatingChars: boolean;
    noSequentialChars: boolean;
    notInBreachList: boolean;
  };
}

// Password policy configuration
export interface PasswordPolicyConfig {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPatterns: boolean;
  preventRepeatingChars: boolean;
  preventSequentialChars: boolean;
  maxRepeatingChars: number;
  checkBreachedPasswords: boolean;
  customBlacklist: string[];
  specialCharsAllowed: string;
}

// Strength thresholds
interface StrengthThresholds {
  weak: number;
  fair: number;
  good: number;
  strong: number;
}

// Default policy configuration
const DEFAULT_POLICY: PasswordPolicyConfig = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPatterns: true,
  preventRepeatingChars: true,
  preventSequentialChars: true,
  maxRepeatingChars: 3,
  checkBreachedPasswords: false, // Requires API call, disabled by default
  customBlacklist: [],
  specialCharsAllowed: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~',
};

// Strength score thresholds
const STRENGTH_THRESHOLDS: StrengthThresholds = {
  weak: 25,
  fair: 50,
  good: 70,
  strong: 85,
};

// Common password patterns to block
const COMMON_PATTERNS = [
  /^password/i,
  /^123456/,
  /^qwerty/i,
  /^abc123/i,
  /^letmein/i,
  /^welcome/i,
  /^admin/i,
  /^login/i,
  /^pass(word)?123/i,
  /^iloveyou/i,
  /^monkey/i,
  /^dragon/i,
  /^master/i,
  /^sunshine/i,
  /^princess/i,
  /^football/i,
  /^baseball/i,
  /^shadow/i,
  /^ashley/i,
  /^michael/i,
  /^superman/i,
  /^trustno1/i,
  /^password1/i,
  /^test(ing)?123/i,
  /^demo(123)?/i,
  /^gym(123)?/i,
  /^fitness/i,
  /^workout/i,
  /^exercise/i,
];

// Sequential character patterns
const SEQUENTIAL_PATTERNS = [
  'abcdefghijklmnopqrstuvwxyz',
  'zyxwvutsrqponmlkjihgfedcba',
  '0123456789',
  '9876543210',
  'qwertyuiop',
  'poiuytrewq',
  'asdfghjkl',
  'lkjhgfdsa',
  'zxcvbnm',
  'mnbvcxz',
];

// Keyboard patterns to detect
const KEYBOARD_PATTERNS = [
  'qwerty', 'asdfgh', 'zxcvbn', 'qazwsx', 'wsxedc',
  '123qwe', 'qwe123', '1qaz2wsx', '2wsx3edc',
];

/**
 * PasswordPolicyService - Password validation and policy enforcement
 */
class PasswordPolicyService {
  private config: PasswordPolicyConfig;
  private breachCache: Map<string, boolean> = new Map();

  constructor(config?: Partial<PasswordPolicyConfig>) {
    this.config = { ...DEFAULT_POLICY, ...config };
  }

  /**
   * Validate a password against the policy
   */
  async validate(password: string): Promise<PasswordValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Initialize requirements object
    const requirements: PasswordValidationResult['requirements'] = {
      minLength: false,
      maxLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecialChar: false,
      noCommonPatterns: true,
      noRepeatingChars: true,
      noSequentialChars: true,
      notInBreachList: true,
    };

    // Length checks
    if (password.length >= this.config.minLength) {
      requirements.minLength = true;
      score += 15;
      // Bonus for longer passwords
      if (password.length >= 12) score += 5;
      if (password.length >= 16) score += 5;
      if (password.length >= 20) score += 5;
    } else {
      errors.push(`Password must be at least ${this.config.minLength} characters long`);
    }

    if (password.length <= this.config.maxLength) {
      requirements.maxLength = true;
    } else {
      errors.push(`Password must be no more than ${this.config.maxLength} characters long`);
    }

    // Character type checks
    if (/[A-Z]/.test(password)) {
      requirements.hasUppercase = true;
      score += 15;
    } else if (this.config.requireUppercase) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (/[a-z]/.test(password)) {
      requirements.hasLowercase = true;
      score += 15;
    } else if (this.config.requireLowercase) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (/[0-9]/.test(password)) {
      requirements.hasNumber = true;
      score += 15;
    } else if (this.config.requireNumbers) {
      errors.push('Password must contain at least one number');
    }

    // Special character check
    const specialCharRegex = new RegExp(`[${this.escapeRegex(this.config.specialCharsAllowed)}]`);
    if (specialCharRegex.test(password)) {
      requirements.hasSpecialChar = true;
      score += 15;
    } else if (this.config.requireSpecialChars) {
      errors.push('Password must contain at least one special character (!@#$%^&* etc.)');
    }

    // Common pattern check
    if (this.config.preventCommonPatterns) {
      const hasCommonPattern = COMMON_PATTERNS.some(pattern => pattern.test(password));
      if (hasCommonPattern) {
        requirements.noCommonPatterns = false;
        errors.push('Password is too common or easily guessable');
        score -= 20;
      } else {
        score += 5;
      }

      // Check custom blacklist
      const lowerPassword = password.toLowerCase();
      if (this.config.customBlacklist.some(word => lowerPassword.includes(word.toLowerCase()))) {
        requirements.noCommonPatterns = false;
        errors.push('Password contains a blacklisted word');
        score -= 10;
      }
    }

    // Repeating characters check
    if (this.config.preventRepeatingChars) {
      const repeatingPattern = new RegExp(`(.)\\1{${this.config.maxRepeatingChars},}`);
      if (repeatingPattern.test(password)) {
        requirements.noRepeatingChars = false;
        warnings.push(`Avoid repeating the same character more than ${this.config.maxRepeatingChars} times`);
        score -= 10;
      }
    }

    // Sequential characters check
    if (this.config.preventSequentialChars) {
      if (this.hasSequentialChars(password)) {
        requirements.noSequentialChars = false;
        warnings.push('Avoid sequential characters (abc, 123, qwerty)');
        score -= 10;
      }

      if (this.hasKeyboardPattern(password)) {
        requirements.noSequentialChars = false;
        warnings.push('Avoid keyboard patterns');
        score -= 5;
      }
    }

    // Breached password check
    if (this.config.checkBreachedPasswords) {
      const isBreached = await this.checkBreached(password);
      if (isBreached) {
        requirements.notInBreachList = false;
        errors.push('This password has appeared in a data breach and should not be used');
        score = Math.min(score, 20); // Cap score for breached passwords
      }
    }

    // Add entropy bonus
    const entropy = this.calculateEntropy(password);
    if (entropy > 60) score += 10;
    if (entropy > 80) score += 5;

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Generate suggestions
    if (!requirements.hasUppercase) {
      suggestions.push('Add uppercase letters for more security');
    }
    if (!requirements.hasLowercase) {
      suggestions.push('Add lowercase letters for more security');
    }
    if (!requirements.hasNumber) {
      suggestions.push('Add numbers for more security');
    }
    if (!requirements.hasSpecialChar) {
      suggestions.push('Add special characters (!@#$%^&*) for more security');
    }
    if (password.length < 12) {
      suggestions.push('Consider using a longer password (12+ characters)');
    }
    if (password.length < 16 && score >= 70) {
      suggestions.push('For maximum security, use 16+ characters');
    }

    // Calculate strength
    const strength = this.getStrength(score);

    return {
      isValid: errors.length === 0,
      score,
      strength,
      errors,
      warnings,
      suggestions,
      requirements,
    };
  }

  /**
   * Quick synchronous validation (without breach check)
   */
  validateSync(password: string): PasswordValidationResult {
    // Temporarily disable breach check for sync validation
    const originalSetting = this.config.checkBreachedPasswords;
    this.config.checkBreachedPasswords = false;

    // This is a workaround - the async validation is called but awaited synchronously
    // In practice, use the async version
    let result: PasswordValidationResult | null = null;
    this.validate(password).then(r => result = r);

    // Restore setting
    this.config.checkBreachedPasswords = originalSetting;

    // Fallback if async didn't complete (which it won't in sync context)
    // Re-implement sync logic
    return this.validateSyncInternal(password);
  }

  /**
   * Internal sync validation implementation
   */
  private validateSyncInternal(password: string): PasswordValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    const requirements: PasswordValidationResult['requirements'] = {
      minLength: password.length >= this.config.minLength,
      maxLength: password.length <= this.config.maxLength,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: new RegExp(`[${this.escapeRegex(this.config.specialCharsAllowed)}]`).test(password),
      noCommonPatterns: !COMMON_PATTERNS.some(p => p.test(password)),
      noRepeatingChars: !new RegExp(`(.)\\1{${this.config.maxRepeatingChars},}`).test(password),
      noSequentialChars: !this.hasSequentialChars(password),
      notInBreachList: true, // Can't check synchronously
    };

    // Build errors and score
    if (!requirements.minLength) errors.push(`Minimum ${this.config.minLength} characters required`);
    else score += 15;

    if (!requirements.maxLength) errors.push(`Maximum ${this.config.maxLength} characters allowed`);

    if (!requirements.hasUppercase && this.config.requireUppercase) errors.push('Uppercase letter required');
    else if (requirements.hasUppercase) score += 15;

    if (!requirements.hasLowercase && this.config.requireLowercase) errors.push('Lowercase letter required');
    else if (requirements.hasLowercase) score += 15;

    if (!requirements.hasNumber && this.config.requireNumbers) errors.push('Number required');
    else if (requirements.hasNumber) score += 15;

    if (!requirements.hasSpecialChar && this.config.requireSpecialChars) errors.push('Special character required');
    else if (requirements.hasSpecialChar) score += 15;

    if (!requirements.noCommonPatterns) errors.push('Password is too common');
    if (!requirements.noRepeatingChars) warnings.push('Avoid repeating characters');
    if (!requirements.noSequentialChars) warnings.push('Avoid sequential characters');

    // Length bonuses
    if (password.length >= 12) score += 5;
    if (password.length >= 16) score += 5;
    if (password.length >= 20) score += 5;

    score = Math.max(0, Math.min(100, score));

    return {
      isValid: errors.length === 0,
      score,
      strength: this.getStrength(score),
      errors,
      warnings,
      suggestions,
      requirements,
    };
  }

  /**
   * Check if password has sequential characters
   */
  private hasSequentialChars(password: string): boolean {
    const lower = password.toLowerCase();
    for (const pattern of SEQUENTIAL_PATTERNS) {
      for (let i = 0; i <= pattern.length - 4; i++) {
        const seq = pattern.slice(i, i + 4);
        if (lower.includes(seq)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check for keyboard patterns
   */
  private hasKeyboardPattern(password: string): boolean {
    const lower = password.toLowerCase();
    return KEYBOARD_PATTERNS.some(pattern => lower.includes(pattern));
  }

  /**
   * Calculate password entropy (bits)
   */
  private calculateEntropy(password: string): number {
    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (new RegExp(`[${this.escapeRegex(this.config.specialCharsAllowed)}]`).test(password)) {
      charsetSize += this.config.specialCharsAllowed.length;
    }

    if (charsetSize === 0) return 0;
    return password.length * Math.log2(charsetSize);
  }

  /**
   * Check if password appears in breach databases
   * Uses k-anonymity model (only sends first 5 chars of hash)
   */
  private async checkBreached(password: string): Promise<boolean> {
    try {
      // Create SHA-1 hash of password
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

      // Check cache
      if (this.breachCache.has(hashHex)) {
        return this.breachCache.get(hashHex)!;
      }

      // k-anonymity: only send first 5 characters
      const prefix = hashHex.slice(0, 5);
      const suffix = hashHex.slice(5);

      // Query Have I Been Pwned API
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);

      if (!response.ok) {
        console.warn('Failed to check breached passwords');
        return false;
      }

      const text = await response.text();
      const lines = text.split('\n');
      const isBreached = lines.some(line => {
        const [hash] = line.split(':');
        return hash.trim() === suffix;
      });

      // Cache result
      this.breachCache.set(hashHex, isBreached);

      return isBreached;
    } catch (error) {
      console.warn('Breach check failed:', error);
      return false;
    }
  }

  /**
   * Get strength label from score
   */
  private getStrength(score: number): PasswordValidationResult['strength'] {
    if (score >= STRENGTH_THRESHOLDS.strong) return 'very-strong';
    if (score >= STRENGTH_THRESHOLDS.good) return 'strong';
    if (score >= STRENGTH_THRESHOLDS.fair) return 'good';
    if (score >= STRENGTH_THRESHOLDS.weak) return 'fair';
    return 'weak';
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Generate a strong random password
   */
  generatePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=';

    let password = '';
    const allChars = lowercase + uppercase + numbers + special;

    // Ensure at least one of each type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill rest with random characters
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Update policy configuration
   */
  configure(config: Partial<PasswordPolicyConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current policy configuration
   */
  getPolicy(): PasswordPolicyConfig {
    return { ...this.config };
  }

  /**
   * Create a Zod schema for password validation
   */
  createZodSchema(): z.ZodString {
    let schema = z.string()
      .min(this.config.minLength, `Password must be at least ${this.config.minLength} characters`)
      .max(this.config.maxLength, `Password must be at most ${this.config.maxLength} characters`);

    if (this.config.requireUppercase) {
      schema = schema.refine(
        (val) => /[A-Z]/.test(val),
        'Password must contain at least one uppercase letter'
      ) as unknown as z.ZodString;
    }

    if (this.config.requireLowercase) {
      schema = schema.refine(
        (val) => /[a-z]/.test(val),
        'Password must contain at least one lowercase letter'
      ) as unknown as z.ZodString;
    }

    if (this.config.requireNumbers) {
      schema = schema.refine(
        (val) => /[0-9]/.test(val),
        'Password must contain at least one number'
      ) as unknown as z.ZodString;
    }

    if (this.config.requireSpecialChars) {
      schema = schema.refine(
        (val) => new RegExp(`[${this.escapeRegex(this.config.specialCharsAllowed)}]`).test(val),
        'Password must contain at least one special character'
      ) as unknown as z.ZodString;
    }

    return schema;
  }
}

// Export singleton instance
export const passwordPolicy = new PasswordPolicyService();

// Convenience exports
export const validatePassword = (password: string) => passwordPolicy.validate(password);
export const validatePasswordSync = (password: string) => passwordPolicy.validateSync(password);
export const generatePassword = (length?: number) => passwordPolicy.generatePassword(length);

// Export default policy for reference
export { DEFAULT_POLICY, STRENGTH_THRESHOLDS };
