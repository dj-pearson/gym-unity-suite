import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
  showValidation?: boolean; // Show validation immediately or on blur
}

/**
 * Enhanced FormField with inline validation feedback
 *
 * Shows validation errors, success states, and hints inline with the field
 * Provides better UX than showing all errors on submit
 *
 * @example
 * ```tsx
 * <FormField
 *   label="Email Address"
 *   name="email"
 *   type="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   error={emailError}
 *   hint="We'll never share your email"
 *   required
 * />
 * ```
 */
export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  success,
  hint,
  required,
  disabled,
  placeholder,
  multiline,
  rows = 4,
  className = '',
  showValidation = true,
}: FormFieldProps) {
  const hasError = showValidation && !!error;
  const hasSuccess = showValidation && !!success;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {/* Input Field */}
      <div className="relative">
        {multiline ? (
          <Textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder}
            rows={rows}
            className={`
              ${hasError ? 'border-destructive focus-visible:ring-destructive' : ''}
              ${hasSuccess ? 'border-success focus-visible:ring-success' : ''}
            `}
          />
        ) : (
          <Input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder}
            className={`
              ${hasError ? 'border-destructive focus-visible:ring-destructive' : ''}
              ${hasSuccess ? 'border-success focus-visible:ring-success' : ''}
            `}
          />
        )}

        {/* Validation Icon */}
        {showValidation && (error || success) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {hasError && <AlertCircle className="h-4 w-4 text-destructive" />}
            {hasSuccess && <CheckCircle2 className="h-4 w-4 text-success" />}
          </div>
        )}
      </div>

      {/* Error Message */}
      {hasError && (
        <div className="flex items-start gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {hasSuccess && !hasError && (
        <div className="flex items-start gap-1.5 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Hint */}
      {hint && !hasError && !hasSuccess && (
        <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}

/**
 * FormSection - Groups related form fields with a title
 */
interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className = '',
}: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/**
 * FormActions - Standardized form action buttons
 */
interface FormActionsProps {
  onSubmit?: () => void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FormActions({
  onSubmit,
  onCancel,
  submitText = 'Save',
  cancelText = 'Cancel',
  isSubmitting,
  disabled,
  className = '',
}: FormActionsProps) {
  return (
    <div className={`flex justify-end gap-3 ${className}`}>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        >
          {cancelText}
        </button>
      )}
      {onSubmit && (
        <button
          type="submit"
          onClick={onSubmit}
          disabled={disabled || isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-primary rounded-md hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : submitText}
        </button>
      )}
    </div>
  );
}
