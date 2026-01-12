import React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

/**
 * AccessibleIcon Component
 *
 * Wraps icons to ensure proper accessibility.
 * WCAG 2.1 Level A - Success Criterion 1.1.1 (Non-text Content)
 *
 * Usage patterns:
 * 1. Decorative icons: No accessible name needed (aria-hidden="true")
 * 2. Informative icons: Provide accessible name via aria-label or sr-only text
 * 3. Icon-only buttons: Must have accessible name
 */

interface AccessibleIconProps {
  /** The Lucide icon component to render */
  icon: LucideIcon;
  /**
   * Accessible label for the icon.
   * If not provided, icon is treated as decorative.
   */
  label?: string;
  /**
   * How to provide the accessible name:
   * - 'aria-label': Uses aria-label attribute (default)
   * - 'sr-only': Adds visually hidden span with text
   * - 'tooltip': Just uses title attribute (not recommended for accessibility)
   */
  labelMethod?: 'aria-label' | 'sr-only' | 'tooltip';
  /** Icon size in pixels or as className */
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
  /** Icon color (Tailwind class) */
  color?: string;
  /** Whether icon is decorative (overrides label behavior) */
  decorative?: boolean;
  /** Role for the icon element */
  role?: 'img' | 'presentation' | 'graphics-symbol';
}

const sizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export const AccessibleIcon: React.FC<AccessibleIconProps> = ({
  icon: Icon,
  label,
  labelMethod = 'aria-label',
  size = 'md',
  className,
  color,
  decorative = false,
  role,
}) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size];
  const isDecorative = decorative || !label;

  // Build aria attributes
  const ariaProps: Record<string, any> = {};

  if (isDecorative) {
    ariaProps['aria-hidden'] = true;
    ariaProps.role = 'presentation';
  } else {
    ariaProps.role = role || 'img';

    if (labelMethod === 'aria-label') {
      ariaProps['aria-label'] = label;
    } else if (labelMethod === 'tooltip') {
      ariaProps.title = label;
    }
  }

  return (
    <span className={cn('inline-flex items-center', className)}>
      <Icon
        className={cn(color)}
        width={pixelSize}
        height={pixelSize}
        {...ariaProps}
      />
      {!isDecorative && labelMethod === 'sr-only' && (
        <span className="sr-only">{label}</span>
      )}
    </span>
  );
};

/**
 * IconButton Component
 *
 * An accessible button that contains only an icon.
 * Ensures proper focus states and accessible names.
 */
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The Lucide icon component */
  icon: LucideIcon;
  /** Required accessible label for the button */
  label: string;
  /** Icon size */
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  /** Button variant */
  variant?: 'default' | 'ghost' | 'outline' | 'destructive';
  /** Whether button is loading */
  loading?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  label,
  size = 'md',
  variant = 'ghost',
  loading = false,
  className,
  disabled,
  ...props
}) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size];
  const buttonSize = typeof size === 'number' ? size + 16 : sizeMap[size] + 16;

  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    ghost: 'hover:bg-muted',
    outline: 'border border-border hover:bg-muted',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  };

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-md transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        variantClasses[variant],
        className
      )}
      style={{ width: buttonSize, height: buttonSize }}
      {...props}
    >
      {loading ? (
        <span
          className="animate-spin border-2 border-current border-t-transparent rounded-full"
          style={{ width: pixelSize - 4, height: pixelSize - 4 }}
          aria-hidden="true"
        />
      ) : (
        <Icon
          width={pixelSize}
          height={pixelSize}
          aria-hidden="true"
        />
      )}
    </button>
  );
};

/**
 * IconWithText Component
 *
 * Icon paired with visible text - icon is decorative.
 */
interface IconWithTextProps {
  /** The Lucide icon component */
  icon: LucideIcon;
  /** Text content */
  children: React.ReactNode;
  /** Icon position relative to text */
  position?: 'left' | 'right';
  /** Icon size */
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  /** Gap between icon and text */
  gap?: 'xs' | 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Icon color */
  iconColor?: string;
}

const gapMap = {
  xs: 'gap-1',
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-3',
};

export const IconWithText: React.FC<IconWithTextProps> = ({
  icon: Icon,
  children,
  position = 'left',
  size = 'md',
  gap = 'sm',
  className,
  iconColor,
}) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size];

  return (
    <span className={cn('inline-flex items-center', gapMap[gap], className)}>
      {position === 'left' && (
        <Icon
          width={pixelSize}
          height={pixelSize}
          className={cn(iconColor)}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
      {position === 'right' && (
        <Icon
          width={pixelSize}
          height={pixelSize}
          className={cn(iconColor)}
          aria-hidden="true"
        />
      )}
    </span>
  );
};

/**
 * StatusIcon Component
 *
 * Icon that represents a status with proper accessibility.
 */
interface StatusIconProps {
  /** Status type */
  status: 'success' | 'warning' | 'error' | 'info' | 'pending';
  /** Optional override for the accessible label */
  label?: string;
  /** Icon size */
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
}

import { CheckCircle2, AlertTriangle, XCircle, Info, Clock } from 'lucide-react';

const statusConfig = {
  success: { icon: CheckCircle2, color: 'text-success', label: 'Success' },
  warning: { icon: AlertTriangle, color: 'text-warning', label: 'Warning' },
  error: { icon: XCircle, color: 'text-destructive', label: 'Error' },
  info: { icon: Info, color: 'text-primary', label: 'Information' },
  pending: { icon: Clock, color: 'text-muted-foreground', label: 'Pending' },
};

export const StatusIcon: React.FC<StatusIconProps> = ({
  status,
  label,
  size = 'md',
  className,
}) => {
  const config = statusConfig[status];
  const pixelSize = typeof size === 'number' ? size : sizeMap[size];
  const accessibleLabel = label || config.label;

  return (
    <span className={cn('inline-flex items-center', className)}>
      <config.icon
        width={pixelSize}
        height={pixelSize}
        className={config.color}
        role="img"
        aria-label={accessibleLabel}
      />
    </span>
  );
};

export default AccessibleIcon;
