/**
 * useSanitizedForm - A wrapper around React Hook Form that automatically
 * sanitizes text inputs on submission to prevent XSS and injection attacks.
 *
 * Usage:
 * ```typescript
 * const form = useSanitizedForm<LeadFormValues>({
 *   resolver: zodResolver(leadFormSchema),
 *   defaultValues: { first_name: '', last_name: '' },
 * });
 *
 * const onSubmit = (sanitizedValues: LeadFormValues) => {
 *   // values are already sanitized
 * };
 *
 * <form onSubmit={form.handleSanitizedSubmit(onSubmit)}>
 * ```
 */

import { useForm, UseFormProps, UseFormReturn, FieldValues, SubmitHandler } from 'react-hook-form';
import { sanitizeInput, sanitizeEmail } from '@/lib/security/url-sanitization';

/**
 * Recursively sanitize all string values in a form data object.
 * Handles nested objects and arrays.
 */
function sanitizeFormData<T>(data: T): T {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    return sanitizeInput(data) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeFormData(item)) as unknown as T;
  }

  if (typeof data === 'object' && data instanceof Date) {
    return data;
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      // Use email-specific sanitization for email fields
      if (
        typeof value === 'string' &&
        (key === 'email' || key.endsWith('_email') || key.startsWith('email'))
      ) {
        sanitized[key] = sanitizeEmail(value) || value.trim().toLowerCase();
      } else {
        sanitized[key] = sanitizeFormData(value);
      }
    }
    return sanitized as T;
  }

  return data;
}

export interface UseSanitizedFormReturn<TFieldValues extends FieldValues>
  extends UseFormReturn<TFieldValues> {
  handleSanitizedSubmit: (
    onValid: SubmitHandler<TFieldValues>,
    onInvalid?: (errors: any) => void
  ) => (e?: React.BaseSyntheticEvent) => Promise<void>;
}

export function useSanitizedForm<TFieldValues extends FieldValues = FieldValues>(
  props?: UseFormProps<TFieldValues>
): UseSanitizedFormReturn<TFieldValues> {
  const form = useForm<TFieldValues>(props);

  const handleSanitizedSubmit = (
    onValid: SubmitHandler<TFieldValues>,
    onInvalid?: (errors: any) => void
  ) => {
    return form.handleSubmit((data) => {
      const sanitizedData = sanitizeFormData(data);
      return onValid(sanitizedData);
    }, onInvalid);
  };

  return {
    ...form,
    handleSanitizedSubmit,
  };
}

export { sanitizeFormData };
