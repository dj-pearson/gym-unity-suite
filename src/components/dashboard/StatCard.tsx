import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  icon: LucideIcon;
  gradient?: 'primary' | 'secondary' | 'success' | 'warning';
  className?: string;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  gradient = 'primary',
  className,
  loading = false,
}) => {
  const gradientClasses = {
    primary: 'from-primary to-primary-glow',
    secondary: 'from-secondary to-secondary-glow',
    success: 'from-success to-green-400',
    warning: 'from-warning to-yellow-400',
  };

  return (
    <Card className={cn('stat-card', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          'p-2 rounded-lg bg-gradient-to-br',
          gradientClasses[gradient]
        )}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            {change && (
              <div className="flex items-center mt-1">
                <span
                  className={cn(
                    'text-xs font-medium',
                    change.type === 'positive' && 'text-success',
                    change.type === 'negative' && 'text-destructive',
                    change.type === 'neutral' && 'text-muted-foreground'
                  )}
                >
                  {change.type === 'positive' && '+'}
                  {change.value}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  from last month
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};