/**
 * Centralized color mapping utilities for consistent status and type colors across the application.
 *
 * This module provides standardized color mappings to replace duplicate getStatusColor() and similar
 * functions scattered across components. It supports both Tailwind CSS classes and shadcn Badge variants.
 */

/**
 * Badge variant types from shadcn-ui
 */
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

/**
 * Status color mappings using Tailwind CSS classes with dark mode support
 */
export const STATUS_COLORS = {
  // Common statuses
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',

  // Additional statuses
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  on_hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  suspended: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',

  // Billing/payment statuses
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  unpaid: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  refunded: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',

  // Booking/scheduling statuses
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  no_show: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',

  // Inspection/quality statuses
  passed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  needs_attention: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',

  // Location statuses
  under_construction: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  closed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  maintenance: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',

  // Towel/equipment specific
  returned: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  lost: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  damaged: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',

  // Tournament/event statuses
  registration_open: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  registration_closed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',

  // Bulk operations
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',

  // System health
  healthy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  degraded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  down: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
} as const;

/**
 * Simplified status colors using solid background colors (for badges, indicators)
 */
export const STATUS_BG_COLORS = {
  active: 'bg-green-500',
  inactive: 'bg-gray-500',
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
  in_progress: 'bg-yellow-500',
  no_show: 'bg-gray-500',
  paid: 'bg-green-500',
  unpaid: 'bg-red-500',
  partial: 'bg-yellow-500',
  refunded: 'bg-blue-500',
  returned: 'bg-green-500',
  overdue: 'bg-red-500',
  lost: 'bg-gray-500',
  damaged: 'bg-orange-500',
  under_construction: 'bg-yellow-500',
  closed: 'bg-red-500',
  maintenance: 'bg-orange-500',
  scheduled: 'bg-blue-500',
  draft: 'bg-gray-400',
} as const;

/**
 * Badge variant mappings for shadcn-ui Badge component
 */
export const STATUS_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  active: 'default',
  paid: 'default',
  confirmed: 'default',
  completed: 'default',

  pending: 'secondary',
  draft: 'outline',
  suspended: 'secondary',
  inactive: 'secondary',

  cancelled: 'destructive',
  rejected: 'destructive',
  failed: 'destructive',
  overdue: 'destructive',

  expired: 'outline',
};

/**
 * Semantic color mappings using CSS design system variables
 */
export const SEMANTIC_STATUS_COLORS = {
  active: 'bg-success text-success-foreground',
  paid: 'bg-success text-success-foreground',
  completed: 'bg-success text-success-foreground',
  passed: 'bg-success text-success-foreground',

  pending: 'bg-warning text-warning-foreground',
  processing: 'bg-warning text-warning-foreground',
  suspended: 'bg-warning text-warning-foreground',

  cancelled: 'bg-destructive text-destructive-foreground',
  failed: 'bg-destructive text-destructive-foreground',
  overdue: 'bg-destructive text-destructive-foreground',

  draft: 'bg-muted text-muted-foreground',
  inactive: 'bg-muted text-muted-foreground',

  confirmed: 'bg-primary text-primary-foreground',
  sent: 'bg-primary text-primary-foreground',
} as const;

/**
 * Interest level colors (for CRM lead scoring)
 */
export const INTEREST_LEVEL_COLORS = {
  hot: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  warm: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  cold: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  none: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
} as const;

/**
 * Priority level colors
 */
export const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
} as const;

/**
 * Health status colors (for system monitoring)
 */
export const HEALTH_STATUS_COLORS = {
  healthy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  degraded: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  down: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
} as const;

/**
 * Get status color classes with dark mode support
 *
 * @param status - The status value
 * @param defaultColor - Optional default color if status not found
 * @returns Tailwind CSS classes for the status color
 *
 * @example
 * ```tsx
 * <Badge className={getStatusColor('active')}>Active</Badge>
 * ```
 */
export function getStatusColor(
  status: string,
  defaultColor: string = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
): string {
  const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '_') || '';
  return STATUS_COLORS[normalizedStatus as keyof typeof STATUS_COLORS] || defaultColor;
}

/**
 * Get simplified background color for status indicator badges
 *
 * @param status - The status value
 * @param defaultColor - Optional default color if status not found
 * @returns Tailwind background color class
 *
 * @example
 * ```tsx
 * <div className={`rounded-full w-3 h-3 ${getStatusBgColor('active')}`} />
 * ```
 */
export function getStatusBgColor(
  status: string,
  defaultColor: string = 'bg-gray-400'
): string {
  const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '_') || '';
  return STATUS_BG_COLORS[normalizedStatus as keyof typeof STATUS_BG_COLORS] || defaultColor;
}

/**
 * Get Badge variant for shadcn-ui Badge component
 *
 * @param status - The status value
 * @param defaultVariant - Optional default variant if status not found
 * @returns Badge variant type
 *
 * @example
 * ```tsx
 * <Badge variant={getStatusBadgeVariant('active')}>Active</Badge>
 * ```
 */
export function getStatusBadgeVariant(
  status: string,
  defaultVariant: BadgeVariant = 'secondary'
): BadgeVariant {
  const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '_') || '';
  return STATUS_BADGE_VARIANTS[normalizedStatus] || defaultVariant;
}

/**
 * Get semantic status colors using CSS design system variables
 *
 * @param status - The status value
 * @param defaultColor - Optional default color if status not found
 * @returns CSS design system color classes
 *
 * @example
 * ```tsx
 * <Badge className={getSemanticStatusColor('paid')}>Paid</Badge>
 * ```
 */
export function getSemanticStatusColor(
  status: string,
  defaultColor: string = 'bg-muted text-muted-foreground'
): string {
  const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '_') || '';
  return SEMANTIC_STATUS_COLORS[normalizedStatus as keyof typeof SEMANTIC_STATUS_COLORS] || defaultColor;
}

/**
 * Get interest level color (for CRM)
 *
 * @param level - The interest level
 * @param defaultColor - Optional default color if level not found
 * @returns Tailwind CSS classes for the interest level color
 *
 * @example
 * ```tsx
 * <Badge className={getInterestLevelColor('hot')}>Hot Lead</Badge>
 * ```
 */
export function getInterestLevelColor(
  level: string,
  defaultColor: string = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
): string {
  const normalizedLevel = level?.toLowerCase() || '';
  return INTEREST_LEVEL_COLORS[normalizedLevel as keyof typeof INTEREST_LEVEL_COLORS] || defaultColor;
}

/**
 * Get priority color
 *
 * @param priority - The priority level
 * @param defaultColor - Optional default color if priority not found
 * @returns Tailwind CSS classes for the priority color
 *
 * @example
 * ```tsx
 * <Badge className={getPriorityColor('high')}>High Priority</Badge>
 * ```
 */
export function getPriorityColor(
  priority: string,
  defaultColor: string = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
): string {
  const normalizedPriority = priority?.toLowerCase() || '';
  return PRIORITY_COLORS[normalizedPriority as keyof typeof PRIORITY_COLORS] || defaultColor;
}

/**
 * Get health status color (for system monitoring)
 *
 * @param status - The health status
 * @param defaultColor - Optional default color if status not found
 * @returns Tailwind CSS classes for the health status color
 *
 * @example
 * ```tsx
 * <Badge className={getHealthStatusColor('healthy')}>System Healthy</Badge>
 * ```
 */
export function getHealthStatusColor(
  status: string,
  defaultColor: string = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
): string {
  const normalizedStatus = status?.toLowerCase() || '';
  return HEALTH_STATUS_COLORS[normalizedStatus as keyof typeof HEALTH_STATUS_COLORS] || defaultColor;
}

/**
 * Get payment status color
 *
 * @param status - The payment status
 * @param defaultColor - Optional default color if status not found
 * @returns Tailwind CSS classes for the payment status color
 *
 * @example
 * ```tsx
 * <Badge className={getPaymentStatusColor('paid')}>Paid</Badge>
 * ```
 */
export function getPaymentStatusColor(
  status: string,
  defaultColor: string = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
): string {
  const normalizedStatus = status?.toLowerCase() || '';
  const statusColorMap = {
    paid: STATUS_BG_COLORS.paid,
    unpaid: STATUS_BG_COLORS.unpaid,
    pending: STATUS_BG_COLORS.pending,
    partial: STATUS_BG_COLORS.partial,
    refunded: STATUS_BG_COLORS.refunded,
    overdue: STATUS_BG_COLORS.overdue,
  };
  return statusColorMap[normalizedStatus as keyof typeof statusColorMap] || defaultColor;
}
