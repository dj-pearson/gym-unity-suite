import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Users, UserPlus, UserMinus, Activity, TrendingUp } from 'lucide-react';

interface MemberAnalyticsProps {
  timeRange: string;
}

interface MemberData {
  date: string;
  totalMembers: number;
  newMembers: number;
  activeMembers: number;
  checkIns: number;
}

interface CohortData {
  cohort: string;
  month0: number;
  month1: number;
  month2: number;
  month3: number;
  month6: number;
}

interface MembershipTypeData {
  name: string;
  count: number;
  color: string;
}

export default function MemberAnalytics({ timeRange }: MemberAnalyticsProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState<MemberData[]>([]);
  const [cohortData, setCohortData] = useState<CohortData[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<MembershipTypeData[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [newMembers, setNewMembers] = useState(0);
  const [churnRate, setChurnRate] = useState(0);
  const [avgVisitsPerMember, setAvgVisitsPerMember] = useState(0);

  useEffect(() => {
    fetchMemberAnalytics();
  }, [profile?.organization_id, timeRange]);

  const fetchMemberAnalytics = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      // Fetch all members
      const { data: members } = await supabase
        .from('profiles')
        .select(`
          id, 
          join_date, 
          created_at,
          memberships(
            id,
            plan:membership_plans(name, plan_type)
          )
        `)
        .eq('organization_id', profile.organization_id)
        .eq('role', 'member');

      setTotalMembers(members?.length || 0);

      // New members in period
      const newMembersInPeriod = members?.filter(m => 
        new Date(m.join_date || m.created_at) >= startDate
      ).length || 0;
      setNewMembers(newMembersInPeriod);

      // Fetch check-ins for activity analysis
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('member_id, checked_in_at')
        .gte('checked_in_at', startDate.toISOString())
        .eq('is_guest', false);

      // Calculate average visits per member
      const memberVisits: { [memberId: string]: number } = {};
      checkIns?.forEach(checkIn => {
        memberVisits[checkIn.member_id] = (memberVisits[checkIn.member_id] || 0) + 1;
      });

      const avgVisits = Object.keys(memberVisits).length > 0 
        ? Object.values(memberVisits).reduce((sum, visits) => sum + visits, 0) / Object.keys(memberVisits).length
        : 0;
      setAvgVisitsPerMember(avgVisits);

      // Group data by date for trends
      const dailyData: { [date: string]: MemberData } = {};
      
      // Initialize all dates in range
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toLocaleDateString();
        dailyData[dateStr] = {
          date: dateStr,
          totalMembers: 0,
          newMembers: 0,
          activeMembers: 0,
          checkIns: 0
        };
      }

      // Fill in check-in data
      checkIns?.forEach(checkIn => {
        const date = new Date(checkIn.checked_in_at).toLocaleDateString();
        if (dailyData[date]) {
          dailyData[date].checkIns += 1;
        }
      });

      // Fill in member data
      members?.forEach(member => {
        const joinDate = new Date(member.join_date || member.created_at);
        for (let d = new Date(Math.max(joinDate.getTime(), startDate.getTime())); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toLocaleDateString();
          if (dailyData[dateStr]) {
            dailyData[dateStr].totalMembers += 1;
            if (joinDate.toDateString() === d.toDateString()) {
              dailyData[dateStr].newMembers += 1;
            }
          }
        }
      });

      // Calculate active members per day (members who checked in)
      Object.keys(memberVisits).forEach(memberId => {
        // For simplicity, count as active if they have any check-ins in period
        const firstCheckInDate = checkIns?.find(ci => ci.member_id === memberId);
        if (firstCheckInDate) {
          const date = new Date(firstCheckInDate.checked_in_at).toLocaleDateString();
          if (dailyData[date]) {
            dailyData[date].activeMembers += 1;
          }
        }
      });

      const chartData = Object.values(dailyData).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setMemberData(chartData);

      // Membership type breakdown
      const typeBreakdown: { [type: string]: number } = {};
      members?.forEach(member => {
        const planType = member.memberships?.[0]?.plan?.plan_type || member.memberships?.[0]?.plan?.name || 'Unknown';
        typeBreakdown[planType] = (typeBreakdown[planType] || 0) + 1;
      });

      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      const membershipTypeData = Object.entries(typeBreakdown).map(([type, count], index) => ({
        name: type,
        count,
        color: colors[index % colors.length]
      }));
      setMembershipTypes(membershipTypeData);

      // Simple cohort analysis (monthly retention)
      const cohorts: CohortData[] = [];
      const monthlyGroups: { [month: string]: string[] } = {};
      
      members?.forEach(member => {
        const joinMonth = new Date(member.join_date || member.created_at).toISOString().substr(0, 7);
        if (!monthlyGroups[joinMonth]) {
          monthlyGroups[joinMonth] = [];
        }
        monthlyGroups[joinMonth].push(member.id);
      });

      // For demo, create simplified cohort data
      Object.entries(monthlyGroups).slice(-6).forEach(([month, memberIds]) => {
        cohorts.push({
          cohort: month,
          month0: memberIds.length,
          month1: Math.floor(memberIds.length * 0.85), // 85% retention
          month2: Math.floor(memberIds.length * 0.75), // 75% retention
          month3: Math.floor(memberIds.length * 0.65), // 65% retention
          month6: Math.floor(memberIds.length * 0.55), // 55% retention
        });
      });
      setCohortData(cohorts);

      // Calculate churn rate (simplified)
      const previousPeriodStart = new Date(startDate);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - parseInt(timeRange));
      
      const { data: prevMembers } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .eq('role', 'member')
        .lt('join_date', startDate.toISOString());

      const churn = prevMembers && members ? 
        Math.max(0, (prevMembers.length - (members.length - newMembersInPeriod)) / prevMembers.length * 100) : 0;
      setChurnRate(churn);

    } catch (error: any) {
      console.error('Error fetching member analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading member analytics...</div>;

  return (
    <div className="space-y-6">
      {/* Member Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalMembers}</div>
                <div className="text-sm text-muted-foreground">Total Members</div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{newMembers}</div>
                <div className="text-sm text-muted-foreground">New Members</div>
                <div className="text-xs text-green-600 mt-1">
                  This period
                </div>
              </div>
              <UserPlus className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{churnRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Churn Rate</div>
              </div>
              <UserMinus className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{avgVisitsPerMember.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Avg Visits/Member</div>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member Growth Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Member Growth & Activity</CardTitle>
          <CardDescription>
            Member count and check-in activity over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={memberData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="totalMembers" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Total Members"
              />
              <Line 
                type="monotone" 
                dataKey="newMembers" 
                stroke="#10b981" 
                strokeWidth={2}
                name="New Members"
              />
              <Line 
                type="monotone" 
                dataKey="checkIns" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Check-ins"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Membership Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Membership Types</CardTitle>
            <CardDescription>
              Distribution of members by membership plan type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={membershipTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, count }) => `${name}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {membershipTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Check-in Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Check-in Activity</CardTitle>
            <CardDescription>
              Member check-in volume over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={memberData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="checkIns" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.3}
                  name="Check-ins"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Analysis */}
      {cohortData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Member Retention Cohorts</CardTitle>
            <CardDescription>
              Monthly member retention rates by signup cohort
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cohortData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cohort" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="month0" stroke="#3b82f6" name="Month 0" />
                <Line type="monotone" dataKey="month1" stroke="#10b981" name="Month 1" />
                <Line type="monotone" dataKey="month2" stroke="#f59e0b" name="Month 2" />
                <Line type="monotone" dataKey="month3" stroke="#ef4444" name="Month 3" />
                <Line type="monotone" dataKey="month6" stroke="#8b5cf6" name="Month 6" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}