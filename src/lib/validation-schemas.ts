/**
 * Reusable Zod Validation Schemas
 *
 * Standardized validation schemas for common form patterns across the platform.
 * These schemas provide consistent error messages and validation rules.
 *
 * Usage:
 * ```typescript
 * import { memberFormSchema, classBookingSchema } from '@/lib/validation-schemas';
 *
 * const form = useForm({
 *   resolver: zodResolver(memberFormSchema),
 * });
 * ```
 */

import { z } from 'zod';

// ============================================================================
// Base Schemas (Reusable Primitives)
// ============================================================================

/**
 * Non-empty string with trimming (trims first, then validates)
 */
export const nonEmptyString = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, { message: 'This field is required' });

/**
 * Optional string that trims whitespace
 */
export const optionalString = z
  .string()
  .optional()
  .transform((val) => val?.trim() || undefined);

/**
 * Email validation with standardized error message
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .transform((val) => val.toLowerCase().trim());

/**
 * Optional email validation
 */
export const optionalEmailSchema = z
  .string()
  .email('Please enter a valid email address')
  .optional()
  .or(z.literal(''))
  .transform((val) => (val ? val.toLowerCase().trim() : undefined));

// Flexible phone regex: matches +1 555 123 4567, 555-1234, (555) 123-4567, etc.
const PHONE_REGEX = /^[+]?[\d][\d\s().-]{5,}$/;

/**
 * Phone number validation (flexible format)
 */
export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(PHONE_REGEX, 'Please enter a valid phone number')
  .transform((val) => val.replace(/\s+/g, ' ').trim());

/**
 * Optional phone number validation
 */
export const optionalPhoneSchema = z
  .string()
  .regex(PHONE_REGEX, 'Please enter a valid phone number')
  .optional()
  .or(z.literal(''))
  .transform((val) => (val ? val.replace(/\s+/g, ' ').trim() : undefined));

/**
 * UUID validation
 */
export const uuidSchema = z
  .string()
  .uuid('Please enter a valid ID');

/**
 * Optional UUID validation
 */
export const optionalUuidSchema = z
  .string()
  .uuid('Please enter a valid ID')
  .optional()
  .or(z.literal(''));

/**
 * URL validation
 */
export const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .optional()
  .or(z.literal(''));

/**
 * Positive number validation
 */
export const positiveNumberSchema = z
  .number({ invalid_type_error: 'Please enter a valid number' })
  .positive('Must be a positive number');

/**
 * Non-negative number (0 or greater)
 */
export const nonNegativeNumberSchema = z
  .number({ invalid_type_error: 'Please enter a valid number' })
  .min(0, 'Cannot be negative');

/**
 * Price/currency validation (up to 2 decimal places)
 */
export const priceSchema = z
  .number({ invalid_type_error: 'Please enter a valid price' })
  .min(0, 'Price cannot be negative')
  .multipleOf(0.01, 'Price can have at most 2 decimal places');

/**
 * Percentage validation (0-100)
 */
export const percentageSchema = z
  .number({ invalid_type_error: 'Please enter a valid percentage' })
  .min(0, 'Percentage must be at least 0')
  .max(100, 'Percentage cannot exceed 100');

/**
 * Date validation (ISO string or Date object)
 */
export const dateSchema = z.coerce.date({
  required_error: 'Date is required',
  invalid_type_error: 'Please enter a valid date',
});

/**
 * Optional date validation
 */
export const optionalDateSchema = z.coerce
  .date()
  .optional()
  .nullable();

/**
 * Future date validation
 */
export const futureDateSchema = z.coerce
  .date()
  .refine((date) => date > new Date(), {
    message: 'Date must be in the future',
  });

/**
 * Past date validation
 */
export const pastDateSchema = z.coerce
  .date()
  .refine((date) => date < new Date(), {
    message: 'Date must be in the past',
  });

// ============================================================================
// Domain Schemas (Gym Unity Suite Specific)
// ============================================================================

/**
 * User role validation
 */
export const userRoleSchema = z.enum(['owner', 'manager', 'staff', 'trainer', 'member'], {
  errorMap: () => ({ message: 'Please select a valid role' }),
});

/**
 * Membership status validation
 */
export const membershipStatusSchema = z.enum(
  ['active', 'inactive', 'frozen', 'cancelled', 'expired', 'pending'],
  {
    errorMap: () => ({ message: 'Please select a valid status' }),
  }
);

/**
 * Payment status validation
 */
export const paymentStatusSchema = z.enum(
  ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
  {
    errorMap: () => ({ message: 'Please select a valid payment status' }),
  }
);

/**
 * Class booking status validation
 */
export const bookingStatusSchema = z.enum(
  ['confirmed', 'waitlisted', 'cancelled', 'attended', 'no_show'],
  {
    errorMap: () => ({ message: 'Please select a valid booking status' }),
  }
);

// ============================================================================
// Form Schemas (Complete Form Validations)
// ============================================================================

/**
 * Member registration/creation form schema
 */
export const memberFormSchema = z.object({
  email: emailSchema,
  first_name: nonEmptyString.refine((val) => val.length >= 2, {
    message: 'First name must be at least 2 characters',
  }),
  last_name: nonEmptyString.refine((val) => val.length >= 2, {
    message: 'Last name must be at least 2 characters',
  }),
  phone: optionalPhoneSchema,
  date_of_birth: optionalDateSchema,
  address: optionalString,
  city: optionalString,
  state: optionalString,
  zip_code: optionalString,
  emergency_contact_name: optionalString,
  emergency_contact_phone: optionalPhoneSchema,
  notes: optionalString,
});

export type MemberFormValues = z.infer<typeof memberFormSchema>;

/**
 * Staff/Employee form schema
 */
export const staffFormSchema = z.object({
  email: emailSchema,
  first_name: nonEmptyString.refine((val) => val.length >= 2, {
    message: 'First name must be at least 2 characters',
  }),
  last_name: nonEmptyString.refine((val) => val.length >= 2, {
    message: 'Last name must be at least 2 characters',
  }),
  role: userRoleSchema,
  phone: optionalPhoneSchema,
  hire_date: optionalDateSchema,
  hourly_rate: priceSchema.optional(),
  department: optionalString,
  notes: optionalString,
});

export type StaffFormValues = z.infer<typeof staffFormSchema>;

/**
 * Class creation/editing form schema
 */
export const classFormSchema = z
  .object({
    name: nonEmptyString.refine((val) => val.length >= 3, {
      message: 'Class name must be at least 3 characters',
    }),
    description: optionalString,
    instructor_id: uuidSchema,
    location_id: optionalUuidSchema,
    start_time: dateSchema,
    end_time: dateSchema,
    capacity: positiveNumberSchema.int('Capacity must be a whole number'),
    waitlist_capacity: nonNegativeNumberSchema.int().default(0),
    recurring: z.boolean().default(false),
    recurrence_pattern: optionalString,
    category: optionalString,
    level: z.enum(['beginner', 'intermediate', 'advanced', 'all_levels']).optional(),
    notes: optionalString,
  })
  .refine((data) => data.end_time > data.start_time, {
    message: 'End time must be after start time',
    path: ['end_time'],
  });

export type ClassFormValues = z.infer<typeof classFormSchema>;

/**
 * Class booking form schema
 */
export const classBookingFormSchema = z.object({
  class_id: uuidSchema,
  member_id: uuidSchema,
  notes: optionalString,
});

export type ClassBookingFormValues = z.infer<typeof classBookingFormSchema>;

/**
 * Membership plan form schema
 */
export const membershipPlanFormSchema = z.object({
  name: nonEmptyString.refine((val) => val.length >= 3, {
    message: 'Plan name must be at least 3 characters',
  }),
  description: optionalString,
  price: priceSchema,
  billing_period: z.enum(['monthly', 'quarterly', 'semi_annual', 'annual', 'one_time'], {
    errorMap: () => ({ message: 'Please select a billing period' }),
  }),
  duration_days: positiveNumberSchema.int('Duration must be a whole number'),
  features: z.array(z.string()).optional(),
  max_classes_per_month: nonNegativeNumberSchema.int().optional(),
  guest_passes: nonNegativeNumberSchema.int().default(0),
  freeze_days: nonNegativeNumberSchema.int().default(0),
  is_active: z.boolean().default(true),
  is_public: z.boolean().default(true),
});

export type MembershipPlanFormValues = z.infer<typeof membershipPlanFormSchema>;

/**
 * Check-in form schema
 */
export const checkInFormSchema = z.object({
  member_id: uuidSchema,
  location_id: uuidSchema,
  notes: optionalString,
  check_in_type: z.enum(['regular', 'guest', 'trial', 'day_pass']).default('regular'),
});

export type CheckInFormValues = z.infer<typeof checkInFormSchema>;

/**
 * Lead/CRM form schema
 */
export const leadFormSchema = z.object({
  first_name: nonEmptyString.refine((val) => val.length >= 2, {
    message: 'First name must be at least 2 characters',
  }),
  last_name: nonEmptyString.refine((val) => val.length >= 2, {
    message: 'Last name must be at least 2 characters',
  }),
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
  source: z.enum([
    'website',
    'referral',
    'walk_in',
    'social_media',
    'advertisement',
    'event',
    'other',
  ]).optional(),
  status: z.enum([
    'new',
    'contacted',
    'qualified',
    'trial_scheduled',
    'trial_completed',
    'proposal_sent',
    'converted',
    'lost',
  ]).default('new'),
  interested_in: z.array(z.string()).optional(),
  notes: optionalString,
  assigned_to: optionalUuidSchema,
  follow_up_date: optionalDateSchema,
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;

/**
 * Payment form schema
 */
export const paymentFormSchema = z.object({
  member_id: uuidSchema,
  amount: priceSchema,
  payment_method: z.enum(['card', 'cash', 'check', 'bank_transfer', 'other'], {
    errorMap: () => ({ message: 'Please select a payment method' }),
  }),
  description: optionalString,
  invoice_id: optionalUuidSchema,
  notes: optionalString,
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

/**
 * Equipment form schema
 */
export const equipmentFormSchema = z.object({
  name: nonEmptyString.refine((val) => val.length >= 2, {
    message: 'Equipment name must be at least 2 characters',
  }),
  description: optionalString,
  category: optionalString,
  brand: optionalString,
  model: optionalString,
  serial_number: optionalString,
  purchase_date: optionalDateSchema,
  purchase_price: priceSchema.optional(),
  warranty_expiry: optionalDateSchema,
  location_id: optionalUuidSchema,
  condition: z.enum(['excellent', 'good', 'fair', 'poor', 'out_of_service']).optional(),
  last_maintenance_date: optionalDateSchema,
  next_maintenance_date: optionalDateSchema,
  notes: optionalString,
});

export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

/**
 * Login form schema
 */
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().default(false),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

/**
 * Registration form schema
 */
export const registrationFormSchema = z
  .object({
    email: emailSchema,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
    first_name: nonEmptyString.refine((val) => val.length >= 2, {
      message: 'First name must be at least 2 characters',
    }),
    last_name: nonEmptyString.refine((val) => val.length >= 2, {
      message: 'Last name must be at least 2 characters',
    }),
    phone: optionalPhoneSchema,
    terms_accepted: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms and conditions' }),
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export type RegistrationFormValues = z.infer<typeof registrationFormSchema>;

/**
 * Password change form schema
 */
export const passwordChangeFormSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirm_password: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: 'New password must be different from current password',
    path: ['new_password'],
  });

export type PasswordChangeFormValues = z.infer<typeof passwordChangeFormSchema>;

/**
 * Profile update form schema
 */
export const profileUpdateFormSchema = z.object({
  first_name: nonEmptyString.refine((val) => val.length >= 2, {
    message: 'First name must be at least 2 characters',
  }),
  last_name: nonEmptyString.refine((val) => val.length >= 2, {
    message: 'Last name must be at least 2 characters',
  }),
  phone: optionalPhoneSchema,
  avatar_url: urlSchema,
  bio: optionalString,
  timezone: optionalString,
  notification_preferences: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
  }).optional(),
});

export type ProfileUpdateFormValues = z.infer<typeof profileUpdateFormSchema>;

/**
 * Organization settings form schema
 */
export const organizationSettingsFormSchema = z.object({
  name: nonEmptyString.refine((val) => val.length >= 2, {
    message: 'Organization name must be at least 2 characters',
  }),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
  website: urlSchema,
  address: optionalString,
  city: optionalString,
  state: optionalString,
  zip_code: optionalString,
  country: optionalString,
  timezone: optionalString,
  logo_url: urlSchema,
  currency: z.string().length(3, 'Currency must be a 3-letter code').default('USD'),
  tax_rate: percentageSchema.optional(),
});

export type OrganizationSettingsFormValues = z.infer<typeof organizationSettingsFormSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a search/filter query schema
 */
export function createSearchSchema<T extends string>(fields: readonly T[]) {
  return z.object({
    query: optionalString,
    field: z.enum(fields as [T, ...T[]]).optional(),
    sort_by: z.enum(fields as [T, ...T[]]).optional(),
    sort_order: z.enum(['asc', 'desc']).default('asc'),
    page: nonNegativeNumberSchema.int().default(1),
    page_size: positiveNumberSchema.int().max(100).default(25),
  });
}

/**
 * Create a date range filter schema
 */
export const dateRangeSchema = z.object({
  start_date: optionalDateSchema,
  end_date: optionalDateSchema,
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return data.end_date >= data.start_date;
    }
    return true;
  },
  {
    message: 'End date must be on or after start date',
    path: ['end_date'],
  }
);

export type DateRangeValues = z.infer<typeof dateRangeSchema>;
