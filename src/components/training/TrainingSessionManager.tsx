import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Search, Filter, Download, BarChart3, TrendingUp, Users, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface TrainingSession {
  id: string;
  trainer_id: string;
  member_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  session_type: string;
  status: string;
  price: number;
  notes?: string;
  trainer_name?: string;
  member_name?: string;
  created_at: string;
}

interface SessionStats {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  noShowSessions: number;
  totalRevenue: number;
  averageSessionPrice: number;
  utilizationRate: number;
}

export default function TrainingSessionManager() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<TrainingSession[]>([]);
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    completedSessions: 0,
    cancelledSessions: 0,
    noShowSessions: 0,
    totalRevenue: 0,
    averageSessionPrice: 0,
    utilizationRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchSessions();
  }, [dateRange]);

  useEffect(() => {
    filterSessions();
  }, [sessions, searchTerm, statusFilter]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data: sessionsData, error } = await supabase
        .from('personal_training_sessions')
        .select('*')
        .gte('session_date', dateRange.start)
        .lte('session_date', dateRange.end)
        .order('session_date', { ascending: false })
        .order('start_time', { ascending: false });

      if (error) throw error;

      // Fetch trainer and member names separately
      const sessions = sessionsData || [];
      const trainerIds = [...new Set(sessions.map(s => s.trainer_id).filter(Boolean))];
      const memberIds = [...new Set(sessions.map(s => s.member_id).filter(Boolean))];
      
      const { data: trainers } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', trainerIds);
        
      const { data: members } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', memberIds);

      const trainerMap = new Map((trainers || []).map(t => [t.id, t]));
      const memberMap = new Map((members || []).map(m => [m.id, m]));

      const formattedSessions = sessions.map(session => {
        const trainer = trainerMap.get(session.trainer_id);
        const member = memberMap.get(session.member_id);
        
        return {
          ...session,
          trainer_name: trainer ? `${trainer.first_name} ${trainer.last_name}` : 'Unknown Trainer',
          member_name: member ? `${member.first_name} ${member.last_name}` : 'Unknown Member'
        };
      });

      setSessions(formattedSessions);
      calculateStats(formattedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load training sessions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSessions = () => {
    let filtered = sessions;

    if (searchTerm) {
      filtered = filtered.filter(session => 
        session.trainer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.member_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.session_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }

    setFilteredSessions(filtered);
  };

  const calculateStats = (sessionData: TrainingSession[]) => {
    const totalSessions = sessionData.length;
    const completedSessions = sessionData.filter(s => s.status === 'completed').length;
    const cancelledSessions = sessionData.filter(s => s.status === 'cancelled').length;
    const noShowSessions = sessionData.filter(s => s.status === 'no_show').length;
    const totalRevenue = sessionData.reduce((sum, session) => sum + session.price, 0);
    const averageSessionPrice = totalSessions > 0 ? totalRevenue / totalSessions : 0;
    const utilizationRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    setStats({
      totalSessions,
      completedSessions,
      cancelledSessions,
      noShowSessions,
      totalRevenue,
      averageSessionPrice,
      utilizationRate
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      scheduled: { variant: 'default', label: 'Scheduled' },
      completed: { variant: 'secondary', label: 'Completed' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
      no_show: { variant: 'outline', label: 'No Show' }
    };

    const config = variants[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Trainer', 'Member', 'Type', 'Duration', 'Status', 'Price', 'Notes'];
    const csvData = [
      headers.join(','),
      ...filteredSessions.map(session => [
        session.session_date,
        session.start_time,
        session.trainer_name,
        session.member_name,
        session.session_type,
        `${session.duration_minutes} min`,
        session.status,
        `$${session.price.toFixed(2)}`,
        `"${session.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-sessions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Training sessions exported to CSV successfully"
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Session Management</h2>
          <p className="text-muted-foreground">
            Manage and analyze personal training sessions
          </p>
        </div>
        
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="start_date">From:</Label>
              <Input
                id="start_date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="end_date">To:</Label>
              <Input
                id="end_date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-auto"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
              </div>
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilization Rate</p>
                <p className="text-2xl font-bold">{stats.utilizationRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Session Price</p>
                <p className="text-2xl font-bold">${stats.averageSessionPrice.toFixed(2)}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">All Sessions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sessions Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Trainer</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {format(new Date(session.session_date), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {session.start_time} - {session.end_time}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{session.trainer_name}</TableCell>
                      <TableCell>{session.member_name}</TableCell>
                      <TableCell className="capitalize">
                        {session.session_type.replace('_', ' ')}
                      </TableCell>
                      <TableCell>{session.duration_minutes} min</TableCell>
                      <TableCell>{getStatusBadge(session.status)}</TableCell>
                      <TableCell>${session.price.toFixed(2)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {session.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Session Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Completed</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${(stats.completedSessions / stats.totalSessions) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {stats.completedSessions} ({((stats.completedSessions / stats.totalSessions) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Cancelled</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 transition-all"
                        style={{ width: `${(stats.cancelledSessions / stats.totalSessions) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {stats.cancelledSessions} ({((stats.cancelledSessions / stats.totalSessions) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>No Shows</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 transition-all"
                        style={{ width: `${(stats.noShowSessions / stats.totalSessions) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {stats.noShowSessions} ({((stats.noShowSessions / stats.totalSessions) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Revenue</span>
                  <span className="font-semibold">${stats.totalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Session</span>
                  <span className="font-semibold">${stats.averageSessionPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed Revenue</span>
                  <span className="font-semibold">
                    ${(stats.completedSessions * stats.averageSessionPrice).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}