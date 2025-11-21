import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, Clock, MapPin, User, Edit, Trash2 } from 'lucide-react';
import { getStatusBadgeVariant } from '@/lib/colorUtils';

interface FacilityTour {
  id: string;
  lead_id: string;
  scheduled_date: string;
  scheduled_time: string;
  tour_type: string;
  guide_id?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  outcome?: string;
  notes?: string;
  follow_up_date?: string;
  created_at: string;
  lead?: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
  guide?: {
    first_name?: string;
    last_name?: string;
  };
}

interface TourFormData {
  lead_id: string;
  scheduled_date: string;
  scheduled_time: string;
  tour_type: string;
  guide_id: string;
  notes: string;
}

export default function ToursSchedulingManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [tours, setTours] = useState<FacilityTour[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<FacilityTour | null>(null);
  const [formData, setFormData] = useState<TourFormData>({
    lead_id: '',
    scheduled_date: '',
    scheduled_time: '',
    tour_type: 'general',
    guide_id: '',
    notes: ''
  });

  useEffect(() => {
    fetchTours();
    fetchLeads();
    fetchStaff();
  }, [profile?.organization_id]);

  const fetchTours = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('facility_tours')
        .select(`
          *,
          lead:leads!inner(first_name, last_name, email, organization_id),
          guide:profiles(first_name, last_name)
        `)
        .eq('lead.organization_id', profile.organization_id)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setTours(data as any[] || []);
    } catch (error: any) {
      console.error('Error fetching tours:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, email')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'lead')
        .order('first_name');

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      console.error('Error fetching leads:', error);
    }
  };

  const fetchStaff = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('organization_id', profile.organization_id)
        .in('role', ['owner', 'manager', 'staff', 'trainer'])
        .order('first_name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error: any) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const tourData = {
        lead_id: formData.lead_id,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        tour_type: formData.tour_type,
        guide_id: formData.guide_id || null,
        notes: formData.notes || null,
        status: 'scheduled' as const
      };

      let error;
      if (editingTour) {
        ({ error } = await supabase
          .from('facility_tours')
          .update(tourData)
          .eq('id', editingTour.id));
      } else {
        ({ error } = await supabase
          .from('facility_tours')
          .insert([tourData]));
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Tour ${editingTour ? 'updated' : 'scheduled'} successfully`,
      });

      setDialogOpen(false);
      resetForm();
      fetchTours();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save tour",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (tourId: string, status: FacilityTour['status'], outcome?: string) => {
    try {
      const updateData: any = { status };
      if (outcome) updateData.outcome = outcome;

      const { error } = await supabase
        .from('facility_tours')
        .update(updateData)
        .eq('id', tourId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tour status updated successfully",
      });

      fetchTours();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update tour status",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (tour: FacilityTour) => {
    setEditingTour(tour);
    setFormData({
      lead_id: tour.lead_id,
      scheduled_date: tour.scheduled_date,
      scheduled_time: tour.scheduled_time,
      tour_type: tour.tour_type,
      guide_id: tour.guide_id || '',
      notes: tour.notes || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (tourId: string) => {
    if (!confirm('Are you sure you want to delete this tour?')) return;

    try {
      const { error } = await supabase
        .from('facility_tours')
        .delete()
        .eq('id', tourId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tour deleted successfully",
      });

      fetchTours();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tour",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      lead_id: '',
      scheduled_date: '',
      scheduled_time: '',
      tour_type: 'general',
      guide_id: '',
      notes: ''
    });
    setEditingTour(null);
  };

  if (loading) return <div className="text-center py-8">Loading tours...</div>;

  const totalTours = tours.length;
  const scheduledTours = tours.filter(t => t.status === 'scheduled').length;
  const completedTours = tours.filter(t => t.status === 'completed').length;
  const completionRate = totalTours > 0 ? (completedTours / totalTours) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tours Scheduling</h2>
          <p className="text-muted-foreground">
            Manage facility tours for prospective members
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Tour
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTour ? 'Edit' : 'Schedule'} Tour</DialogTitle>
              <DialogDescription>
                Schedule a facility tour for a prospective member
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="lead_id">Lead</Label>
                <Select value={formData.lead_id} onValueChange={(value) => setFormData({ ...formData, lead_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.first_name} {lead.last_name} ({lead.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled_date">Date</Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="scheduled_time">Time</Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="tour_type">Tour Type</Label>
                <Select value={formData.tour_type} onValueChange={(value) => setFormData({ ...formData, tour_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Tour</SelectItem>
                    <SelectItem value="personal_training">Personal Training Focus</SelectItem>
                    <SelectItem value="group_fitness">Group Fitness Focus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="guide_id">Tour Guide (Optional)</Label>
                <Select value={formData.guide_id} onValueChange={(value) => setFormData({ ...formData, guide_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTour ? 'Update' : 'Schedule'} Tour
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tour Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalTours}</div>
                <div className="text-sm text-muted-foreground">Total Tours</div>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{scheduledTours}</div>
                <div className="text-sm text-muted-foreground">Scheduled</div>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{completedTours}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
              </div>
              <User className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tours List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Tours</CardTitle>
          <CardDescription>
            Manage scheduled facility tours and appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tours.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No tours scheduled</h3>
              <p className="text-muted-foreground">
                Schedule facility tours for your leads to increase conversions
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tours.map((tour) => (
                <div key={tour.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-medium">
                        {tour.lead?.first_name} {tour.lead?.last_name}
                      </h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {tour.scheduled_date} at {tour.scheduled_time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tour.tour_type.replace('_', ' ')} tour
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={getStatusBadgeVariant(tour.status)}>
                      {tour.status}
                    </Badge>
                    {tour.status === 'scheduled' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(tour.id, 'completed', 'interested')}
                        >
                          Complete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(tour.id, 'no_show')}
                        >
                          No Show
                        </Button>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(tour)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(tour.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}