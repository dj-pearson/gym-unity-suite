import { describe, it, expect } from 'vitest';
import {
  nonEmptyString,
  emailSchema,
  phoneSchema,
  optionalPhoneSchema,
  uuidSchema,
  priceSchema,
  percentageSchema,
  dateSchema,
  futureDateSchema,
  pastDateSchema,
  userRoleSchema,
  membershipStatusSchema,
  memberFormSchema,
  staffFormSchema,
  classFormSchema,
  membershipPlanFormSchema,
  checkInFormSchema,
  leadFormSchema,
  loginFormSchema,
  registrationFormSchema,
  passwordChangeFormSchema,
  profileUpdateFormSchema,
  organizationSettingsFormSchema,
  dateRangeSchema,
  createSearchSchema,
} from './validation-schemas';

describe('Base Schemas', () => {
  describe('nonEmptyString', () => {
    it('should accept non-empty strings', () => {
      expect(nonEmptyString.parse('hello')).toBe('hello');
      expect(nonEmptyString.parse('  hello  ')).toBe('hello'); // trims
    });

    it('should reject empty strings', () => {
      const emptyResult = nonEmptyString.safeParse('');
      expect(emptyResult.success).toBe(false);

      // Whitespace-only should also fail after trimming
      const whitespaceResult = nonEmptyString.safeParse('   ');
      // After trim, '   ' becomes '', which should fail min(1) check
      expect(whitespaceResult.success).toBe(false);
    });
  });

  describe('emailSchema', () => {
    it('should accept valid emails', () => {
      const result1 = emailSchema.safeParse('test@example.com');
      expect(result1.success).toBe(true);
      if (result1.success) expect(result1.data).toBe('test@example.com');

      const result2 = emailSchema.safeParse('USER@EXAMPLE.COM');
      expect(result2.success).toBe(true);
      if (result2.success) expect(result2.data).toBe('user@example.com'); // lowercases
    });

    it('should reject invalid emails', () => {
      expect(emailSchema.safeParse('').success).toBe(false);
      expect(emailSchema.safeParse('not-an-email').success).toBe(false);
      expect(emailSchema.safeParse('test@').success).toBe(false);
      expect(emailSchema.safeParse('@example.com').success).toBe(false);
    });
  });

  describe('phoneSchema', () => {
    it('should accept valid phone numbers', () => {
      expect(phoneSchema.safeParse('555-1234').success).toBe(true);
      expect(phoneSchema.safeParse('+1 (555) 123-4567').success).toBe(true);
      expect(phoneSchema.safeParse('5551234567').success).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(phoneSchema.safeParse('').success).toBe(false);
      expect(phoneSchema.safeParse('abc-defg').success).toBe(false);
    });
  });

  describe('optionalPhoneSchema', () => {
    it('should accept empty string and return undefined', () => {
      expect(optionalPhoneSchema.parse('')).toBeUndefined();
    });

    it('should accept undefined', () => {
      expect(optionalPhoneSchema.parse(undefined)).toBeUndefined();
    });

    it('should accept valid phone numbers', () => {
      expect(optionalPhoneSchema.parse('555-1234')).toBeDefined();
    });
  });

  describe('uuidSchema', () => {
    it('should accept valid UUIDs', () => {
      expect(uuidSchema.parse('550e8400-e29b-41d4-a716-446655440000')).toBeDefined();
      expect(uuidSchema.parse('123e4567-e89b-12d3-a456-426614174000')).toBeDefined();
    });

    it('should reject invalid UUIDs', () => {
      expect(() => uuidSchema.parse('')).toThrow();
      expect(() => uuidSchema.parse('not-a-uuid')).toThrow();
      expect(() => uuidSchema.parse('550e8400-e29b-41d4-a716')).toThrow();
    });
  });

  describe('priceSchema', () => {
    it('should accept valid prices', () => {
      expect(priceSchema.parse(0)).toBe(0);
      expect(priceSchema.parse(99.99)).toBe(99.99);
      expect(priceSchema.parse(1000)).toBe(1000);
    });

    it('should reject invalid prices', () => {
      expect(() => priceSchema.parse(-1)).toThrow();
      expect(() => priceSchema.parse(99.999)).toThrow(); // too many decimals
      expect(() => priceSchema.parse('99.99')).toThrow();
    });
  });

  describe('percentageSchema', () => {
    it('should accept valid percentages', () => {
      expect(percentageSchema.parse(0)).toBe(0);
      expect(percentageSchema.parse(50)).toBe(50);
      expect(percentageSchema.parse(100)).toBe(100);
    });

    it('should reject invalid percentages', () => {
      expect(() => percentageSchema.parse(-1)).toThrow();
      expect(() => percentageSchema.parse(101)).toThrow();
    });
  });

  describe('dateSchema', () => {
    it('should accept valid dates', () => {
      const date = new Date('2024-01-01');
      expect(dateSchema.parse(date)).toBeInstanceOf(Date);
      expect(dateSchema.parse('2024-01-01')).toBeInstanceOf(Date);
    });

    it('should reject invalid dates', () => {
      expect(() => dateSchema.parse('not-a-date')).toThrow();
    });
  });

  describe('futureDateSchema', () => {
    it('should accept future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(futureDateSchema.parse(futureDate)).toBeInstanceOf(Date);
    });

    it('should reject past dates', () => {
      const pastDate = new Date('2020-01-01');
      expect(() => futureDateSchema.parse(pastDate)).toThrow();
    });
  });

  describe('pastDateSchema', () => {
    it('should accept past dates', () => {
      const pastDate = new Date('2020-01-01');
      expect(pastDateSchema.parse(pastDate)).toBeInstanceOf(Date);
    });

    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(() => pastDateSchema.parse(futureDate)).toThrow();
    });
  });
});

describe('Domain Schemas', () => {
  describe('userRoleSchema', () => {
    it('should accept valid roles', () => {
      expect(userRoleSchema.parse('owner')).toBe('owner');
      expect(userRoleSchema.parse('manager')).toBe('manager');
      expect(userRoleSchema.parse('staff')).toBe('staff');
      expect(userRoleSchema.parse('trainer')).toBe('trainer');
      expect(userRoleSchema.parse('member')).toBe('member');
    });

    it('should reject invalid roles', () => {
      expect(() => userRoleSchema.parse('admin')).toThrow();
      expect(() => userRoleSchema.parse('')).toThrow();
    });
  });

  describe('membershipStatusSchema', () => {
    it('should accept valid statuses', () => {
      expect(membershipStatusSchema.parse('active')).toBe('active');
      expect(membershipStatusSchema.parse('inactive')).toBe('inactive');
      expect(membershipStatusSchema.parse('frozen')).toBe('frozen');
    });

    it('should reject invalid statuses', () => {
      expect(() => membershipStatusSchema.parse('unknown')).toThrow();
    });
  });
});

describe('Form Schemas', () => {
  describe('memberFormSchema', () => {
    const validMember = {
      email: 'john@example.com',
      first_name: 'John',
      last_name: 'Doe',
    };

    it('should accept valid member data', () => {
      const result = memberFormSchema.parse(validMember);
      expect(result.email).toBe('john@example.com');
      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Doe');
    });

    it('should accept member data with optional fields', () => {
      const withOptional = {
        ...validMember,
        phone: '555-1234',
        address: '123 Main St',
        notes: 'Some notes',
      };
      const result = memberFormSchema.parse(withOptional);
      expect(result.phone).toBeDefined();
      expect(result.address).toBe('123 Main St');
    });

    it('should reject invalid member data', () => {
      expect(() => memberFormSchema.parse({ email: 'invalid' })).toThrow();
      expect(() => memberFormSchema.parse({ email: 'test@example.com', first_name: 'A' })).toThrow(); // too short
    });
  });

  describe('staffFormSchema', () => {
    const validStaff = {
      email: 'staff@example.com',
      first_name: 'Jane',
      last_name: 'Doe',
      role: 'staff',
    };

    it('should accept valid staff data', () => {
      const result = staffFormSchema.parse(validStaff);
      expect(result.email).toBe('staff@example.com');
      expect(result.role).toBe('staff');
    });

    it('should reject invalid role', () => {
      expect(() => staffFormSchema.parse({ ...validStaff, role: 'admin' })).toThrow();
    });
  });

  describe('classFormSchema', () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const validClass = {
      name: 'Yoga Basics',
      instructor_id: '550e8400-e29b-41d4-a716-446655440000',
      start_time: now,
      end_time: oneHourLater,
      capacity: 20,
    };

    it('should accept valid class data', () => {
      const result = classFormSchema.parse(validClass);
      expect(result.name).toBe('Yoga Basics');
      expect(result.capacity).toBe(20);
    });

    it('should reject end time before start time', () => {
      expect(() =>
        classFormSchema.parse({
          ...validClass,
          end_time: new Date(now.getTime() - 60 * 60 * 1000),
        })
      ).toThrow('End time must be after start time');
    });

    it('should reject short class names', () => {
      expect(() => classFormSchema.parse({ ...validClass, name: 'AB' })).toThrow();
    });
  });

  describe('membershipPlanFormSchema', () => {
    const validPlan = {
      name: 'Premium Monthly',
      price: 99.99,
      billing_period: 'monthly',
      duration_days: 30,
    };

    it('should accept valid plan data', () => {
      const result = membershipPlanFormSchema.parse(validPlan);
      expect(result.name).toBe('Premium Monthly');
      expect(result.price).toBe(99.99);
    });

    it('should apply default values', () => {
      const result = membershipPlanFormSchema.parse(validPlan);
      expect(result.guest_passes).toBe(0);
      expect(result.freeze_days).toBe(0);
      expect(result.is_active).toBe(true);
    });
  });

  describe('checkInFormSchema', () => {
    const validCheckIn = {
      member_id: '550e8400-e29b-41d4-a716-446655440000',
      location_id: '550e8400-e29b-41d4-a716-446655440001',
    };

    it('should accept valid check-in data', () => {
      const result = checkInFormSchema.parse(validCheckIn);
      expect(result.member_id).toBeDefined();
      expect(result.check_in_type).toBe('regular'); // default
    });

    it('should accept custom check-in type', () => {
      const result = checkInFormSchema.parse({
        ...validCheckIn,
        check_in_type: 'guest',
      });
      expect(result.check_in_type).toBe('guest');
    });
  });

  describe('leadFormSchema', () => {
    const validLead = {
      first_name: 'John',
      last_name: 'Doe',
    };

    it('should accept minimal lead data', () => {
      const result = leadFormSchema.parse(validLead);
      expect(result.first_name).toBe('John');
      expect(result.status).toBe('new'); // default
    });

    it('should accept full lead data', () => {
      const fullLead = {
        ...validLead,
        email: 'john@example.com',
        phone: '555-1234',
        source: 'website',
        status: 'contacted',
      };
      const result = leadFormSchema.parse(fullLead);
      expect(result.source).toBe('website');
      expect(result.status).toBe('contacted');
    });
  });

  describe('loginFormSchema', () => {
    it('should accept valid login data', () => {
      const result = loginFormSchema.parse({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(result.email).toBe('user@example.com');
      expect(result.remember_me).toBe(false); // default
    });

    it('should reject missing password', () => {
      expect(() =>
        loginFormSchema.parse({
          email: 'user@example.com',
          password: '',
        })
      ).toThrow();
    });
  });

  describe('registrationFormSchema', () => {
    const validRegistration = {
      email: 'user@example.com',
      password: 'Password1',
      confirm_password: 'Password1',
      first_name: 'John',
      last_name: 'Doe',
      terms_accepted: true as const,
    };

    it('should accept valid registration data', () => {
      const result = registrationFormSchema.parse(validRegistration);
      expect(result.email).toBe('user@example.com');
    });

    it('should reject password mismatch', () => {
      expect(() =>
        registrationFormSchema.parse({
          ...validRegistration,
          confirm_password: 'DifferentPassword1',
        })
      ).toThrow('Passwords do not match');
    });

    it('should reject weak passwords', () => {
      expect(() =>
        registrationFormSchema.parse({
          ...validRegistration,
          password: 'password', // no uppercase or number
          confirm_password: 'password',
        })
      ).toThrow();
    });

    it('should reject if terms not accepted', () => {
      expect(() =>
        registrationFormSchema.parse({
          ...validRegistration,
          terms_accepted: false,
        })
      ).toThrow();
    });
  });

  describe('passwordChangeFormSchema', () => {
    const validChange = {
      current_password: 'OldPassword1',
      new_password: 'NewPassword1',
      confirm_password: 'NewPassword1',
    };

    it('should accept valid password change', () => {
      const result = passwordChangeFormSchema.parse(validChange);
      expect(result.new_password).toBe('NewPassword1');
    });

    it('should reject same old and new password', () => {
      expect(() =>
        passwordChangeFormSchema.parse({
          ...validChange,
          new_password: 'OldPassword1',
          confirm_password: 'OldPassword1',
        })
      ).toThrow('New password must be different');
    });
  });

  describe('profileUpdateFormSchema', () => {
    it('should accept valid profile update', () => {
      const result = profileUpdateFormSchema.parse({
        first_name: 'John',
        last_name: 'Doe',
      });
      expect(result.first_name).toBe('John');
    });

    it('should accept optional fields', () => {
      const result = profileUpdateFormSchema.parse({
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-1234',
        bio: 'Fitness enthusiast',
      });
      expect(result.phone).toBeDefined();
      expect(result.bio).toBe('Fitness enthusiast');
    });
  });

  describe('organizationSettingsFormSchema', () => {
    const validSettings = {
      name: 'My Gym',
      slug: 'my-gym',
    };

    it('should accept valid organization settings', () => {
      const result = organizationSettingsFormSchema.parse(validSettings);
      expect(result.name).toBe('My Gym');
      expect(result.currency).toBe('USD'); // default
    });

    it('should reject invalid slug format', () => {
      expect(() =>
        organizationSettingsFormSchema.parse({
          ...validSettings,
          slug: 'My Gym!', // invalid characters
        })
      ).toThrow();
    });
  });
});

describe('Helper Functions', () => {
  describe('dateRangeSchema', () => {
    it('should accept valid date range', () => {
      const result = dateRangeSchema.parse({
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
      });
      expect(result.start_date).toBeInstanceOf(Date);
      expect(result.end_date).toBeInstanceOf(Date);
    });

    it('should accept same start and end date', () => {
      const date = new Date('2024-01-01');
      const result = dateRangeSchema.parse({
        start_date: date,
        end_date: date,
      });
      expect(result).toBeDefined();
    });

    it('should reject end date before start date', () => {
      expect(() =>
        dateRangeSchema.parse({
          start_date: new Date('2024-12-31'),
          end_date: new Date('2024-01-01'),
        })
      ).toThrow('End date must be on or after start date');
    });

    it('should accept partial dates', () => {
      const result = dateRangeSchema.parse({
        start_date: new Date('2024-01-01'),
      });
      expect(result.start_date).toBeInstanceOf(Date);
      expect(result.end_date).toBeUndefined();
    });
  });

  describe('createSearchSchema', () => {
    const searchFields = ['name', 'email', 'created_at'] as const;
    const SearchSchema = createSearchSchema(searchFields);

    it('should accept valid search params', () => {
      const result = SearchSchema.parse({
        query: 'john',
        field: 'name',
        sort_by: 'created_at',
        sort_order: 'desc',
        page: 2,
        page_size: 10,
      });
      expect(result.query).toBe('john');
      expect(result.sort_order).toBe('desc');
    });

    it('should apply default values', () => {
      const result = SearchSchema.parse({});
      expect(result.sort_order).toBe('asc');
      expect(result.page).toBe(1);
      expect(result.page_size).toBe(25);
    });

    it('should reject invalid field names', () => {
      expect(() =>
        SearchSchema.parse({
          field: 'invalid_field',
        })
      ).toThrow();
    });

    it('should reject page_size over 100', () => {
      expect(() =>
        SearchSchema.parse({
          page_size: 200,
        })
      ).toThrow();
    });
  });
});
