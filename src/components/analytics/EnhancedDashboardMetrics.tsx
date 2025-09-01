import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Target,
  Activity,
  Award,
  Clock
} from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  progress?: number;
  target?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function MetricsCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon, 
  progress,
  target,
  variant = 'default' 
}: MetricsCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          iconBg: 'bg-gradient-to-br from-success to-success/80',
          valueColor: 'text-success',
          trendColor: 'text-success'
        };
      case 'warning':
        return {
          iconBg: 'bg-gradient-to-br from-warning to-warning/80',
          valueColor: 'text-warning',
          trendColor: 'text-warning'
        };
      case 'error':
        return {
          iconBg: 'bg-gradient-to-br from-destructive to-destructive/80',
          valueColor: 'text-destructive',
          trendColor: 'text-destructive'
        };
      default:
        return {
          iconBg: 'bg-gradient-primary',
          valueColor: 'text-gradient-primary',
          trendColor: trend && trend >= 0 ? 'text-success' : 'text-destructive'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Card className="gym-card stat-card group hover:shadow-elevation-2 transition-smooth">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2 flex-1">
            <div className="text-sm text-muted-foreground font-medium">{title}</div>
            <div className={`text-3xl font-bold ${styles.valueColor}`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            {subtitle && (
              <div className="text-xs text-muted-foreground font-semibold">
                {subtitle}
              </div>
            )}
          </div>
          <div className={`p-3 ${styles.iconBg} rounded-xl shadow-glow`}>
            {icon}
          </div>
        </div>

        {progress !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              {target && <span className="text-muted-foreground">Target: {target}</span>}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {trend !== undefined && (
          <div className="flex items-center justify-between pt-2">
            <Badge variant={trend >= 0 ? 'secondary' : 'destructive'} className="text-xs">
              {trend > 0 && '+'}{trend.toFixed(1)}%
            </Badge>
            <div className="text-xs text-muted-foreground">vs previous period</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardMetricsProps {
  metrics: {
    totalMembers: number;
    activeMembers: number;
    monthlyRevenue: number;
    membershipGrowth: number;
    churnRate: number;
    avgRevenuePerMember: number;
    classUtilization: number;
    marketingROI: number;
  };
}

export default function EnhancedDashboardMetrics({ metrics }: DashboardMetricsProps) {
  const activeRate = metrics.totalMembers > 0 
    ? (metrics.activeMembers / metrics.totalMembers) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricsCard
        title="Total Members"
        value={metrics.totalMembers}
        subtitle={`${metrics.activeMembers} active members`}
        trend={metrics.membershipGrowth}
        icon={<Users className="h-6 w-6 text-primary-foreground" />}
        progress={activeRate}
        variant="default"
      />

      <MetricsCard
        title="Monthly Revenue"
        value={`$${metrics.monthlyRevenue.toLocaleString()}`}
        subtitle={`$${metrics.avgRevenuePerMember.toFixed(0)} per member`}
        trend={15.2} // This would come from revenue comparison
        icon={<DollarSign className="h-6 w-6 text-secondary-foreground" />}
        progress={85}
        target={metrics.monthlyRevenue * 1.2}
        variant="success"
      />

      <MetricsCard
        title="Class Utilization"
        value={`${metrics.classUtilization.toFixed(1)}%`}
        subtitle="Capacity efficiency"
        trend={metrics.classUtilization - 70} // Assuming 70% is baseline
        icon={<Calendar className="h-6 w-6 text-primary-foreground" />}
        progress={metrics.classUtilization}
        variant={metrics.classUtilization >= 75 ? 'success' : 'warning'}
      />

      <MetricsCard
        title="Member Retention"
        value={`${(100 - metrics.churnRate).toFixed(1)}%`}
        subtitle={`${metrics.churnRate.toFixed(1)}% churn rate`}
        trend={-2.1} // Negative churn is good
        icon={<Award className="h-6 w-6 text-success-foreground" />}
        progress={100 - metrics.churnRate}
        variant="success"
      />
    </div>
  );
}