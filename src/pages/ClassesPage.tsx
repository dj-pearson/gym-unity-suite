import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar,
  Plus, 
  Clock,
  Users,
  MapPin,
  User,
  MoreVertical,
  Filter,
  Search,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import ClassScheduleForm from '@/components/classes/ClassScheduleForm';
import MemberBookingDialog from '@/components/classes/MemberBookingDialog';
import CategoryManager from '@/components/classes/CategoryManager';
import ClassCalendarView from '@/components/classes/ClassCalendarView';
import WaitlistManager from '@/components/classes/WaitlistManager';
import { RecurringClassTemplates } from '@/components/classes/RecurringClassTemplates';
import ImportButton from '@/components/imports/ImportButton';

interface Class {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  max_capacity: number;
  scheduled_at: string;
  created_at: string;
  category: {
    name: string;
    color: string;
  } | null;
  instructor: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
    avatar_url?: string;
  } | null;
  location: {
    name: string;
  };
  bookings: Array<{
    id: string;
    status: string;
    member_id: string;
    member: {
      first_name?: string;
      last_name?: string;
      email: string;
    };
  }>;
  waitlist?: Array<{
    id: string;
    member_id: string;
    status: string;
    priority_order: number;
  }>;
}

export default function ClassesPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'upcoming' | 'all'>('upcoming');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showWaitlistManager, setShowWaitlistManager] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    fetchClasses();
  }, [profile?.organization_id, viewMode]);

  const fetchClasses = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('classes')
        .select(`
          id,
          name,
          description,
          duration_minutes,
          max_capacity,
          scheduled_at,
          created_at,
          class_categories (
            name,
            color
          ),
          profiles!classes_instructor_id_fkey (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          ),
          locations (
            name
          ),
          class_bookings (
            id,
            status,
            member_id,
            profiles!class_bookings_member_id_fkey (
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('organization_id', profile.organization_id)
        .order('scheduled_at', { ascending: true });

      if (viewMode === 'upcoming') {
        query = query.gte('scheduled_at', new Date().toISOString());
      }

      const { data: classesData, error } = await query;

      if (error) {
        toast({
          title: "Error fetching classes",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Fetch waitlist data separately
      const { data: waitlistData } = await supabase
        .from('class_waitlists')
        .select('class_id, id, member_id, status, priority_order')
        .eq('status', 'waiting');

      // Transform the data to match our interface
      const transformedClasses = classesData.map(classItem => ({
        ...classItem,
        category: classItem.class_categories,
        instructor: classItem.profiles,
        location: classItem.locations,
        bookings: classItem.class_bookings?.map(booking => ({
          ...booking,
          member: booking.profiles
        })) || [],
        waitlist: waitlistData?.filter(w => w.class_id === classItem.id) || []
      }));

      setClasses(transformedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch classes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClassClick = (classItem: Class) => {
    if (profile?.role === 'member') {
      setSelectedClass(classItem);
      setShowBookingDialog(true);
    }
  };

  const canScheduleClasses = profile?.role && ['owner', 'manager', 'staff'].includes(profile.role);

  const filteredClasses = classes.filter(classItem =>
    `${classItem.name} ${classItem.instructor?.first_name} ${classItem.instructor?.last_name} ${classItem.category?.name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const getInstructorName = (instructor: Class['instructor']) => {
    if (!instructor) return 'No Instructor';
    if (instructor.first_name && instructor.last_name) {
      return `${instructor.first_name} ${instructor.last_name}`;
    }
    return instructor.email;
  };

  const getInstructorInitials = (instructor: Class['instructor']) => {
    if (!instructor) return 'NI';
    if (instructor.first_name && instructor.last_name) {
      return `${instructor.first_name[0]}${instructor.last_name[0]}`.toUpperCase();
    }
    return instructor.email[0].toUpperCase();
  };

  const formatClassTime = (scheduledAt: string) => {
    const date = new Date(scheduledAt);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateStr = '';
    if (date.toDateString() === today.toDateString()) {
      dateStr = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dateStr = 'Tomorrow';
    } else {
      dateStr = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return `${dateStr} at ${timeStr}`;
  };

  const getClassStatus = (classItem: Class) => {
    const now = new Date();
    const classTime = new Date(classItem.scheduled_at);
    const endTime = new Date(classTime.getTime() + classItem.duration_minutes * 60000);
    
    if (now > endTime) {
      return { label: 'Completed', variant: 'secondary' as const };
    } else if (now >= classTime && now <= endTime) {
      return { label: 'In Progress', variant: 'default' as const };
    } else {
      return { label: 'Scheduled', variant: 'outline' as const };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Classes</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading classes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gradient-secondary rounded-lg">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Classes</h1>
            <p className="text-muted-foreground">
              Manage class schedules and track attendance
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {canScheduleClasses && (
            <>
              <ImportButton module="classes" onImportComplete={fetchClasses} />
              <Button
                className="bg-gradient-secondary hover:opacity-90"
                onClick={() => setShowScheduleForm(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Schedule Class
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCategoryManager(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Categories
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowWaitlistManager(true)}
              >
                <Users className="mr-2 h-4 w-4" />
                Waitlists
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">
              {classes.filter(c => new Date(c.scheduled_at) >= new Date()).length}
            </div>
            <div className="text-sm text-muted-foreground">Upcoming Classes</div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {classes.reduce((sum, c) => sum + c.bookings.filter(b => b.status === 'booked').length, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Bookings</div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">
              {classes.reduce((sum, c) => sum + (c.waitlist?.length || 0), 0)}
            </div>
            <div className="text-sm text-muted-foreground">Waitlist Members</div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">
              {Math.round(classes.reduce((sum, c) => sum + (c.bookings.length / c.max_capacity), 0) / classes.length * 100) || 0}%
            </div>
            <div className="text-sm text-muted-foreground">Avg Capacity</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* View Toggle and Search */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'upcoming' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('upcoming')}
              >
                Upcoming
              </Button>
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('all')}
              >
                All Classes
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search classes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>

          {/* Classes Grid */}
          {filteredClasses.length === 0 ? (
            <Card className="gym-card">
              <CardContent className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchTerm ? 'No classes found' : 'No classes scheduled'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Start by scheduling your first class'
                  }
                </p>
                {!searchTerm && canScheduleClasses && (
                  <Button 
                    className="bg-gradient-secondary hover:opacity-90"
                    onClick={() => setShowScheduleForm(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule First Class
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((classItem) => {
                const status = getClassStatus(classItem);
                const bookedCount = classItem.bookings.filter(b => b.status === 'booked').length;
                const waitlistCount = classItem.waitlist?.length || 0;
                const capacityPercentage = (bookedCount / classItem.max_capacity) * 100;
                const isClassFull = bookedCount >= classItem.max_capacity;

                return (
                  <Card 
                    key={classItem.id} 
                    className="gym-card hover:shadow-elevation-2 cursor-pointer"
                    onClick={() => handleClassClick(classItem)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-foreground">{classItem.name}</h3>
                            <Badge variant={status.variant} className="text-xs">
                              {status.label}
                            </Badge>
                          </div>
                          {classItem.category && (
                            <Badge 
                              variant="outline" 
                              className="text-xs mb-2"
                              style={{ 
                                borderColor: classItem.category.color,
                                color: classItem.category.color 
                              }}
                            >
                              {classItem.category.name}
                            </Badge>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Time and Location */}
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="mr-2 h-4 w-4" />
                          <span>{formatClassTime(classItem.scheduled_at)}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="mr-2 h-4 w-4" />
                          <span>{classItem.location.name}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="mr-2 h-4 w-4" />
                          <span>{classItem.duration_minutes} minutes</span>
                        </div>
                      </div>

                      {/* Instructor */}
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={classItem.instructor?.avatar_url} />
                          <AvatarFallback className="bg-gradient-primary text-white text-xs">
                            {getInstructorInitials(classItem.instructor)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center text-sm">
                            <User className="mr-1 h-3 w-3 text-muted-foreground" />
                            <span className="font-medium text-foreground truncate">
                              {getInstructorName(classItem.instructor)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Capacity */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center">
                            <Users className="mr-1 h-4 w-4" />
                            Capacity
                          </span>
                          <span className="font-medium">
                            {bookedCount}/{classItem.max_capacity}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className={`${
                            capacityPercentage >= 100 
                              ? 'text-destructive font-medium' 
                              : capacityPercentage >= 80 
                              ? 'text-warning' 
                              : 'text-muted-foreground'
                          }`}>
                            {capacityPercentage.toFixed(0)}% full
                          </span>
                          {waitlistCount > 0 && (
                            <span className="text-warning text-xs font-medium">
                              +{waitlistCount} waitlist
                            </span>
                          )}
                        </div>
                        
                        {/* Show waitlist indicator if class is full and has waitlist */}
                        {isClassFull && waitlistCount > 0 && (
                          <div className="mt-2 px-2 py-1 bg-warning/10 rounded-md">
                            <div className="text-xs text-warning font-medium text-center">
                              {waitlistCount} on waitlist
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {classItem.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {classItem.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <ClassCalendarView 
            onClassClick={handleClassClick}
            onScheduleClick={() => setShowScheduleForm(true)}
          />
        </TabsContent>
        
        <TabsContent value="templates">
          <RecurringClassTemplates />
        </TabsContent>
      </Tabs>

      {/* Schedule Form Dialog */}
      <Dialog open={showScheduleForm} onOpenChange={setShowScheduleForm}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <ClassScheduleForm
            onSuccess={() => {
              setShowScheduleForm(false);
              fetchClasses();
            }}
            onCancel={() => setShowScheduleForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Member Booking Dialog */}
      {selectedClass && (
        <MemberBookingDialog
          isOpen={showBookingDialog}
          onClose={() => {
            setShowBookingDialog(false);
            setSelectedClass(null);
          }}
          classData={selectedClass}
          onBookingChange={() => {
            fetchClasses();
            setShowBookingDialog(false);
            setSelectedClass(null);
          }}
        />
      )}

      {/* Category Manager Dialog */}
      {showCategoryManager && (
        <CategoryManager 
          isOpen={showCategoryManager}
          onClose={() => setShowCategoryManager(false)}
        />
      )}

      {/* Waitlist Manager Dialog */}
      {showWaitlistManager && (
        <WaitlistManager 
          isOpen={showWaitlistManager}
          onClose={() => setShowWaitlistManager(false)}
        />
      )}
    </div>
  );
}