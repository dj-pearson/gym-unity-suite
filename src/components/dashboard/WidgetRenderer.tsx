import React from 'react';
import { type WidgetType } from '@/lib/dashboardWidgets';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { StatCardContent } from './widgets/StatCardContent';
import { QuickActionsWidget } from './widgets/QuickActionsWidget';
import { RecentActivityWidget } from './widgets/RecentActivityWidget';
import { MemberGrowthChartWidget } from './widgets/MemberGrowthChartWidget';
import { RevenueChartWidget } from './widgets/RevenueChartWidget';
import { ClassScheduleWidget } from './widgets/ClassScheduleWidget';

interface WidgetRendererProps {
  type: WidgetType;
  stats?: any; // Dashboard stats passed down
}

/**
 * Wraps a widget component with an ErrorBoundary so individual widget
 * failures don't cascade and take down the entire dashboard.
 */
function SafeWidget({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <ErrorBoundary componentName={name}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * WidgetRenderer - Routes widget types to their respective components
 *
 * Central component that handles rendering the correct widget content
 * based on the widget type. Each widget is wrapped in an ErrorBoundary
 * so a single widget crash won't take down the entire dashboard.
 */
export function WidgetRenderer({ type, stats }: WidgetRendererProps) {
  switch (type) {
    // Stat widgets
    case 'stat-total-members':
      return (
        <SafeWidget name="Total Members">
          <StatCardContent
            value={stats?.totalMembers || 0}
            change={{ value: `${stats?.memberGrowth || 0}%`, type: 'positive' }}
          />
        </SafeWidget>
      );

    case 'stat-active-members':
      return (
        <SafeWidget name="Active Members">
          <StatCardContent value={stats?.activeMembers || 0} />
        </SafeWidget>
      );

    case 'stat-today-checkins':
      return (
        <SafeWidget name="Today's Check-ins">
          <StatCardContent value={stats?.todayCheckins || 0} />
        </SafeWidget>
      );

    case 'stat-monthly-revenue':
      return (
        <SafeWidget name="Monthly Revenue">
          <StatCardContent
            value={`$${(stats?.monthlyRevenue || 0).toLocaleString()}`}
          />
        </SafeWidget>
      );

    case 'stat-upcoming-classes':
      return (
        <SafeWidget name="Upcoming Classes">
          <StatCardContent value={stats?.upcomingClasses || 0} />
        </SafeWidget>
      );

    // Complex widgets
    case 'quick-actions':
      return (
        <SafeWidget name="Quick Actions">
          <QuickActionsWidget />
        </SafeWidget>
      );

    case 'recent-activity':
      return (
        <SafeWidget name="Recent Activity">
          <RecentActivityWidget />
        </SafeWidget>
      );

    case 'member-growth-chart':
      return (
        <SafeWidget name="Member Growth Chart">
          <MemberGrowthChartWidget />
        </SafeWidget>
      );

    case 'revenue-chart':
      return (
        <SafeWidget name="Revenue Chart">
          <RevenueChartWidget />
        </SafeWidget>
      );

    case 'class-schedule':
      return (
        <SafeWidget name="Class Schedule">
          <ClassScheduleWidget />
        </SafeWidget>
      );

    // Placeholder for not-yet-implemented widgets
    case 'sales-pipeline':
    case 'leads-overview':
    case 'retention-metrics':
    case 'performance-metrics':
      return (
        <div className="py-8 text-center text-muted-foreground">
          <p className="text-sm">Widget coming soon</p>
        </div>
      );

    default:
      return (
        <div className="py-8 text-center text-muted-foreground">
          <p className="text-sm">Unknown widget type</p>
        </div>
      );
  }
}
