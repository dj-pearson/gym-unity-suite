import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePortalAuth } from './PortalAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Dumbbell, Flame, Target, TrendingUp, Calendar, Clock } from 'lucide-react';

interface FitnessStats {
  weeklyCheckIns: number;
  monthlyCheckIns: number;
  currentStreak: number;
  totalHours: number;
  weeklyGoal: number;
}

export default function PortalFitnessPage() {
  const { profile } = usePortalAuth();
  const [stats, setStats] = useState<FitnessStats>({
    weeklyCheckIns: 0,
    monthlyCheckIns: 0,
    currentStreak: 0,
    totalHours: 0,
    weeklyGoal: 4,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchFitnessData = async () => {
      try {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Weekly check-ins
        const { count: weeklyCount } = await supabase
          .from('check_ins')
          .select('id', { count: 'exact', head: true })
          .eq('member_id', profile.id)
          .gte('checked_in_at', weekStart.toISOString());

        // Monthly check-ins
        const { count: monthlyCount } = await supabase
          .from('check_ins')
          .select('id', { count: 'exact', head: true })
          .eq('member_id', profile.id)
          .gte('checked_in_at', monthStart.toISOString());

        // Recent check-ins for streak calculation
        const { data: recentCheckins } = await supabase
          .from('check_ins')
          .select('checked_in_at, duration_hours')
          .eq('member_id', profile.id)
          .order('checked_in_at', { ascending: false })
          .limit(60);

        // Calculate streak (consecutive days with check-ins)
        let streak = 0;
        if (recentCheckins && recentCheckins.length > 0) {
          const uniqueDays = new Set(
            recentCheckins.map(c => new Date(c.checked_in_at).toDateString())
          );
          const today = new Date();
          for (let i = 0; i < 60; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            if (uniqueDays.has(checkDate.toDateString())) {
              streak++;
            } else if (i > 0) {
              break;
            }
          }
        }

        // Total hours
        const totalHours = (recentCheckins || []).reduce(
          (sum, c) => sum + (c.duration_hours || 1), 0
        );

        setStats({
          weeklyCheckIns: weeklyCount || 0,
          monthlyCheckIns: monthlyCount || 0,
          currentStreak: streak,
          totalHours: Math.round(totalHours),
          weeklyGoal: 4,
        });
      } catch (error) {
        console.error('Error fetching fitness data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFitnessData();
  }, [profile?.id]);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const weeklyProgress = Math.min((stats.weeklyCheckIns / stats.weeklyGoal) * 100, 100);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Fitness Tracking</h1>
        <p className="text-muted-foreground">Track your gym activity and progress</p>
      </div>

      {/* Weekly Goal Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5" />
            Weekly Goal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold">{stats.weeklyCheckIns}/{stats.weeklyGoal}</span>
            <Badge variant={weeklyProgress >= 100 ? 'default' : 'secondary'}>
              {weeklyProgress >= 100 ? 'Goal Met!' : `${Math.round(weeklyProgress)}%`}
            </Badge>
          </div>
          <Progress value={weeklyProgress} className="h-3" />
          <p className="text-sm text-muted-foreground">
            {stats.weeklyGoal - stats.weeklyCheckIns > 0
              ? `${stats.weeklyGoal - stats.weeklyCheckIns} more visit${stats.weeklyGoal - stats.weeklyCheckIns > 1 ? 's' : ''} to reach your goal`
              : 'Great job hitting your weekly goal!'}
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <p className="text-3xl font-bold">{stats.currentStreak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-3xl font-bold">{stats.monthlyCheckIns}</p>
            <p className="text-xs text-muted-foreground">This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-3xl font-bold">{stats.totalHours}</p>
            <p className="text-xs text-muted-foreground">Hours Logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <p className="text-3xl font-bold">{stats.weeklyCheckIns}</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </CardContent>
        </Card>
      </div>

      {/* Motivation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Dumbbell className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium">
                {stats.currentStreak >= 7
                  ? "You're on fire! Keep the momentum going."
                  : stats.currentStreak >= 3
                  ? "Nice streak! You're building great habits."
                  : "Every visit counts. Let's build that streak!"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Consistency is key to reaching your fitness goals.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
