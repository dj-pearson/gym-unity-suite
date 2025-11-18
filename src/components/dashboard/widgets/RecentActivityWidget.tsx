import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, Calendar, Plus, Activity } from 'lucide-react';

interface RecentActivity {
  id: string;
  type: 'checkin' | 'new_member' | 'class_booking' | 'lead_created';
  description: string;
  timestamp: string;
  member_name?: string;
}

/**
 * RecentActivityWidget - Shows latest member activities
 */
export function RecentActivityWidget() {
  const { profile } = useAuth();
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchRecentActivity();
    }
  }, [profile?.organization_id]);

  const fetchRecentActivity = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      const activitiesList: RecentActivity[] = [];

      // Fetch recent check-ins
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select(`
          id,
          checked_in_at,
          member_id,
          profiles:member_id (first_name, last_name, email)
        `)
        .order('checked_in_at', { ascending: false })
        .limit(5);

      checkIns?.forEach((checkIn: any) => {
        const memberName =
          checkIn.profiles?.first_name && checkIn.profiles?.last_name
            ? `${checkIn.profiles.first_name} ${checkIn.profiles.last_name}`
            : checkIn.profiles?.email || 'Member';

        activitiesList.push({
          id: `checkin-${checkIn.id}`,
          type: 'checkin',
          description: `${memberName} checked in`,
          timestamp: checkIn.checked_in_at,
          member_name: memberName,
        });
      });

      // Fetch recent new members
      const { data: newMembers } = await supabase
        .from('profiles')
        .select('id, created_at, first_name, last_name, email')
        .eq('organization_id', profile.organization_id)
        .eq('role', 'member')
        .order('created_at', { ascending: false })
        .limit(3);

      newMembers?.forEach((member: any) => {
        const memberName =
          member.first_name && member.last_name
            ? `${member.first_name} ${member.last_name}`
            : member.email;

        activitiesList.push({
          id: `member-${member.id}`,
          type: 'new_member',
          description: `${memberName} joined the gym`,
          timestamp: member.created_at,
          member_name: memberName,
        });
      });

      // Sort by timestamp
      activitiesList.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(activitiesList.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="mx-auto h-12 w-12 opacity-50 mb-4" />
        <p className="text-sm">No recent activity to display</p>
        <p className="text-xs mt-1">Member activities will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-full ${
              activity.type === 'checkin'
                ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                : activity.type === 'new_member'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : activity.type === 'class_booking'
                ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                : 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
            }`}
          >
            {activity.type === 'checkin' && <UserCheck className="h-4 w-4" />}
            {activity.type === 'new_member' && <Users className="h-4 w-4" />}
            {activity.type === 'class_booking' && <Calendar className="h-4 w-4" />}
            {activity.type === 'lead_created' && <Plus className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{activity.description}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(activity.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
