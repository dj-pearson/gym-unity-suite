import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  className?: string;
}

/**
 * Reusable EmptyState component for consistent empty/no-data UX across all pages.
 *
 * Usage:
 * ```tsx
 * <EmptyState
 *   icon={Users}
 *   title="No members found"
 *   description="Start by adding your first member"
 *   actionLabel="Add Member"
 *   actionIcon={Plus}
 *   onAction={() => setShowForm(true)}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("text-center py-12", className)}>
      <Icon className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-4 max-w-sm mx-auto">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-gradient-secondary hover:opacity-90">
          {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
