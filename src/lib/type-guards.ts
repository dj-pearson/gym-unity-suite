/**
 * Type Guards - Runtime type checking utilities
 *
 * Since TypeScript config is relaxed (noImplicitAny: false, strictNullChecks: false),
 * these type guards provide runtime safety for critical operations.
 *
 * Usage:
 * ```typescript
 * import { isString, isNonEmptyString, isMember } from '@/lib/type-guards';
 *
 * if (isNonEmptyString(organizationId)) {
 *   // TypeScript now knows organizationId is a string
 *   await fetchMembers(organizationId);
 * }
 * ```
 */

// ============================================================================
// Primitive Type Guards
// ============================================================================

/**
 * Check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if value is a non-empty string (not null, undefined, or '')
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Check if value is a number (not NaN)
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * Check if value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

/**
 * Check if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Check if value is null
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

/**
 * Check if value is undefined
 */
export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

/**
 * Check if value is null or undefined (nullish)
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Check if value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// ============================================================================
// Object Type Guards
// ============================================================================

/**
 * Check if value is a plain object (not null, not array, not function)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp)
  );
}

/**
 * Check if value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Check if value is a non-empty array
 */
export function isNonEmptyArray<T>(value: unknown): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Check if value is a function
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * Check if value is a Date object
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/**
 * Check if value is a valid ISO date string
 */
export function isISODateString(value: unknown): value is string {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && value.includes('T');
}

// ============================================================================
// Domain-Specific Type Guards (Gym Unity Suite)
// ============================================================================

/**
 * Member interface for type checking
 */
export interface MemberShape {
  id: string;
  email: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  organization_id?: string;
}

/**
 * Check if value is a valid Member object
 */
export function isMember(value: unknown): value is MemberShape {
  if (!isObject(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.email) &&
    isNonEmptyString(value.created_at)
  );
}

/**
 * Organization interface for type checking
 */
export interface OrganizationShape {
  id: string;
  name: string;
  slug?: string;
  created_at?: string;
}

/**
 * Check if value is a valid Organization object
 */
export function isOrganization(value: unknown): value is OrganizationShape {
  if (!isObject(value)) return false;
  return isNonEmptyString(value.id) && isNonEmptyString(value.name);
}

/**
 * Profile interface for type checking
 */
export interface ProfileShape {
  id: string;
  email: string;
  role: string;
  organization_id?: string;
}

/**
 * Check if value is a valid Profile object
 */
export function isProfile(value: unknown): value is ProfileShape {
  if (!isObject(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.email) &&
    isNonEmptyString(value.role)
  );
}

/**
 * User role type
 */
export type UserRole = 'owner' | 'manager' | 'staff' | 'trainer' | 'member';

const VALID_ROLES: UserRole[] = ['owner', 'manager', 'staff', 'trainer', 'member'];

/**
 * Check if value is a valid user role
 */
export function isUserRole(value: unknown): value is UserRole {
  return isString(value) && VALID_ROLES.includes(value as UserRole);
}

/**
 * Check-in data interface for type checking
 */
export interface CheckInShape {
  id?: string;
  member_id: string;
  organization_id: string;
  location_id: string;
  checked_in_at?: string;
}

/**
 * Check if value is a valid CheckIn object
 */
export function isCheckIn(value: unknown): value is CheckInShape {
  if (!isObject(value)) return false;
  return (
    isNonEmptyString(value.member_id) &&
    isNonEmptyString(value.organization_id) &&
    isNonEmptyString(value.location_id)
  );
}

/**
 * Class booking interface for type checking
 */
export interface ClassBookingShape {
  id: string;
  class_id: string;
  member_id: string;
  status: string;
  booked_at?: string;
}

/**
 * Check if value is a valid ClassBooking object
 */
export function isClassBooking(value: unknown): value is ClassBookingShape {
  if (!isObject(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.class_id) &&
    isNonEmptyString(value.member_id) &&
    isNonEmptyString(value.status)
  );
}

// ============================================================================
// API Response Type Guards
// ============================================================================

/**
 * Supabase API error shape
 */
export interface SupabaseErrorShape {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Check if value is a Supabase error
 */
export function isSupabaseError(value: unknown): value is SupabaseErrorShape {
  if (!isObject(value)) return false;
  return isNonEmptyString(value.message);
}

/**
 * Check if value is a successful Supabase response (has data, no error)
 */
export function isSuccessfulResponse<T>(
  response: { data: T | null; error: unknown }
): response is { data: T; error: null } {
  return response.error === null && response.data !== null;
}

// ============================================================================
// UUID Validation
// ============================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Check if value is a valid UUID v4
 */
export function isUUID(value: unknown): value is string {
  return isString(value) && UUID_REGEX.test(value);
}

// ============================================================================
// Email Validation
// ============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Check if value is a valid email address
 */
export function isEmail(value: unknown): value is string {
  return isString(value) && EMAIL_REGEX.test(value);
}

// ============================================================================
// Phone Validation
// ============================================================================

// Matches common phone formats: +1 555 123 4567, 555-1234, (555) 123-4567, etc.
const PHONE_REGEX = /^[+]?[\d][\d\s().-]{5,}$/;

/**
 * Check if value is a valid phone number format
 * Matches common formats including international prefixes
 */
export function isPhoneNumber(value: unknown): value is string {
  return isString(value) && PHONE_REGEX.test(value);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Assert that a value is defined, throwing an error if not
 * Useful for narrowing types when you're certain a value exists
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message = 'Expected value to be defined'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * Assert that a value is a non-empty string
 */
export function assertNonEmptyString(
  value: unknown,
  message = 'Expected non-empty string'
): asserts value is string {
  if (!isNonEmptyString(value)) {
    throw new Error(message);
  }
}

/**
 * Assert that a value is a valid organization ID
 */
export function assertOrganizationId(
  value: unknown,
  message = 'Expected valid organization ID'
): asserts value is string {
  if (!isNonEmptyString(value)) {
    throw new Error(message);
  }
}

/**
 * Safe property access that returns undefined for nullish values
 */
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  if (obj === null || obj === undefined) return undefined;
  return obj[key];
}

/**
 * Coalesce to provide a default value for nullish values
 */
export function coalesce<T>(value: T | null | undefined, defaultValue: T): T {
  return value ?? defaultValue;
}

/**
 * Parse a value as a number, returning undefined if parsing fails
 */
export function parseNumber(value: unknown): number | undefined {
  if (isNumber(value)) return value;
  if (isString(value)) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

/**
 * Parse a value as a boolean
 */
export function parseBoolean(value: unknown): boolean | undefined {
  if (isBoolean(value)) return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return undefined;
}
