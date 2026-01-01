import { describe, it, expect } from 'vitest';
import {
  isString,
  isNonEmptyString,
  isNumber,
  isPositiveNumber,
  isBoolean,
  isNull,
  isUndefined,
  isNullish,
  isDefined,
  isObject,
  isArray,
  isNonEmptyArray,
  isFunction,
  isDate,
  isISODateString,
  isMember,
  isOrganization,
  isProfile,
  isUserRole,
  isCheckIn,
  isClassBooking,
  isSupabaseError,
  isSuccessfulResponse,
  isUUID,
  isEmail,
  isPhoneNumber,
  assertDefined,
  assertNonEmptyString,
  safeGet,
  coalesce,
  parseNumber,
  parseBoolean,
} from './type-guards';

describe('Primitive Type Guards', () => {
  describe('isString', () => {
    it('should return true for strings', () => {
      expect(isString('')).toBe(true);
      expect(isString('hello')).toBe(true);
      expect(isString('123')).toBe(true);
    });

    it('should return false for non-strings', () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString([])).toBe(false);
    });
  });

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString(' ')).toBe(true);
      expect(isNonEmptyString('123')).toBe(true);
    });

    it('should return false for empty strings and non-strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isNumber(0)).toBe(true);
      expect(isNumber(42)).toBe(true);
      expect(isNumber(-1)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
      expect(isNumber(Infinity)).toBe(true);
    });

    it('should return false for NaN and non-numbers', () => {
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber('42')).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
    });
  });

  describe('isPositiveNumber', () => {
    it('should return true for positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(0.1)).toBe(true);
      expect(isPositiveNumber(Infinity)).toBe(true);
    });

    it('should return false for zero, negative, and non-numbers', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber('1')).toBe(false);
    });
  });

  describe('isBoolean', () => {
    it('should return true for booleans', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
    });

    it('should return false for non-booleans', () => {
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean('true')).toBe(false);
      expect(isBoolean(null)).toBe(false);
    });
  });

  describe('isNull/isUndefined/isNullish/isDefined', () => {
    it('should correctly identify null', () => {
      expect(isNull(null)).toBe(true);
      expect(isNull(undefined)).toBe(false);
      expect(isNull('')).toBe(false);
    });

    it('should correctly identify undefined', () => {
      expect(isUndefined(undefined)).toBe(true);
      expect(isUndefined(null)).toBe(false);
      expect(isUndefined('')).toBe(false);
    });

    it('should correctly identify nullish values', () => {
      expect(isNullish(null)).toBe(true);
      expect(isNullish(undefined)).toBe(true);
      expect(isNullish('')).toBe(false);
      expect(isNullish(0)).toBe(false);
    });

    it('should correctly identify defined values', () => {
      expect(isDefined('')).toBe(true);
      expect(isDefined(0)).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
    });
  });
});

describe('Object Type Guards', () => {
  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
    });

    it('should return false for non-plain objects', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject([])).toBe(false);
      expect(isObject(new Date())).toBe(false);
      expect(isObject(() => {})).toBe(false);
      expect(isObject('string')).toBe(false);
    });
  });

  describe('isArray/isNonEmptyArray', () => {
    it('should correctly identify arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray({})).toBe(false);
      expect(isArray('[]')).toBe(false);
    });

    it('should correctly identify non-empty arrays', () => {
      expect(isNonEmptyArray([1])).toBe(true);
      expect(isNonEmptyArray([1, 2, 3])).toBe(true);
      expect(isNonEmptyArray([])).toBe(false);
      expect(isNonEmptyArray(null)).toBe(false);
    });
  });

  describe('isFunction', () => {
    it('should return true for functions', () => {
      expect(isFunction(() => {})).toBe(true);
      expect(isFunction(function() {})).toBe(true);
      expect(isFunction(async () => {})).toBe(true);
    });

    it('should return false for non-functions', () => {
      expect(isFunction({})).toBe(false);
      expect(isFunction('function')).toBe(false);
    });
  });

  describe('isDate/isISODateString', () => {
    it('should correctly identify Date objects', () => {
      expect(isDate(new Date())).toBe(true);
      expect(isDate(new Date('2024-01-01'))).toBe(true);
      expect(isDate(new Date('invalid'))).toBe(false);
      expect(isDate('2024-01-01')).toBe(false);
    });

    it('should correctly identify ISO date strings', () => {
      expect(isISODateString('2024-01-01T00:00:00Z')).toBe(true);
      expect(isISODateString('2024-01-01T12:30:00.000Z')).toBe(true);
      expect(isISODateString('2024-01-01')).toBe(false);
      expect(isISODateString('invalid')).toBe(false);
      expect(isISODateString(new Date())).toBe(false);
    });
  });
});

describe('Domain-Specific Type Guards', () => {
  describe('isMember', () => {
    it('should return true for valid member objects', () => {
      expect(isMember({
        id: 'member-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      })).toBe(true);

      expect(isMember({
        id: 'member-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        first_name: 'John',
        last_name: 'Doe',
      })).toBe(true);
    });

    it('should return false for invalid member objects', () => {
      expect(isMember({})).toBe(false);
      expect(isMember({ id: 'member-123' })).toBe(false);
      expect(isMember({ id: '', email: 'test@example.com', created_at: '2024-01-01' })).toBe(false);
      expect(isMember(null)).toBe(false);
      expect(isMember('member')).toBe(false);
    });
  });

  describe('isOrganization', () => {
    it('should return true for valid organization objects', () => {
      expect(isOrganization({ id: 'org-123', name: 'Test Gym' })).toBe(true);
      expect(isOrganization({ id: 'org-123', name: 'Test Gym', slug: 'test-gym' })).toBe(true);
    });

    it('should return false for invalid organization objects', () => {
      expect(isOrganization({})).toBe(false);
      expect(isOrganization({ id: 'org-123' })).toBe(false);
      expect(isOrganization({ name: 'Test Gym' })).toBe(false);
      expect(isOrganization(null)).toBe(false);
    });
  });

  describe('isProfile', () => {
    it('should return true for valid profile objects', () => {
      expect(isProfile({
        id: 'profile-123',
        email: 'test@example.com',
        role: 'owner',
      })).toBe(true);
    });

    it('should return false for invalid profile objects', () => {
      expect(isProfile({})).toBe(false);
      expect(isProfile({ id: 'profile-123', email: 'test@example.com' })).toBe(false);
    });
  });

  describe('isUserRole', () => {
    it('should return true for valid roles', () => {
      expect(isUserRole('owner')).toBe(true);
      expect(isUserRole('manager')).toBe(true);
      expect(isUserRole('staff')).toBe(true);
      expect(isUserRole('trainer')).toBe(true);
      expect(isUserRole('member')).toBe(true);
    });

    it('should return false for invalid roles', () => {
      expect(isUserRole('admin')).toBe(false);
      expect(isUserRole('user')).toBe(false);
      expect(isUserRole('')).toBe(false);
      expect(isUserRole(null)).toBe(false);
    });
  });

  describe('isCheckIn', () => {
    it('should return true for valid check-in objects', () => {
      expect(isCheckIn({
        member_id: 'member-123',
        organization_id: 'org-456',
        location_id: 'loc-789',
      })).toBe(true);
    });

    it('should return false for invalid check-in objects', () => {
      expect(isCheckIn({})).toBe(false);
      expect(isCheckIn({ member_id: 'member-123' })).toBe(false);
    });
  });

  describe('isClassBooking', () => {
    it('should return true for valid class booking objects', () => {
      expect(isClassBooking({
        id: 'booking-123',
        class_id: 'class-456',
        member_id: 'member-789',
        status: 'confirmed',
      })).toBe(true);
    });

    it('should return false for invalid class booking objects', () => {
      expect(isClassBooking({})).toBe(false);
      expect(isClassBooking({ id: 'booking-123' })).toBe(false);
    });
  });
});

describe('API Response Type Guards', () => {
  describe('isSupabaseError', () => {
    it('should return true for Supabase error objects', () => {
      expect(isSupabaseError({ message: 'Error occurred' })).toBe(true);
      expect(isSupabaseError({ message: 'Error', code: 'PGRST001' })).toBe(true);
    });

    it('should return false for non-error objects', () => {
      expect(isSupabaseError({})).toBe(false);
      expect(isSupabaseError({ code: 'PGRST001' })).toBe(false);
      expect(isSupabaseError(null)).toBe(false);
    });
  });

  describe('isSuccessfulResponse', () => {
    it('should return true for successful responses', () => {
      expect(isSuccessfulResponse({ data: { id: '123' }, error: null })).toBe(true);
      expect(isSuccessfulResponse({ data: [], error: null })).toBe(true);
    });

    it('should return false for error responses', () => {
      expect(isSuccessfulResponse({ data: null, error: { message: 'Error' } })).toBe(false);
      expect(isSuccessfulResponse({ data: null, error: null })).toBe(false);
    });
  });
});

describe('Validation Type Guards', () => {
  describe('isUUID', () => {
    it('should return true for valid UUIDs', () => {
      expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    });

    it('should return false for invalid UUIDs', () => {
      expect(isUUID('not-a-uuid')).toBe(false);
      expect(isUUID('550e8400-e29b-41d4-a716')).toBe(false);
      expect(isUUID('')).toBe(false);
      expect(isUUID(123)).toBe(false);
    });
  });

  describe('isEmail', () => {
    it('should return true for valid emails', () => {
      expect(isEmail('test@example.com')).toBe(true);
      expect(isEmail('user.name@domain.co.uk')).toBe(true);
      expect(isEmail('user+tag@example.com')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isEmail('not-an-email')).toBe(false);
      expect(isEmail('@example.com')).toBe(false);
      expect(isEmail('test@')).toBe(false);
      expect(isEmail('')).toBe(false);
      expect(isEmail(null)).toBe(false);
    });
  });

  describe('isPhoneNumber', () => {
    it('should return true for valid phone numbers', () => {
      // Basic numeric formats
      expect(isPhoneNumber('5551234567')).toBe(true);
      expect(isPhoneNumber('123-456-7890')).toBe(true);
      expect(isPhoneNumber('+1 555 123 4567')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(isPhoneNumber('abc-defg')).toBe(false);
      expect(isPhoneNumber('')).toBe(false);
      expect(isPhoneNumber(null)).toBe(false);
    });
  });
});

describe('Utility Functions', () => {
  describe('assertDefined', () => {
    it('should not throw for defined values', () => {
      expect(() => assertDefined('value')).not.toThrow();
      expect(() => assertDefined(0)).not.toThrow();
      expect(() => assertDefined(false)).not.toThrow();
      expect(() => assertDefined({})).not.toThrow();
    });

    it('should throw for null or undefined', () => {
      expect(() => assertDefined(null)).toThrow('Expected value to be defined');
      expect(() => assertDefined(undefined)).toThrow('Expected value to be defined');
      expect(() => assertDefined(null, 'Custom message')).toThrow('Custom message');
    });
  });

  describe('assertNonEmptyString', () => {
    it('should not throw for non-empty strings', () => {
      expect(() => assertNonEmptyString('value')).not.toThrow();
      expect(() => assertNonEmptyString(' ')).not.toThrow();
    });

    it('should throw for empty strings and non-strings', () => {
      expect(() => assertNonEmptyString('')).toThrow();
      expect(() => assertNonEmptyString(null)).toThrow();
      expect(() => assertNonEmptyString(123)).toThrow();
    });
  });

  describe('safeGet', () => {
    it('should return property value for defined objects', () => {
      expect(safeGet({ name: 'John' }, 'name')).toBe('John');
      expect(safeGet({ count: 0 }, 'count')).toBe(0);
    });

    it('should return undefined for null or undefined objects', () => {
      expect(safeGet(null, 'name' as never)).toBeUndefined();
      expect(safeGet(undefined, 'name' as never)).toBeUndefined();
    });
  });

  describe('coalesce', () => {
    it('should return value if not nullish', () => {
      expect(coalesce('value', 'default')).toBe('value');
      expect(coalesce(0, 1)).toBe(0);
      expect(coalesce(false, true)).toBe(false);
      expect(coalesce('', 'default')).toBe('');
    });

    it('should return default for null or undefined', () => {
      expect(coalesce(null, 'default')).toBe('default');
      expect(coalesce(undefined, 'default')).toBe('default');
    });
  });

  describe('parseNumber', () => {
    it('should parse valid numbers', () => {
      expect(parseNumber(42)).toBe(42);
      expect(parseNumber('42')).toBe(42);
      expect(parseNumber('3.14')).toBe(3.14);
      expect(parseNumber('-10')).toBe(-10);
    });

    it('should return undefined for invalid inputs', () => {
      expect(parseNumber('not a number')).toBeUndefined();
      expect(parseNumber(null)).toBeUndefined();
      expect(parseNumber({})).toBeUndefined();
      expect(parseNumber(NaN)).toBeUndefined();
    });
  });

  describe('parseBoolean', () => {
    it('should parse valid booleans', () => {
      expect(parseBoolean(true)).toBe(true);
      expect(parseBoolean(false)).toBe(false);
      expect(parseBoolean('true')).toBe(true);
      expect(parseBoolean('false')).toBe(false);
      expect(parseBoolean('1')).toBe(true);
      expect(parseBoolean('0')).toBe(false);
    });

    it('should return undefined for invalid inputs', () => {
      expect(parseBoolean('yes')).toBeUndefined();
      expect(parseBoolean(null)).toBeUndefined();
      expect(parseBoolean(1)).toBeUndefined();
    });
  });
});
