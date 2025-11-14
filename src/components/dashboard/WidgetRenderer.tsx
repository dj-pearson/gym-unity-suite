import React from 'react';
import { type WidgetType } from '@/lib/dashboardWidgets';
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
 * WidgetRenderer - Routes widget types to their respective components
 *
 * Central component that handles rendering the correct widget content
 * based on the widget type
 */
export function WidgetRenderer({ type, stats }: WidgetRendererProps) {
  switch (type) {
    // Stat widgets
    case 'stat-total-members':
      return (
        <StatCardContent
          value={stats?.totalMembers || 0}
          change={{ value: `${stats?.memberGrowth || 0}%`, type: 'positive' }}
        />
      );

    case 'stat-active-members':
      return <StatCardContent value={stats?.activeMembers || 0} />;

    case 'stat-today-checkins':
      return <StatCardContent value={stats?.todayCheckins || 0} />;

    case 'stat-monthly-revenue':
      return (
        <StatCardContent
          value={`$${(stats?.monthlyRevenue || 0).toLocaleString()}`}
        />
      );

    case 'stat-upcoming-classes':
      return <StatCardContent value={stats?.upcomingClasses || 0} />;

    // Complex widgets
    case 'quick-actions':
      return <QuickActionsWidget />;

    case 'recent-activity':
      return <RecentActivityWidget />;

    case 'member-growth-chart':
      return <MemberGrowthChartWidget />;

    case 'revenue-chart':
      return <RevenueChartWidget />;

    case 'class-schedule':
      return <ClassScheduleWidget />;

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
