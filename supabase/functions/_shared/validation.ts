/**
 * Shared Input Validation Middleware
 *
 * Provides comprehensive server-side validation for all API inputs.
 * SECURITY: Never trust client-side validation alone.
 */

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  sanitizedData?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
  code: ValidationErrorCode;
  value?: unknown;
}

export type ValidationErrorCode =
  | "REQUIRED"
  | "INVALID_TYPE"
  | "INVALID_FORMAT"
  | "TOO_SHORT"
  | "TOO_LONG"
  | "OUT_OF_RANGE"
  | "INVALID_ENUM"
  | "PATTERN_MISMATCH"
  | "CUSTOM";

export interface FieldSchema {
  type: "string" | "number" | "boolean" | "array" | "object" | "uuid" | "email" | "url" | "date" | "phone";
  required?: boolean;
  nullable?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: readonly unknown[];
  items?: FieldSchema;
  properties?: Record<string, FieldSchema>;
  sanitize?: boolean;
  custom?: (value: unknown, field: string) => ValidationError | null;
}

export type Schema = Record<string, FieldSchema>;

// ============================================================================
// Regex Patterns
// ============================================================================

export const PATTERNS = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  ISO_DATE: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  CREDIT_CARD: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9][0-9])[0-9]{12})$/,
  // Security patterns to detect potential attacks
  SQL_INJECTION: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b.*\b(FROM|INTO|WHERE|TABLE|DATABASE)\b)|('.*--)|(\bOR\b.*=)|(\bAND\b.*=)/i,
  XSS_PATTERN: /<script[\s\S]*?>[\s\S]*?<\/script>|javascript:|on\w+\s*=/i,
  PATH_TRAVERSAL: /\.\.[\/\\]/,
};

// ============================================================================
// Sanitization Functions
// ============================================================================

/**
 * Sanitize string input to prevent XSS and injection attacks
 */
export function sanitizeString(value: string): string {
  if (typeof value !== "string") return "";

  return value
    // Remove null bytes
    .replace(/\0/g, "")
    // Encode HTML entities
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    // Remove control characters (except newlines and tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
}

/**
 * Sanitize for safe SQL use (still use parameterized queries!)
 */
export function sanitizeForSql(value: string): string {
  if (typeof value !== "string") return "";

  return value
    .replace(/'/g, "''")
    .replace(/\\/g, "\\\\")
    .replace(/\0/g, "")
    .trim();
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(value: string): string {
  if (typeof value !== "string") return "";

  return value.toLowerCase().trim().slice(0, 255);
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(value: string): string {
  if (typeof value !== "string") return "";

  try {
    const url = new URL(value);
    // Only allow http and https protocols
    if (!["http:", "https:"].includes(url.protocol)) {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
}

/**
 * Remove potential malicious content
 */
export function sanitizeHtml(value: string): string {
  if (typeof value !== "string") return "";

  return value
    // Remove script tags
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    // Remove event handlers
    .replace(/\bon\w+\s*=\s*(['"])?[\s\S]*?\1/gi, "")
    // Remove javascript: URLs
    .replace(/javascript:/gi, "")
    // Remove data: URLs (potential XSS)
    .replace(/data:/gi, "")
    .trim();
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate a value against a field schema
 */
function validateField(
  value: unknown,
  field: string,
  schema: FieldSchema
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check required
  if (value === undefined || value === null) {
    if (schema.required && !schema.nullable) {
      errors.push({
        field,
        message: `${field} is required`,
        code: "REQUIRED",
      });
    }
    return errors;
  }

  // Check nullable
  if (value === null && schema.nullable) {
    return errors;
  }

  // Type-specific validation
  switch (schema.type) {
    case "string":
      if (typeof value !== "string") {
        errors.push({
          field,
          message: `${field} must be a string`,
          code: "INVALID_TYPE",
          value,
        });
        break;
      }
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        errors.push({
          field,
          message: `${field} must be at least ${schema.minLength} characters`,
          code: "TOO_SHORT",
          value,
        });
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        errors.push({
          field,
          message: `${field} must be at most ${schema.maxLength} characters`,
          code: "TOO_LONG",
          value,
        });
      }
      if (schema.pattern && !schema.pattern.test(value)) {
        errors.push({
          field,
          message: `${field} format is invalid`,
          code: "PATTERN_MISMATCH",
          value,
        });
      }
      if (schema.enum && !schema.enum.includes(value)) {
        errors.push({
          field,
          message: `${field} must be one of: ${schema.enum.join(", ")}`,
          code: "INVALID_ENUM",
          value,
        });
      }
      break;

    case "number":
      if (typeof value !== "number" || isNaN(value)) {
        errors.push({
          field,
          message: `${field} must be a number`,
          code: "INVALID_TYPE",
          value,
        });
        break;
      }
      if (schema.min !== undefined && value < schema.min) {
        errors.push({
          field,
          message: `${field} must be at least ${schema.min}`,
          code: "OUT_OF_RANGE",
          value,
        });
      }
      if (schema.max !== undefined && value > schema.max) {
        errors.push({
          field,
          message: `${field} must be at most ${schema.max}`,
          code: "OUT_OF_RANGE",
          value,
        });
      }
      break;

    case "boolean":
      if (typeof value !== "boolean") {
        errors.push({
          field,
          message: `${field} must be a boolean`,
          code: "INVALID_TYPE",
          value,
        });
      }
      break;

    case "uuid":
      if (typeof value !== "string" || !PATTERNS.UUID.test(value)) {
        errors.push({
          field,
          message: `${field} must be a valid UUID`,
          code: "INVALID_FORMAT",
          value,
        });
      }
      break;

    case "email":
      if (typeof value !== "string" || !PATTERNS.EMAIL.test(value)) {
        errors.push({
          field,
          message: `${field} must be a valid email address`,
          code: "INVALID_FORMAT",
          value,
        });
      }
      if (typeof value === "string" && value.length > 255) {
        errors.push({
          field,
          message: `${field} is too long (max 255 characters)`,
          code: "TOO_LONG",
          value,
        });
      }
      break;

    case "url":
      if (typeof value !== "string" || !PATTERNS.URL.test(value)) {
        errors.push({
          field,
          message: `${field} must be a valid URL`,
          code: "INVALID_FORMAT",
          value,
        });
      }
      break;

    case "date":
      if (typeof value !== "string" || !PATTERNS.ISO_DATE.test(value)) {
        errors.push({
          field,
          message: `${field} must be a valid ISO date`,
          code: "INVALID_FORMAT",
          value,
        });
      }
      break;

    case "phone":
      if (typeof value !== "string" || !PATTERNS.PHONE.test(value)) {
        errors.push({
          field,
          message: `${field} must be a valid phone number`,
          code: "INVALID_FORMAT",
          value,
        });
      }
      break;

    case "array":
      if (!Array.isArray(value)) {
        errors.push({
          field,
          message: `${field} must be an array`,
          code: "INVALID_TYPE",
          value,
        });
        break;
      }
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        errors.push({
          field,
          message: `${field} must have at least ${schema.minLength} items`,
          code: "TOO_SHORT",
          value,
        });
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        errors.push({
          field,
          message: `${field} must have at most ${schema.maxLength} items`,
          code: "TOO_LONG",
          value,
        });
      }
      if (schema.items) {
        value.forEach((item, index) => {
          errors.push(...validateField(item, `${field}[${index}]`, schema.items!));
        });
      }
      break;

    case "object":
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        errors.push({
          field,
          message: `${field} must be an object`,
          code: "INVALID_TYPE",
          value,
        });
        break;
      }
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          errors.push(
            ...validateField((value as Record<string, unknown>)[key], `${field}.${key}`, propSchema)
          );
        }
      }
      break;
  }

  // Custom validation
  if (schema.custom) {
    const customError = schema.custom(value, field);
    if (customError) {
      errors.push(customError);
    }
  }

  return errors;
}

/**
 * Validate request data against a schema
 */
export function validate(data: unknown, schema: Schema): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof data !== "object" || data === null) {
    return {
      valid: false,
      errors: [
        {
          field: "body",
          message: "Request body must be an object",
          code: "INVALID_TYPE",
        },
      ],
    };
  }

  const dataObj = data as Record<string, unknown>;

  // Validate each field in schema
  for (const [field, fieldSchema] of Object.entries(schema)) {
    errors.push(...validateField(dataObj[field], field, fieldSchema));
  }

  // Check for unexpected fields (optional strict mode)
  const expectedFields = new Set(Object.keys(schema));
  for (const field of Object.keys(dataObj)) {
    if (!expectedFields.has(field)) {
      // Log unexpected fields for security monitoring
      console.warn(`[VALIDATION] Unexpected field: ${field}`);
    }
  }

  // Sanitize data if requested
  let sanitizedData: Record<string, unknown> | undefined;
  if (errors.length === 0) {
    sanitizedData = sanitizeData(dataObj, schema);
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitizedData,
  };
}

/**
 * Sanitize data according to schema
 */
function sanitizeData(data: Record<string, unknown>, schema: Schema): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [field, fieldSchema] of Object.entries(schema)) {
    const value = data[field];

    if (value === undefined || value === null) {
      if (!fieldSchema.required) {
        result[field] = value;
      }
      continue;
    }

    if (fieldSchema.sanitize !== false) {
      switch (fieldSchema.type) {
        case "string":
          result[field] = sanitizeString(value as string);
          break;
        case "email":
          result[field] = sanitizeEmail(value as string);
          break;
        case "url":
          result[field] = sanitizeUrl(value as string);
          break;
        default:
          result[field] = value;
      }
    } else {
      result[field] = value;
    }
  }

  return result;
}

// ============================================================================
// Security Checks
// ============================================================================

/**
 * Check for potential SQL injection
 */
export function detectSqlInjection(value: string): boolean {
  if (typeof value !== "string") return false;
  return PATTERNS.SQL_INJECTION.test(value);
}

/**
 * Check for potential XSS
 */
export function detectXss(value: string): boolean {
  if (typeof value !== "string") return false;
  return PATTERNS.XSS_PATTERN.test(value);
}

/**
 * Check for path traversal
 */
export function detectPathTraversal(value: string): boolean {
  if (typeof value !== "string") return false;
  return PATTERNS.PATH_TRAVERSAL.test(value);
}

/**
 * Comprehensive security scan for a value
 */
export function securityScan(value: string): {
  safe: boolean;
  threats: string[];
} {
  const threats: string[] = [];

  if (detectSqlInjection(value)) {
    threats.push("Potential SQL injection detected");
  }
  if (detectXss(value)) {
    threats.push("Potential XSS detected");
  }
  if (detectPathTraversal(value)) {
    threats.push("Potential path traversal detected");
  }

  return {
    safe: threats.length === 0,
    threats,
  };
}

/**
 * Scan all string values in an object for security threats
 */
export function deepSecurityScan(data: unknown, path = ""): {
  safe: boolean;
  threats: { path: string; threat: string }[];
} {
  const threats: { path: string; threat: string }[] = [];

  if (typeof data === "string") {
    const scan = securityScan(data);
    if (!scan.safe) {
      scan.threats.forEach((threat) => {
        threats.push({ path: path || "root", threat });
      });
    }
  } else if (Array.isArray(data)) {
    data.forEach((item, index) => {
      const result = deepSecurityScan(item, `${path}[${index}]`);
      threats.push(...result.threats);
    });
  } else if (typeof data === "object" && data !== null) {
    for (const [key, value] of Object.entries(data)) {
      const result = deepSecurityScan(value, path ? `${path}.${key}` : key);
      threats.push(...result.threats);
    }
  }

  return {
    safe: threats.length === 0,
    threats,
  };
}

// ============================================================================
// Request Middleware
// ============================================================================

/**
 * Parse and validate JSON request body
 */
export async function parseAndValidateBody<T>(
  req: Request,
  schema: Schema
): Promise<{ data: T | null; errors: ValidationError[] }> {
  try {
    const contentType = req.headers.get("content-type");

    if (!contentType?.includes("application/json")) {
      return {
        data: null,
        errors: [
          {
            field: "content-type",
            message: "Content-Type must be application/json",
            code: "INVALID_TYPE",
          },
        ],
      };
    }

    const body = await req.json();

    // Deep security scan
    const securityResult = deepSecurityScan(body);
    if (!securityResult.safe) {
      console.warn("[SECURITY] Potential attack detected:", securityResult.threats);
      return {
        data: null,
        errors: securityResult.threats.map((t) => ({
          field: t.path,
          message: t.threat,
          code: "CUSTOM" as ValidationErrorCode,
        })),
      };
    }

    // Validate against schema
    const validationResult = validate(body, schema);

    if (!validationResult.valid) {
      return {
        data: null,
        errors: validationResult.errors,
      };
    }

    return {
      data: (validationResult.sanitizedData ?? body) as T,
      errors: [],
    };
  } catch (error) {
    return {
      data: null,
      errors: [
        {
          field: "body",
          message: "Invalid JSON body",
          code: "INVALID_FORMAT",
        },
      ],
    };
  }
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  errors: ValidationError[],
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: "Validation failed",
      details: errors.map((e) => ({
        field: e.field,
        message: e.message,
        code: e.code,
      })),
    }),
    {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * Common field schemas for reuse
 */
export const CommonSchemas = {
  uuid: { type: "uuid" as const, required: true },
  optionalUuid: { type: "uuid" as const, required: false },
  email: { type: "email" as const, required: true, maxLength: 255 },
  optionalEmail: { type: "email" as const, required: false, maxLength: 255 },
  phone: { type: "phone" as const, required: true },
  optionalPhone: { type: "phone" as const, required: false },
  url: { type: "url" as const, required: true },
  optionalUrl: { type: "url" as const, required: false },
  name: { type: "string" as const, required: true, minLength: 1, maxLength: 100 },
  optionalName: { type: "string" as const, required: false, maxLength: 100 },
  description: { type: "string" as const, required: false, maxLength: 2000 },
  positiveNumber: { type: "number" as const, required: true, min: 0 },
  optionalPositiveNumber: { type: "number" as const, required: false, min: 0 },
  boolean: { type: "boolean" as const, required: true },
  optionalBoolean: { type: "boolean" as const, required: false },
  date: { type: "date" as const, required: true },
  optionalDate: { type: "date" as const, required: false },
};
