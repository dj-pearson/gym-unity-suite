import {
  Users,
  Activity,
  UserCheck,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  Plus,
  BarChart3,
  Target,
  type LucideIcon,
} from 'lucide-react';

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';
export type WidgetType =
  | 'stat-total-members'
  | 'stat-active-members'
  | 'stat-today-checkins'
  | 'stat-monthly-revenue'
  | 'stat-upcoming-classes'
  | 'quick-actions'
  | 'recent-activity'
  | 'member-growth-chart'
  | 'revenue-chart'
  | 'class-schedule'
  | 'sales-pipeline'
  | 'leads-overview'
  | 'retention-metrics'
  | 'performance-metrics';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  size: WidgetSize;
  icon: LucideIcon;
  gradient?: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
  roles: string[]; // Which roles can see this widget
  defaultEnabled: boolean;
}

/**
 * All available dashboard widgets
 */
export const AVAILABLE_WIDGETS: Record<WidgetType, WidgetConfig> = {
  'stat-total-members': {
    id: 'stat-total-members',
    type: 'stat-total-members',
    title: 'Total Members',
    description: 'Total number of gym members',
    size: 'small',
    icon: Users,
    gradient: 'primary',
    roles: ['owner', 'admin', 'staff', 'sales'],
    defaultEnabled: true,
  },
  'stat-active-members': {
    id: 'stat-active-members',
    type: 'stat-active-members',
    title: 'Active Members',
    description: 'Members with active memberships',
    size: 'small',
    icon: Activity,
    gradient: 'success',
    roles: ['owner', 'admin', 'staff'],
    defaultEnabled: true,
  },
  'stat-today-checkins': {
    id: 'stat-today-checkins',
    type: 'stat-today-checkins',
    title: "Today's Check-ins",
    description: 'Number of member check-ins today',
    size: 'small',
    icon: UserCheck,
    gradient: 'secondary',
    roles: ['owner', 'admin', 'staff'],
    defaultEnabled: true,
  },
  'stat-monthly-revenue': {
    id: 'stat-monthly-revenue',
    type: 'stat-monthly-revenue',
    title: 'Monthly Revenue',
    description: 'Total monthly recurring revenue',
    size: 'small',
    icon: DollarSign,
    gradient: 'warning',
    roles: ['owner', 'admin'],
    defaultEnabled: true,
  },
  'stat-upcoming-classes': {
    id: 'stat-upcoming-classes',
    type: 'stat-upcoming-classes',
    title: 'Upcoming Classes',
    description: 'Classes scheduled for the next 7 days',
    size: 'small',
    icon: Calendar,
    gradient: 'info',
    roles: ['owner', 'admin', 'staff', 'instructor'],
    defaultEnabled: false,
  },
  'quick-actions': {
    id: 'quick-actions',
    type: 'quick-actions',
    title: 'Quick Actions',
    description: 'Common tasks and shortcuts',
    size: 'medium',
    icon: Plus,
    roles: ['owner', 'admin', 'staff', 'sales'],
    defaultEnabled: true,
  },
  'recent-activity': {
    id: 'recent-activity',
    type: 'recent-activity',
    title: 'Recent Activity',
    description: 'Latest member activities',
    size: 'medium',
    icon: Clock,
    roles: ['owner', 'admin', 'staff'],
    defaultEnabled: true,
  },
  'member-growth-chart': {
    id: 'member-growth-chart',
    type: 'member-growth-chart',
    title: 'Member Growth',
    description: 'Member acquisition over time',
    size: 'large',
    icon: TrendingUp,
    roles: ['owner', 'admin'],
    defaultEnabled: true,
  },
  'revenue-chart': {
    id: 'revenue-chart',
    type: 'revenue-chart',
    title: 'Revenue Overview',
    description: 'Monthly and yearly revenue tracking',
    size: 'large',
    icon: DollarSign,
    roles: ['owner', 'admin'],
    defaultEnabled: true,
  },
  'class-schedule': {
    id: 'class-schedule',
    type: 'class-schedule',
    title: 'Class Schedule',
    description: "Today's and upcoming class schedule",
    size: 'large',
    icon: Calendar,
    roles: ['owner', 'admin', 'staff', 'instructor'],
    defaultEnabled: false,
  },
  'sales-pipeline': {
    id: 'sales-pipeline',
    type: 'sales-pipeline',
    title: 'Sales Pipeline',
    description: 'Lead conversion and deal status',
    size: 'large',
    icon: Target,
    roles: ['owner', 'admin', 'sales'],
    defaultEnabled: false,
  },
  'leads-overview': {
    id: 'leads-overview',
    type: 'leads-overview',
    title: 'Leads Overview',
    description: 'New and active leads',
    size: 'medium',
    icon: Users,
    gradient: 'primary',
    roles: ['owner', 'admin', 'sales'],
    defaultEnabled: false,
  },
  'retention-metrics': {
    id: 'retention-metrics',
    type: 'retention-metrics',
    title: 'Retention Metrics',
    description: 'Member retention and churn rates',
    size: 'medium',
    icon: BarChart3,
    gradient: 'success',
    roles: ['owner', 'admin'],
    defaultEnabled: false,
  },
  'performance-metrics': {
    id: 'performance-metrics',
    type: 'performance-metrics',
    title: 'Performance Metrics',
    description: 'Key performance indicators',
    size: 'large',
    icon: TrendingUp,
    roles: ['owner', 'admin'],
    defaultEnabled: false,
  },
};

/**
 * Default dashboard layouts per role
 */
export const DEFAULT_DASHBOARD_LAYOUTS: Record<string, string[]> = {
  owner: [
    'stat-total-members',
    'stat-active-members',
    'stat-today-checkins',
    'stat-monthly-revenue',
    'quick-actions',
    'recent-activity',
    'member-growth-chart',
    'revenue-chart',
  ],
  admin: [
    'stat-total-members',
    'stat-active-members',
    'stat-today-checkins',
    'stat-monthly-revenue',
    'quick-actions',
    'recent-activity',
    'member-growth-chart',
    'revenue-chart',
  ],
  staff: [
    'stat-total-members',
    'stat-active-members',
    'stat-today-checkins',
    'quick-actions',
    'recent-activity',
    'class-schedule',
  ],
  sales: [
    'stat-total-members',
    'quick-actions',
    'leads-overview',
    'sales-pipeline',
    'recent-activity',
  ],
  instructor: [
    'stat-today-checkins',
    'stat-upcoming-classes',
    'class-schedule',
    'recent-activity',
  ],
  member: [
    'stat-upcoming-classes',
    'class-schedule',
    'recent-activity',
  ],
};

/**
 * Get default widgets for a role
 */
export function getDefaultWidgetsForRole(role: string): WidgetConfig[] {
  const widgetIds = DEFAULT_DASHBOARD_LAYOUTS[role] || DEFAULT_DASHBOARD_LAYOUTS.member;
  return widgetIds
    .map((id) => AVAILABLE_WIDGETS[id as WidgetType])
    .filter(Boolean);
}

/**
 * Get available widgets for a role (widgets they can add)
 */
export function getAvailableWidgetsForRole(role: string): WidgetConfig[] {
  return Object.values(AVAILABLE_WIDGETS).filter((widget) =>
    widget.roles.includes(role)
  );
}

/**
 * Get widget size in grid columns
 */
export function getWidgetGridColumns(size: WidgetSize): string {
  switch (size) {
    case 'small':
      return 'col-span-12 md:col-span-6 lg:col-span-3';
    case 'medium':
      return 'col-span-12 md:col-span-6 lg:col-span-6';
    case 'large':
      return 'col-span-12 lg:col-span-6';
    case 'full':
      return 'col-span-12';
    default:
      return 'col-span-12 md:col-span-6';
  }
}
