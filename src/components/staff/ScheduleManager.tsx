import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Plus, Users, Calendar as CalendarIcon, Edit, Trash2, MapPin, AlertCircle } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';

interface StaffSchedule {
  id: string;
  staff_id: string;
  date: string;
  start_time: string;
  end_time: string;
  location_id?: string;
  shift_type: string;
  status: string;
  notes?: string;
  staff: {
    first_name: string;
    last_name: string;
    role: string;
  };
  location?: {
    name: string;
  };
}

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface Location {
  id: string;
  name: string;
}

const SHIFT_TYPES = [
  { value: 'opening', label: 'Opening Shift' },
  { value: 'midday', label: 'Mid-day Shift' },
  { value: 'closing', label: 'Closing Shift' },
  { value: 'training', label: 'Training Session' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'event', label: 'Special Event' }
];

export default function ScheduleManager() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<StaffSchedule | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newShift, setNewShift] = useState({
    staff_id: '',
    date: new Date(),
    start_time: '09:00',
    end_time: '17:00',
    location_id: '',
    shift_type: 'midday',
    notes: ''
  });

  useEffect(() => {
    fetchScheduleData();
  }, [selectedWeek]);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      const weekStart = startOfWeek(selectedWeek);
      const weekEnd = endOfWeek(selectedWeek);

      // For demo purposes, using mock data since staff_schedules table doesn't exist yet
      setSchedules([]);

      // Fetch staff members
      const { data: staffData, error: staffError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .eq('organization_id', user?.user_metadata?.organization_id)
        .in('role', ['staff', 'manager']);

      if (staffError) throw staffError;
      setStaffMembers(staffData || []);

      // Fetch locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name')
        .eq('organization_id', user?.user_metadata?.organization_id);

      if (locationsError) throw locationsError;
      setLocations(locationsData || []);

    } catch (error) {
      console.error('Error fetching schedule data:', error);
      toast({
        title: "Error",
        description: "Failed to load schedule data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createShift = async () => {
    // This would create a shift in the database when the staff_schedules table is created
    toast({
      title: "Feature Coming Soon",
      description: "Staff scheduling database table needs to be created first",
    });
    setIsCreateShiftOpen(false);
  };

  const deleteShift = async (scheduleId: string) => {
    toast({
      title: "Feature Coming Soon",
      description: "Staff scheduling database table needs to be created first",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      scheduled: "outline",
      confirmed: "default",
      completed: "secondary",
      cancelled: "destructive"
    };
    
    return <Badge variant={variants[status] || "outline"}>{status.toUpperCase()}</Badge>;
  };

  const calculateShiftHours = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    return diffMs / (1000 * 60 * 60);
  };

  const getWeekDays = () => {
    const weekStart = startOfWeek(selectedWeek);
    const weekEnd = endOfWeek(selectedWeek);
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  };

  const getSchedulesForDay = (date: Date) => {
    return schedules.filter(schedule => 
      isSameDay(parseISO(schedule.date), date)
    );
  };

  const getTotalHoursForWeek = () => {
    return schedules.reduce((total, schedule) => {
      return total + calculateShiftHours(schedule.start_time, schedule.end_time);
    }, 0);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="gym-card">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading schedule data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="gym-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold">{staffMembers.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{schedules.length}</p>
                <p className="text-xs text-muted-foreground">shifts</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{getTotalHoursForWeek().toFixed(1)}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Locations</p>
                <p className="text-2xl font-bold">{locations.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Schedule View */}
      <Card className="gym-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Staff Schedule</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedWeek, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar
                    mode="single"
                    selected={selectedWeek}
                    onSelect={(date) => date && setSelectedWeek(date)}
                  />
                </PopoverContent>
              </Popover>
              <Dialog open={isCreateShiftOpen} onOpenChange={setIsCreateShiftOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Shift
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule New Shift</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Staff Member</Label>
                      <Select 
                        value={newShift.staff_id} 
                        onValueChange={(value) => setNewShift({...newShift, staff_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                        <SelectContent>
                          {staffMembers.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id}>
                              {staff.first_name} {staff.last_name} - {staff.role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(newShift.date, 'MMM dd, yyyy')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <Calendar
                            mode="single"
                            selected={newShift.date}
                            onSelect={(date) => date && setNewShift({...newShift, date})}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={newShift.start_time}
                          onChange={(e) => setNewShift({...newShift, start_time: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={newShift.end_time}
                          onChange={(e) => setNewShift({...newShift, end_time: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Shift Type</Label>
                      <Select 
                        value={newShift.shift_type} 
                        onValueChange={(value) => setNewShift({...newShift, shift_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SHIFT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Location</Label>
                      <Select 
                        value={newShift.location_id} 
                        onValueChange={(value) => setNewShift({...newShift, location_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={createShift} className="w-full">
                      Schedule Shift
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="week" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="week">Week View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>

            <TabsContent value="week" className="space-y-4">
              <div className="grid grid-cols-7 gap-4">
                {getWeekDays().map((day, index) => {
                  const daySchedules = getSchedulesForDay(day);
                  return (
                    <div key={index} className="border rounded-lg p-3 min-h-[200px]">
                      <div className="text-center mb-3">
                        <p className="font-medium text-sm">
                          {format(day, 'EEE')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(day, 'MMM dd')}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {daySchedules.map((schedule) => (
                          <div 
                            key={schedule.id}
                            className="bg-primary/10 rounded p-2 text-xs cursor-pointer hover:bg-primary/20"
                            onClick={() => setSelectedSchedule(schedule)}
                          >
                            <p className="font-medium">
                              {schedule.staff.first_name} {schedule.staff.last_name}
                            </p>
                            <p className="text-muted-foreground">
                              {schedule.start_time} - {schedule.end_time}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {schedule.shift_type}
                            </Badge>
                          </div>
                        ))}
                        {daySchedules.length === 0 && (
                          <p className="text-center text-muted-foreground text-xs mt-8">
                            No shifts
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Staff Scheduling Ready</h3>
                <p className="text-muted-foreground mb-4">
                  The staff scheduling interface is ready. Database table creation needed to store schedules.
                </p>
                <Button onClick={() => setIsCreateShiftOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Try Scheduling Interface
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}