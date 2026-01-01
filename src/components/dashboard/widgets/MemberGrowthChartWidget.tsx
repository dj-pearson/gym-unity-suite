import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';

interface MonthlyData {
  month: string;
  newMembers: number;
  totalMembers: number;
}

/**
 * MemberGrowthChartWidget - Displays member growth trends over time
 *
 * Shows new member signups and cumulative total members over the last 6 months
 */
export function MemberGrowthChartWidget() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  // Fetch member data grouped by month
  const { data: memberData, isLoading, error } = useQuery({
    queryKey: ['member-growth', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      // Get members with their creation dates
      const { data, error } = await supabase
        .from('profiles')
        .select('id, created_at, role')
        .eq('organization_id', organizationId)
        .eq('role', 'member')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching member growth data:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Process data into monthly buckets
  const chartData = useMemo<MonthlyData[]>(() => {
    if (!memberData || memberData.length === 0) {
      // Return empty months if no data
      const months: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        months.push({
          month: format(date, 'MMM yyyy'),
          newMembers: 0,
          totalMembers: 0,
        });
      }
      return months;
    }

    // Generate last 6 months
    const months: MonthlyData[] = [];
    let runningTotal = 0;

    // Count members before our 6-month window
    const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
    memberData.forEach((member) => {
      const createdAt = parseISO(member.created_at);
      if (createdAt < sixMonthsAgo) {
        runningTotal++;
      }
    });

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      // Count new members in this month
      const newMembers = memberData.filter((member) => {
        const createdAt = parseISO(member.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      }).length;

      runningTotal += newMembers;

      months.push({
        month: format(monthDate, 'MMM'),
        newMembers,
        totalMembers: runningTotal,
      });
    }

    return months;
  }, [memberData]);

  // Calculate growth metrics
  const growthMetrics = useMemo(() => {
    if (chartData.length < 2) {
      return { percentChange: 0, trend: 'neutral' as const };
    }

    const lastMonth = chartData[chartData.length - 1];
    const previousMonth = chartData[chartData.length - 2];

    if (previousMonth.totalMembers === 0) {
      return {
        percentChange: lastMonth.totalMembers > 0 ? 100 : 0,
        trend: lastMonth.totalMembers > 0 ? 'up' as const : 'neutral' as const
      };
    }

    const change = ((lastMonth.totalMembers - previousMonth.totalMembers) / previousMonth.totalMembers) * 100;
    return {
      percentChange: Math.round(change * 10) / 10,
      trend: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const,
    };
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="font-medium">Unable to load growth data</p>
        <p className="text-sm mt-1">Please try again later</p>
      </div>
    );
  }

  const totalMembers = chartData[chartData.length - 1]?.totalMembers || 0;
  const newThisMonth = chartData[chartData.length - 1]?.newMembers || 0;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold">{totalMembers}</p>
          <p className="text-xs text-muted-foreground">Total Members</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">+{newThisMonth}</p>
          <p className="text-xs text-muted-foreground">New This Month</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            {growthMetrics.trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : growthMetrics.trend === 'down' ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : null}
            <span className={`text-2xl font-bold ${
              growthMetrics.trend === 'up' ? 'text-green-500' :
              growthMetrics.trend === 'down' ? 'text-red-500' : ''
            }`}>
              {growthMetrics.percentChange > 0 ? '+' : ''}{growthMetrics.percentChange}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Growth Rate</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Area
              type="monotone"
              dataKey="totalMembers"
              name="Total Members"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorMembers)"
            />
            <Area
              type="monotone"
              dataKey="newMembers"
              name="New Members"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              fill="none"
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span className="text-muted-foreground">Total Members</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full border-2 border-dashed border-[hsl(var(--chart-2))]" />
          <span className="text-muted-foreground">New Members</span>
        </div>
      </div>
    </div>
  );
}
