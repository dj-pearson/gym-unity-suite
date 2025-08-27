import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Calendar, DollarSign, Target, Award } from 'lucide-react';

interface StaffAnalyticsProps {
  timeRange: string;
}

interface StaffPerformance {
  id: string;
  name: string;
  role: string;
  classesTought: number;
  leadsConverted: number;
  toursGiven: number;
  salesMade: number;
  totalRevenue: number;
  commission: number;
}

interface StaffTrend {
  date: string;
  totalClasses: number;
  totalSales: number;
  totalRevenue: number;
}

export default function StaffAnalytics({ timeRange }: StaffAnalyticsProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);
  const [trendData, setTrendData] = useState<StaffTrend[]>([]);
  const [totalStaff, setTotalStaff] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [avgPerformance, setAvgPerformance] = useState(0);

  useEffect(() => {
    fetchStaffAnalytics();
  }, [profile?.organization_id, timeRange]);

  const fetchStaffAnalytics = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      // Fetch staff members
      const { data: staffMembers } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .eq('organization_id', profile.organization_id)
        .in('role', ['owner', 'manager', 'staff', 'trainer']);

      setTotalStaff(staffMembers?.length || 0);

      if (!staffMembers) return;

      // Fetch classes taught by instructors
      const { data: classes } = await supabase
        .from('classes')
        .select('instructor_id, scheduled_at, name')
        .eq('organization_id', profile.organization_id)
        .gte('scheduled_at', startDate.toISOString())
        .not('instructor_id', 'is', null);

      setTotalClasses(classes?.length || 0);

      // Fetch leads assigned to staff
      const { data: leads } = await supabase
        .from('leads')
        .select('assigned_to, status, created_at')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', startDate.toISOString())
        .not('assigned_to', 'is', null);

      // Fetch tours
      const { data: tours } = await supabase
        .from('facility_tours')
        .select('guide_id, status, created_at')
        .gte('created_at', startDate.toISOString())
        .not('guide_id', 'is', null);

      // Fetch sales (converted leads)
      const convertedLeads = leads?.filter(lead => lead.status === 'converted') || [];
      setTotalSales(convertedLeads.length);

      // Process staff performance
      const staffStats: { [staffId: string]: StaffPerformance } = {};

      staffMembers.forEach(staff => {
        staffStats[staff.id] = {
          id: staff.id,
          name: `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || 'Unknown',
          role: staff.role,
          classesTought: 0,
          leadsConverted: 0,
          toursGiven: 0,
          salesMade: 0,
          totalRevenue: 0,
          commission: 0
        };
      });

      // Count classes taught
      classes?.forEach(cls => {
        if (cls.instructor_id && staffStats[cls.instructor_id]) {
          staffStats[cls.instructor_id].classesTought += 1;
        }
      });

      // Count leads converted
      convertedLeads.forEach(lead => {
        if (lead.assigned_to && staffStats[lead.assigned_to]) {
          staffStats[lead.assigned_to].leadsConverted += 1;
          staffStats[lead.assigned_to].salesMade += 1;
          // Estimate revenue (placeholder calculation)
          staffStats[lead.assigned_to].totalRevenue += 500; // Average membership value
          staffStats[lead.assigned_to].commission += 50; // 10% commission
        }
      });

      // Count tours given
      tours?.forEach(tour => {
        if (tour.guide_id && staffStats[tour.guide_id]) {
          staffStats[tour.guide_id].toursGiven += 1;
        }
      });

      const performanceArray = Object.values(staffStats);
      setStaffPerformance(performanceArray);

      // Calculate average performance score (classes + sales + tours)
      const avgScore = performanceArray.length > 0
        ? performanceArray.reduce((sum, staff) => 
            sum + (staff.classesTought + staff.salesMade + staff.toursGiven), 0) / performanceArray.length
        : 0;
      setAvgPerformance(avgScore);

      // Create trend data (simplified daily aggregation)
      const dailyStats: { [date: string]: StaffTrend } = {};
      
      // Initialize all dates
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toLocaleDateString();
        dailyStats[dateStr] = {
          date: dateStr,
          totalClasses: 0,
          totalSales: 0,
          totalRevenue: 0
        };
      }

      // Fill in class data
      classes?.forEach(cls => {
        const date = new Date(cls.scheduled_at).toLocaleDateString();
        if (dailyStats[date]) {
          dailyStats[date].totalClasses += 1;
        }
      });

      // Fill in sales data
      convertedLeads.forEach(lead => {
        const date = new Date(lead.created_at).toLocaleDateString();
        if (dailyStats[date]) {
          dailyStats[date].totalSales += 1;
          dailyStats[date].totalRevenue += 500; // Average membership value
        }
      });

      const trendArray = Object.values(dailyStats).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setTrendData(trendArray);

    } catch (error: any) {
      console.error('Error fetching staff analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading staff analytics...</div>;

  return (
    <div className="space-y-6">
      {/* Staff Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalStaff}</div>
                <div className="text-sm text-muted-foreground">Total Staff</div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalClasses}</div>
                <div className="text-sm text-muted-foreground">Classes Taught</div>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalSales}</div>
                <div className="text-sm text-muted-foreground">Sales Made</div>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{avgPerformance.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Avg Performance</div>
              </div>
              <Award className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Performance Comparison</CardTitle>
          <CardDescription>
            Individual staff member performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={staffPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="classesTought" fill="#3b82f6" name="Classes Taught" />
              <Bar dataKey="salesMade" fill="#10b981" name="Sales Made" />
              <Bar dataKey="toursGiven" fill="#f59e0b" name="Tours Given" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activity Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Activity Trends</CardTitle>
          <CardDescription>
            Staff activity and performance over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="totalClasses" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Classes Taught"
              />
              <Line 
                type="monotone" 
                dataKey="totalSales" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Sales Made"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
          <CardDescription>
            Highest performing staff members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {staffPerformance
              .sort((a, b) => (b.classesTought + b.salesMade + b.toursGiven) - (a.classesTought + a.salesMade + a.toursGiven))
              .slice(0, 5)
              .map((staff, index) => {
                const totalScore = staff.classesTought + staff.salesMade + staff.toursGiven;
                return (
                  <div key={staff.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{staff.name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">{staff.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Score: {totalScore}</p>
                      <div className="text-sm text-muted-foreground">
                        {staff.classesTought}C • {staff.salesMade}S • {staff.toursGiven}T
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Revenue & Commission */}
      {staffPerformance.some(s => s.totalRevenue > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Commission</CardTitle>
            <CardDescription>
              Revenue generated and commissions earned by staff
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={staffPerformance.filter(s => s.totalRevenue > 0)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="totalRevenue" fill="#10b981" name="Revenue Generated" />
                <Bar dataKey="commission" fill="#8b5cf6" name="Commission Earned" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}