/**
 * Password Strength Indicator Component
 *
 * Displays real-time password strength feedback as users type,
 * showing visual indicators and requirement checklist.
 */

import { useState, useEffect, useMemo } from 'react';
import { Check, X, AlertCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  validatePasswordSync,
  generatePassword,
  type PasswordValidationResult,
} from '@/lib/security/password-policy';

interface PasswordStrengthIndicatorProps {
  password: string;
  onPasswordChange?: (password: string) => void;
  showRequirements?: boolean;
  showSuggestions?: boolean;
  showGenerator?: boolean;
  className?: string;
}

// Strength colors
const STRENGTH_COLORS: Record<PasswordValidationResult['strength'], string> = {
  'weak': 'bg-red-500',
  'fair': 'bg-orange-500',
  'good': 'bg-yellow-500',
  'strong': 'bg-green-500',
  'very-strong': 'bg-emerald-500',
};

const STRENGTH_LABELS: Record<PasswordValidationResult['strength'], string> = {
  'weak': 'Weak',
  'fair': 'Fair',
  'good': 'Good',
  'strong': 'Strong',
  'very-strong': 'Very Strong',
};

export const PasswordStrengthIndicator = ({
  password,
  onPasswordChange,
  showRequirements = true,
  showSuggestions = true,
  showGenerator = true,
  className,
}: PasswordStrengthIndicatorProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  // Validate password
  const validation = useMemo(() => {
    if (!password) {
      return null;
    }
    return validatePasswordSync(password);
  }, [password]);

  // Handle password generation
  const handleGeneratePassword = () => {
    const newPassword = generatePassword(16);
    setGeneratedPassword(newPassword);
    if (onPasswordChange) {
      onPasswordChange(newPassword);
    }
  };

  // Copy generated password
  const handleCopyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
    }
  };

  if (!password && !showGenerator) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Password Generator */}
      {showGenerator && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGeneratePassword}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Generate Strong Password
          </Button>
          {generatedPassword && (
            <div className="flex items-center gap-2 flex-1">
              <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                {showPassword ? generatedPassword : '•'.repeat(generatedPassword.length)}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyPassword}
              >
                Copy
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Strength Indicator */}
      {validation && (
        <>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Password Strength</span>
              <span
                className={cn(
                  'font-medium',
                  validation.strength === 'weak' && 'text-red-500',
                  validation.strength === 'fair' && 'text-orange-500',
                  validation.strength === 'good' && 'text-yellow-600',
                  validation.strength === 'strong' && 'text-green-500',
                  validation.strength === 'very-strong' && 'text-emerald-500'
                )}
              >
                {STRENGTH_LABELS[validation.strength]}
              </span>
            </div>
            <Progress
              value={validation.score}
              className={cn(
                'h-2',
                '[&>div]:transition-all [&>div]:duration-300',
                `[&>div]:${STRENGTH_COLORS[validation.strength]}`
              )}
            />
          </div>

          {/* Requirements Checklist */}
          {showRequirements && (
            <div className="space-y-1.5">
              <RequirementItem
                met={validation.requirements.minLength}
                label="At least 8 characters"
              />
              <RequirementItem
                met={validation.requirements.hasUppercase}
                label="At least one uppercase letter (A-Z)"
              />
              <RequirementItem
                met={validation.requirements.hasLowercase}
                label="At least one lowercase letter (a-z)"
              />
              <RequirementItem
                met={validation.requirements.hasNumber}
                label="At least one number (0-9)"
              />
              <RequirementItem
                met={validation.requirements.hasSpecialChar}
                label="At least one special character (!@#$%^&*)"
              />
              {!validation.requirements.noCommonPatterns && (
                <RequirementItem
                  met={false}
                  label="Avoid common passwords"
                  isWarning
                />
              )}
              {!validation.requirements.noSequentialChars && (
                <RequirementItem
                  met={false}
                  label="Avoid sequential characters (abc, 123)"
                  isWarning
                />
              )}
            </div>
          )}

          {/* Errors */}
          {validation.errors.length > 0 && (
            <div className="space-y-1">
              {validation.errors.map((error, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-red-500"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="space-y-1">
              {validation.warnings.map((warning, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-orange-500"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && validation.suggestions.length > 0 && validation.isValid && (
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="font-medium">Tips for a stronger password:</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                {validation.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Requirement item component
interface RequirementItemProps {
  met: boolean;
  label: string;
  isWarning?: boolean;
}

const RequirementItem = ({ met, label, isWarning = false }: RequirementItemProps) => (
  <div
    className={cn(
      'flex items-center gap-2 text-sm transition-colors',
      met ? 'text-green-600 dark:text-green-400' : isWarning ? 'text-orange-500' : 'text-muted-foreground'
    )}
  >
    {met ? (
      <Check className="h-4 w-4 shrink-0" />
    ) : (
      <X className={cn('h-4 w-4 shrink-0', isWarning && 'text-orange-500')} />
    )}
    <span>{label}</span>
  </div>
);

export default PasswordStrengthIndicator;
