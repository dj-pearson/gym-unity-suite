import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus,
  Edit,
  Trash2,
  Copy,
  Calendar,
  Clock,
  Repeat,
  Users,
  MapPin,
  Play,
  Pause
} from 'lucide-react';

const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  class_name: z.string().min(1, 'Class name is required'),
  description: z.string().optional(),
  duration_minutes: z.number().min(15).max(300),
  max_capacity: z.number().min(1).max(100),
  instructor_id: z.string().optional(),
  category_id: z.string().optional(),
  location_id: z.string().min(1, 'Location is required'),
  recurrence_pattern: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  time: z.string().min(1, 'Time is required'),
  days_of_week: z.array(z.number()).optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  is_active: z.boolean(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

export function RecurringClassTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      duration_minutes: 60,
      max_capacity: 20,
      recurrence_pattern: 'weekly',
      is_active: true,
      days_of_week: [],
    },
  });

  useEffect(() => {
    fetchTemplates();
    fetchFormData();
  }, [profile?.organization_id]);

  const fetchTemplates = async () => {
    if (!profile?.organization_id) return;

    try {
      setIsLoading(true);
      // Note: This would require a new table 'class_templates' in the database
      // For now, we'll simulate the data structure
      setTemplates([
        {
          id: 'template-1',
          name: 'Morning Yoga Series',
          class_name: 'Sunrise Yoga',
          description: 'Start your day with energizing yoga flow',
          duration_minutes: 60,
          max_capacity: 25,
          recurrence_pattern: 'weekly',
          time: '07:00',
          days_of_week: [1, 3, 5], // Mon, Wed, Fri
          start_date: '2024-01-01',
          end_date: null,
          is_active: true,
          instructor_name: 'Sarah Johnson',
          location_name: 'Studio A',
          category_name: 'Yoga',
          generated_classes: 45,
        },
        {
          id: 'template-2', 
          name: 'Evening HIIT',
          class_name: 'High Intensity Training',
          description: 'Burn calories with this intense workout',
          duration_minutes: 45,
          max_capacity: 15,
          recurrence_pattern: 'weekly',
          time: '18:00',
          days_of_week: [2, 4], // Tue, Thu
          start_date: '2024-01-01',
          end_date: null,
          is_active: true,
          instructor_name: 'Mike Chen',
          location_name: 'Main Floor',
          category_name: 'Cardio',
          generated_classes: 32,
        }
      ]);
    } catch (error: any) {
      toast({
        title: 'Error loading templates',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFormData = async () => {
    if (!profile?.organization_id) return;

    try {
      // Fetch instructors
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
    } catch (error: any) {
      console.error('Error fetching form data:', error);
    }
  };

  const handleSubmit = async (data: TemplateFormData) => {
    try {
      const templateData = {
        ...data,
        days_of_week: selectedDays,
        organization_id: profile?.organization_id,
      };

      if (editingTemplate) {
        // Update existing template
        setTemplates(prev => prev.map(t => 
          t.id === editingTemplate.id ? { ...t, ...templateData } : t
        ));
        toast({
          title: 'Template updated',
          description: 'The class template has been updated successfully.',
        });
      } else {
        // Create new template
        const newTemplate = {
          id: `template-${Date.now()}`,
          ...templateData,
          generated_classes: 0,
          created_at: new Date().toISOString(),
        };
        setTemplates(prev => [...prev, newTemplate]);
        toast({
          title: 'Template created',
          description: 'The new class template has been created.',
        });
      }

      setIsDialogOpen(false);
      setEditingTemplate(null);
      setSelectedDays([]);
      form.reset();
    } catch (error: any) {
      toast({
        title: 'Error saving template',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setSelectedDays(template.days_of_week || []);
    form.reset({
      ...template,
      days_of_week: template.days_of_week || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (templateId: string) => {
    try {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast({
        title: 'Template deleted',
        description: 'The class template has been removed.',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting template',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (templateId: string) => {
    try {
      setTemplates(prev => prev.map(t => 
        t.id === templateId ? { ...t, is_active: !t.is_active } : t
      ));
      toast({
        title: 'Template updated',
        description: 'Template status has been changed.',
      });
    } catch (error: any) {
      toast({
        title: 'Error updating template',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const generateClasses = async (templateId: string) => {
    try {
      // In a real implementation, this would generate actual class instances
      // based on the template's recurrence pattern
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      toast({
        title: 'Generating classes',
        description: `Creating classes for the next 4 weeks based on "${template.name}" template.`,
      });

      // Simulate class generation
      setTimeout(() => {
        setTemplates(prev => prev.map(t => 
          t.id === templateId ? { ...t, generated_classes: t.generated_classes + 8 } : t
        ));
        toast({
          title: 'Classes generated',
          description: '8 new class sessions have been created.',
        });
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Error generating classes',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getDayName = (dayNumber: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayNumber];
  };

  const getRecurrenceText = (pattern: string) => {
    switch (pattern) {
      case 'daily': return 'Every day';
      case 'weekly': return 'Weekly';
      case 'biweekly': return 'Every 2 weeks';
      case 'monthly': return 'Monthly';
      default: return pattern;
    }
  };

  const handleDayToggle = (day: number) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day].sort();
    setSelectedDays(newDays);
    form.setValue('days_of_week', newDays);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-48 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Recurring Class Templates</h2>
          <p className="text-muted-foreground">
            Create templates to automatically schedule recurring classes
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingTemplate(null); setSelectedDays([]); form.reset(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="e.g., Morning Yoga Series"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="class_name">Class Name *</Label>
                  <Input
                    id="class_name"
                    {...form.register('class_name')}
                    placeholder="e.g., Sunrise Yoga"
                  />
                  {form.formState.errors.class_name && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.class_name.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="duration_minutes">Duration (min) *</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    {...form.register('duration_minutes', { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <Label htmlFor="max_capacity">Max Capacity *</Label>
                  <Input
                    id="max_capacity"
                    type="number"
                    {...form.register('max_capacity', { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    {...form.register('time')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location_id">Location *</Label>
                  <Select value={form.watch('location_id')} onValueChange={(value) => form.setValue('location_id', value)}>
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
                </div>

                <div>
                  <Label htmlFor="instructor_id">Instructor</Label>
                  <Select value={form.watch('instructor_id')} onValueChange={(value) => form.setValue('instructor_id', value)}>
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

              <div>
                <Label htmlFor="recurrence_pattern">Recurrence Pattern *</Label>
                <Select value={form.watch('recurrence_pattern')} onValueChange={(value: any) => form.setValue('recurrence_pattern', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(form.watch('recurrence_pattern') === 'weekly' || form.watch('recurrence_pattern') === 'biweekly') && (
                <div>
                  <Label>Days of Week *</Label>
                  <div className="flex gap-2 mt-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <Button
                        key={day}
                        type="button"
                        variant={selectedDays.includes(index) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleDayToggle(index)}
                        className="w-12 h-12 p-0"
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    {...form.register('start_date')}
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">End Date (optional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    {...form.register('end_date')}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={form.watch('is_active')}
                  onCheckedChange={(checked) => form.setValue('is_active', checked)}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTemplate ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    <Repeat className="w-5 h-5" />
                    {template.name}
                    {!template.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <span className="font-medium">{template.class_name}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {template.time} • {template.duration_minutes}min
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {template.max_capacity} max
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(template.id)}
                  >
                    {template.is_active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {template.description && (
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{getRecurrenceText(template.recurrence_pattern)}</span>
                  {template.days_of_week && template.days_of_week.length > 0 && (
                    <span className="text-muted-foreground">
                      ({template.days_of_week.map(getDayName).join(', ')})
                    </span>
                  )}
                </div>
                
                {template.location_name && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{template.location_name}</span>
                  </div>
                )}
                
                {template.instructor_name && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{template.instructor_name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm text-muted-foreground">
                  Generated {template.generated_classes} classes
                </div>
                
                <Button
                  size="sm"
                  onClick={() => generateClasses(template.id)}
                  disabled={!template.is_active}
                >
                  Generate Next 4 Weeks
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Repeat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Templates Created</h3>
            <p className="text-muted-foreground mb-4">
              Create your first class template to automatically schedule recurring classes.
            </p>
            <Button onClick={() => { setEditingTemplate(null); setSelectedDays([]); form.reset(); setIsDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}