import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar,
  Clock, 
  Users, 
  MapPin,
  Plus,
  Minus,
  Star,
  Filter,
  Search
} from 'lucide-react';
import { format, isToday, isTomorrow, startOfDay, addDays } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Class {
  id: string;
  name: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  max_capacity: number;
  instructor_id?: string;
  category_id?: string;
  location: {
    name: string;
  };
  class_categories?: {
    name: string;
    color: string;
  };
  profiles?: {
    first_name: string;
    last_name: string;
  };
  bookings: { id: string }[];
  user_booking?: { id: string; status: string }[];
}

interface ClassCategory {
  id: string;
  name: string;
  color: string;
}

export default function MobileClassBooking() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [categories, setCategories] = useState<ClassCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchData();
    }
  }, [profile, selectedDate]);

  const fetchData = async () => {
    try {
      const startDate = startOfDay(selectedDate);
      const endDate = startOfDay(addDays(selectedDate, 1));

      // Fetch classes for selected date
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          description,
          scheduled_at,
          duration_minutes,
          max_capacity,
          instructor_id,
          category_id,
          locations:location_id (name),
          class_categories:category_id (name, color),
          profiles:instructor_id (first_name, last_name),
          bookings:class_bookings (id),
          user_booking:class_bookings!inner (id, status)
        `)
        .eq('organization_id', profile?.organization_id)
        .gte('scheduled_at', startDate.toISOString())
        .lt('scheduled_at', endDate.toISOString())
        .eq('user_booking.member_id', profile?.id)
        .order('scheduled_at');

      if (classesError) throw classesError;

      // Fetch categories for filter
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('class_categories')
        .select('id, name, color')
        .eq('organization_id', profile?.organization_id)
        .order('name');

      if (categoriesError) throw categoriesError;

      setClasses((classesData || []).map(classItem => ({
        ...classItem,
        location: classItem.locations || { name: 'Unknown Location' }
      })));
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch classes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookClass = async (classId: string) => {
    if (!profile?.id) return;

    setBookingLoading(classId);
    try {
      const { error } = await supabase
        .from('class_bookings')
        .insert([{
          class_id: classId,
          member_id: profile.id,
          status: 'booked'
        }]);

      if (error) throw error;

      toast({
        title: "Class Booked!",
        description: "You've successfully booked this class."
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Unable to book class. Please try again.",
        variant: "destructive"
      });
    } finally {
      setBookingLoading(null);
    }
  };

  const handleCancelBooking = async (classId: string) => {
    if (!profile?.id) return;

    setBookingLoading(classId);
    try {
      const { error } = await supabase
        .from('class_bookings')
        .delete()
        .eq('class_id', classId)
        .eq('member_id', profile.id);

      if (error) throw error;

      toast({
        title: "Booking Cancelled",
        description: "Your class booking has been cancelled."
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Unable to cancel booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setBookingLoading(null);
    }
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const getAvailableSpots = (classItem: Class) => {
    return classItem.max_capacity - classItem.bookings.length;
  };

  const isClassFull = (classItem: Class) => {
    return getAvailableSpots(classItem) <= 0;
  };

  const isUserBooked = (classItem: Class) => {
    return classItem.user_booking && classItem.user_booking.length > 0;
  };

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || classItem.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 max-w-md mx-auto">
      {/* Date Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Select Date</h3>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[0, 1, 2, 3, 4, 5, 6].map((days) => {
              const date = addDays(new Date(), days);
              const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              
              return (
                <Button
                  key={days}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => setSelectedDate(date)}
                >
                  <div className="text-center">
                    <div className="text-xs">{format(date, 'EEE')}</div>
                    <div className="font-semibold">{getDateLabel(date)}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-32">
            <Filter className="w-4 h-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Classes List */}
      <ScrollArea className="h-[60vh]">
        <div className="space-y-3">
          {filteredClasses.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No Classes Found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filter.' 
                    : `No classes scheduled for ${getDateLabel(selectedDate)}.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredClasses.map((classItem) => (
              <Card key={classItem.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base mb-1">{classItem.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>
                          {format(new Date(classItem.scheduled_at), 'h:mm a')} 
                          • {classItem.duration_minutes}min
                        </span>
                      </div>
                    </div>
                    {classItem.class_categories && (
                      <Badge 
                        variant="secondary" 
                        style={{ backgroundColor: `${classItem.class_categories.color}20` }}
                      >
                        {classItem.class_categories.name}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-3">
                  {classItem.description && (
                    <p className="text-sm text-muted-foreground">{classItem.description}</p>
                  )}
                  
                  <div className="space-y-2">
                    {classItem.profiles && (
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="w-3 h-3 text-muted-foreground" />
                        <span>
                          {classItem.profiles.first_name} {classItem.profiles.last_name}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span>{(classItem.location as any)?.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span>
                        {classItem.bookings.length}/{classItem.max_capacity} booked
                        {getAvailableSpots(classItem) > 0 && (
                          <span className="text-green-600 ml-1">
                            • {getAvailableSpots(classItem)} spots left
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    {isUserBooked(classItem) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleCancelBooking(classItem.id)}
                        disabled={bookingLoading === classItem.id}
                      >
                        <Minus className="w-4 h-4 mr-1" />
                        Cancel Booking
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleBookClass(classItem.id)}
                        disabled={isClassFull(classItem) || bookingLoading === classItem.id}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {isClassFull(classItem) ? 'Class Full' : 'Book Class'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}