import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Calendar, Users, TrendingUp, Target } from 'lucide-react';

interface ClassAnalyticsProps {
  timeRange: string;
}

interface ClassData {
  className: string;
  bookings: number;
  attendance: number;
  capacity: number;
  utilization: number;
  revenue: number;
}

interface ClassTrendData {
  date: string;
  totalClasses: number;
  totalBookings: number;
  averageUtilization: number;
}

export default function ClassAnalytics({ timeRange }: ClassAnalyticsProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<ClassData[]>([]);
  const [trendData, setTrendData] = useState<ClassTrendData[]>([]);
  const [totalClasses, setTotalClasses] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [avgUtilization, setAvgUtilization] = useState(0);
  const [topClasses, setTopClasses] = useState<ClassData[]>([]);

  useEffect(() => {
    fetchClassAnalytics();
  }, [profile?.organization_id, timeRange]);

  const fetchClassAnalytics = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      // Fetch classes with bookings
      const { data: classes } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          max_capacity,
          scheduled_at,
          bookings:class_bookings(
            id,
            status,
            attended_at
          )
        `)
        .eq('organization_id', profile.organization_id)
        .gte('scheduled_at', startDate.toISOString())
        .order('scheduled_at');

      if (!classes) return;

      setTotalClasses(classes.length);

      // Process class data
      const classStats: { [className: string]: ClassData } = {};
      const dailyStats: { [date: string]: ClassTrendData } = {};

      classes.forEach(cls => {
        const bookings = cls.bookings || [];
        const totalBookings = bookings.length;
        const attendance = bookings.filter(b => b.attended_at).length;
        const utilization = cls.max_capacity > 0 ? (totalBookings / cls.max_capacity) * 100 : 0;
        
        // Aggregate by class name
        if (!classStats[cls.name]) {
          classStats[cls.name] = {
            className: cls.name,
            bookings: 0,
            attendance: 0,
            capacity: 0,
            utilization: 0,
            revenue: 0
          };
        }
        
        classStats[cls.name].bookings += totalBookings;
        classStats[cls.name].attendance += attendance;
        classStats[cls.name].capacity += cls.max_capacity;
        
        // Daily trend data
        const date = new Date(cls.scheduled_at).toLocaleDateString();
        if (!dailyStats[date]) {
          dailyStats[date] = {
            date,
            totalClasses: 0,
            totalBookings: 0,
            averageUtilization: 0
          };
        }
        
        dailyStats[date].totalClasses += 1;
        dailyStats[date].totalBookings += totalBookings;
      });

      // Calculate utilization rates
      Object.values(classStats).forEach(stat => {
        stat.utilization = stat.capacity > 0 ? (stat.bookings / stat.capacity) * 100 : 0;
      });

      // Calculate average utilization for daily data
      Object.values(dailyStats).forEach(stat => {
        const classesOnDay = classes.filter(cls => 
          new Date(cls.scheduled_at).toLocaleDateString() === stat.date
        );
        const totalCapacity = classesOnDay.reduce((sum, cls) => sum + cls.max_capacity, 0);
        stat.averageUtilization = totalCapacity > 0 ? (stat.totalBookings / totalCapacity) * 100 : 0;
      });

      const classArray = Object.values(classStats);
      setClassData(classArray);
      
      const trendArray = Object.values(dailyStats).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setTrendData(trendArray);

      // Calculate totals
      const totalBookingsCount = classArray.reduce((sum, cls) => sum + cls.bookings, 0);
      setTotalBookings(totalBookingsCount);

      const totalCapacity = classArray.reduce((sum, cls) => sum + cls.capacity, 0);
      setAvgUtilization(totalCapacity > 0 ? (totalBookingsCount / totalCapacity) * 100 : 0);

      // Top classes by bookings
      setTopClasses(classArray.sort((a, b) => b.bookings - a.bookings).slice(0, 5));

    } catch (error: any) {
      console.error('Error fetching class analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading class analytics...</div>;

  return (
    <div className="space-y-6">
      {/* Class Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalClasses}</div>
                <div className="text-sm text-muted-foreground">Total Classes</div>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalBookings}</div>
                <div className="text-sm text-muted-foreground">Total Bookings</div>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{avgUtilization.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Avg Utilization</div>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {totalClasses > 0 ? (totalBookings / totalClasses).toFixed(1) : '0'}
                </div>
                <div className="text-sm text-muted-foreground">Avg Bookings/Class</div>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Class Performance</CardTitle>
          <CardDescription>
            Bookings and utilization rates by class type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="className" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="bookings" fill="#3b82f6" name="Bookings" />
              <Bar dataKey="attendance" fill="#10b981" name="Attendance" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Class Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Class Trends</CardTitle>
          <CardDescription>
            Class bookings and utilization over time
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
                dataKey="totalBookings" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Total Bookings"
              />
              <Line 
                type="monotone" 
                dataKey="averageUtilization" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Avg Utilization %"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Classes */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Classes</CardTitle>
          <CardDescription>
            Most popular classes by booking volume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topClasses.map((cls, index) => (
              <div key={cls.className} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium">{cls.className}</h4>
                    <p className="text-sm text-muted-foreground">
                      {cls.attendance} attended / {cls.bookings} booked
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{cls.utilization.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Utilization</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}