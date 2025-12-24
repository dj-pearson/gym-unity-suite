import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { GettingStartedWidget } from '@/components/dashboard/GettingStartedWidget';
import { useDashboardPreferences } from '@/hooks/useDashboardPreferences';

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  todayCheckins: number;
  monthlyRevenue: number;
  upcomingClasses: number;
  memberGrowth: number;
}

/**
 * Dashboard - Personalized role-based dashboard with drag-and-drop widgets
 *
 * Features:
 * - Role-specific default widgets
 * - Drag-and-drop to reorder widgets
 * - Add/remove widgets based on preferences
 * - Persists preferences to user profile
 * - Real-time stats from Supabase
 *
 * Priority 4: Smart Dashboard Personalization
 */
export default function Dashboard() {
  const { profile, organization } = useAuth();
  const {
    widgets,
    isLoading: prefsLoading,
    addWidget,
    removeWidget,
    reorderWidgets,
    resetToDefaults,
  } = useDashboardPreferences();

  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    todayCheckins: 0,
    monthlyRevenue: 0,
    upcomingClasses: 0,
    memberGrowth: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchDashboardStats();
    }
  }, [profile?.organization_id]);

  const fetchDashboardStats = async () => {
    if (!profile?.organization_id) return;

    try {
      setStatsLoading(true);

      // Fetch total members
      const { count: totalMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('role', 'member');

      // Fetch active members
      const { count: activeMembers } = await supabase
        .from('memberships')
        .select('member_id', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active');

      // Fetch today's check-ins
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCheckins } = await supabase
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .gte('checked_in_at', `${today}T00:00:00`)
        .lt('checked_in_at', `${today}T23:59:59`);

      // Fetch upcoming classes (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const { count: upcomingClasses } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .gte('scheduled_at', new Date().toISOString())
        .lt('scheduled_at', nextWeek.toISOString());

      // Calculate monthly revenue from membership plans
      const { data: membershipData } = await supabase
        .from('memberships')
        .select(`
          member_id,
          membership_plans (price)
        `)
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active');

      const monthlyRevenue = membershipData?.reduce((sum, membership: any) => {
        return sum + (Number(membership.membership_plans?.price) || 0);
      }, 0) || 0;

      // Calculate member growth (last 30 days vs previous 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { count: recentMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('role', 'member')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { count: previousMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('role', 'member')
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString());

      const memberGrowth = previousMembers && previousMembers > 0
        ? Math.round(((recentMembers || 0) - previousMembers) / previousMembers * 100)
        : (recentMembers || 0) > 0 ? 100 : 0;

      setStats({
        totalMembers: totalMembers || 0,
        activeMembers: activeMembers || 0,
        todayCheckins: todayCheckins || 0,
        monthlyRevenue,
        upcomingClasses: upcomingClasses || 0,
        memberGrowth,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  if (prefsLoading || statsLoading) {
    return (
      <div className="space-y-6 animate-in fade-in-0 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse mt-2" />
          </div>
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-12 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="col-span-12 md:col-span-6 lg:col-span-4">
              <div className="h-40 bg-muted rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {profile?.first_name || 'User'}! Here's what's happening at{' '}
            {organization?.name || 'your gym'}.
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Getting Started Guide for new users */}
      <GettingStartedWidget />

      {/* Personalized Dashboard Grid */}
      <DashboardGrid
        widgets={widgets}
        stats={stats}
        onReorder={reorderWidgets}
        onRemove={removeWidget}
        onAdd={addWidget}
        onReset={resetToDefaults}
      />
    </div>
  );
}
