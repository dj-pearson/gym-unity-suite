import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardContentProps {
  value: string | number;
  change?: {
    value: string;
    type: 'positive' | 'negative';
  };
  subtitle?: string;
}

/**
 * StatCardContent - Simple stat display for dashboard widgets
 */
export function StatCardContent({ value, change, subtitle }: StatCardContentProps) {
  return (
    <div>
      <div className="text-3xl font-bold text-foreground">{value}</div>

      {change && (
        <div className="flex items-center gap-1 mt-2">
          {change.type === 'positive' ? (
            <>
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm text-success font-medium">{change.value}</span>
            </>
          ) : (
            <>
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive font-medium">{change.value}</span>
            </>
          )}
          <span className="text-sm text-muted-foreground ml-1">vs last period</span>
        </div>
      )}

      {subtitle && (
        <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
      )}
    </div>
  );
}
