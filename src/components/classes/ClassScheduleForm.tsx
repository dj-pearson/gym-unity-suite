import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const classSchema = z.object({
  name: z.string().min(2, 'Class name must be at least 2 characters'),
  description: z.string().optional(),
  duration_minutes: z.coerce.number().min(15).max(300),
  max_capacity: z.coerce.number().min(1).max(100),
  instructor_id: z.string().optional(),
  category_id: z.string().optional(),
  location_id: z.string().min(1, 'Location is required'),
  date: z.date({ required_error: 'Date is required' }),
  time: z.string().min(1, 'Time is required'),
});

type ClassFormData = z.infer<typeof classSchema>;

interface ClassScheduleFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<ClassFormData>;
}

export default function ClassScheduleForm({ onSuccess, onCancel, initialData }: ClassScheduleFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [instructors, setInstructors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      duration_minutes: initialData?.duration_minutes || 60,
      max_capacity: initialData?.max_capacity || 20,
      instructor_id: initialData?.instructor_id || '',
      category_id: initialData?.category_id || '',
      location_id: initialData?.location_id || '',
      date: initialData?.date || undefined,
      time: initialData?.time || '09:00',
    },
  });

  useEffect(() => {
    fetchFormData();
  }, [profile?.organization_id]);

  const fetchFormData = async () => {
    if (!profile?.organization_id) return;

    try {
      // Fetch instructors (trainers and staff)
      const { data: instructorData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('organization_id', profile.organization_id)
        .in('role', ['trainer', 'staff', 'manager', 'owner']);

      // Fetch categories
      const { data: categoryData } = await supabase
        .from('class_categories')
        .select('id, name, color')
        .eq('organization_id', profile.organization_id)
        .order('name');

      // Fetch locations
      const { data: locationData } = await supabase
        .from('locations')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .order('name');

      setInstructors(instructorData || []);
      setCategories(categoryData || []);
      setLocations(locationData || []);
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  const onSubmit = async (data: ClassFormData) => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);

      // Combine date and time
      const scheduledAt = new Date(data.date);
      const [hours, minutes] = data.time.split(':').map(Number);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const classData = {
        name: data.name,
        description: data.description || null,
        duration_minutes: data.duration_minutes,
        max_capacity: data.max_capacity,
        instructor_id: data.instructor_id || null,
        category_id: data.category_id || null,
        location_id: data.location_id,
        organization_id: profile.organization_id,
        scheduled_at: scheduledAt.toISOString(),
      };

      const { error } = await supabase
        .from('classes')
        .insert(classData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Class scheduled successfully",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule class",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Schedule New Class</h2>
        <p className="text-muted-foreground">Create a new class schedule for members to book</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Class Name</Label>
            <Input
              id="name"
              placeholder="e.g., Morning Yoga"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_id">Location</Label>
            <Select
              value={form.watch('location_id')}
              onValueChange={(value) => form.setValue('location_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.location_id && (
              <p className="text-sm text-destructive">{form.formState.errors.location_id.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Class description..."
            {...form.register('description')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration_minutes">Duration (minutes)</Label>
            <Input
              id="duration_minutes"
              type="number"
              min="15"
              max="300"
              {...form.register('duration_minutes')}
            />
            {form.formState.errors.duration_minutes && (
              <p className="text-sm text-destructive">{form.formState.errors.duration_minutes.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_capacity">Max Capacity</Label>
            <Input
              id="max_capacity"
              type="number"
              min="1"
              max="100"
              {...form.register('max_capacity')}
            />
            {form.formState.errors.max_capacity && (
              <p className="text-sm text-destructive">{form.formState.errors.max_capacity.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              {...form.register('time')}
            />
            {form.formState.errors.time && (
              <p className="text-sm text-destructive">{form.formState.errors.time.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.watch('date') && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch('date') ? format(form.watch('date'), 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.watch('date')}
                  onSelect={(date) => form.setValue('date', date as Date)}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.date && (
              <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructor_id">Instructor (Optional)</Label>
            <Select
              value={form.watch('instructor_id')}
              onValueChange={(value) => form.setValue('instructor_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select instructor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No instructor assigned</SelectItem>
                {instructors.map((instructor) => (
                  <SelectItem key={instructor.id} value={instructor.id}>
                    {instructor.first_name && instructor.last_name
                      ? `${instructor.first_name} ${instructor.last_name}`
                      : instructor.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category_id">Category (Optional)</Label>
          <Select
            value={form.watch('category_id')}
            onValueChange={(value) => form.setValue('category_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No category</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span>{category.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-gradient-secondary hover:opacity-90">
            {loading ? 'Scheduling...' : 'Schedule Class'}
          </Button>
        </div>
      </form>
    </div>
  );
}