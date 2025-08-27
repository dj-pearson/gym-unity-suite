import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, MapPin, User, Clock, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface FacilityTour {
  id: string;
  lead_id: string;
  location_id: string;
  guide_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  tour_type: 'standard' | 'premium' | 'group' | 'virtual';
  notes: string | null;
  outcome_notes: string | null;
  follow_up_scheduled: string | null;
  created_by: string;
  created_at: string;
  lead?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  location?: {
    name: string;
    address: string;
  };
  guide?: {
    first_name: string;
    last_name: string;
  };
}

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-orange-100 text-orange-800',
  rescheduled: 'bg-purple-100 text-purple-800',
};

const tourTypeColors = {
  standard: 'bg-gray-100 text-gray-800',
  premium: 'bg-purple-100 text-purple-800',
  group: 'bg-blue-100 text-blue-800',
  virtual: 'bg-green-100 text-green-800',
};

export const ToursSchedulingManager: React.FC = () => {
  const { user, profile } = useAuth();
  const [tours, setTours] = useState<FacilityTour[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<FacilityTour | null>(null);
  const [selectedTour, setSelectedTour] = useState<FacilityTour | null>(null);
  const [isOutcomeDialogOpen, setIsOutcomeDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [formData, setFormData] = useState({
    lead_id: '',
    location_id: '',
    guide_id: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: '60',
    tour_type: 'standard' as FacilityTour['tour_type'],
    notes: '',
  });
  const [outcomeData, setOutcomeData] = useState({
    status: 'completed' as FacilityTour['status'],
    outcome_notes: '',
    follow_up_scheduled: '',
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchTours();
      fetchLeads();
      fetchLocations();
      fetchStaff();
    }
  }, [profile?.organization_id]);

  const fetchTours = async () => {
    try {
      const { data, error } = await supabase
        .from('facility_tours')
        .select(`
          *,
          lead:leads(first_name, last_name, email, phone),
          location:locations(name, address),
          guide:profiles!guide_id(first_name, last_name)
        `)
        .in('location_id', 
          await supabase
            .from('locations')
            .select('id')
            .eq('organization_id', profile?.organization_id)
            .then(({ data }) => data?.map(l => l.id) || [])
        )
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setTours(data || []);
    } catch (error) {
      console.error('Error fetching tours:', error);
      toast.error('Failed to load tours');
    }
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, email, phone')
        .eq('organization_id', profile?.organization_id)
        .neq('status', 'member')
        .order('first_name');

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, address')
        .eq('organization_id', profile?.organization_id)
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('organization_id', profile?.organization_id)
        .in('role', ['owner', 'manager', 'staff', 'trainer'])
        .order('first_name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const scheduledDateTime = `${formData.scheduled_date}T${formData.scheduled_time}:00`;

      const tourData = {
        lead_id: formData.lead_id,
        location_id: formData.location_id,
        guide_id: formData.guide_id || null,
        scheduled_at: scheduledDateTime,
        duration_minutes: parseInt(formData.duration_minutes),
        tour_type: formData.tour_type,
        notes: formData.notes || null,
        status: 'scheduled',
        created_by: user?.id,
      };

      let error;
      if (editingTour) {
        const result = await supabase
          .from('facility_tours')
          .update(tourData)
          .eq('id', editingTour.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('facility_tours')
          .insert([tourData]);
        error = result.error;
      }

      if (error) throw error;

      toast.success(editingTour ? 'Tour updated!' : 'Tour scheduled!');
      setIsDialogOpen(false);
      setEditingTour(null);
      resetForm();
      fetchTours();
      
      // Create follow-up task
      if (!editingTour) {
        await supabase
          .from('lead_follow_up_tasks')
          .insert([{
            lead_id: formData.lead_id,
            assigned_to: formData.guide_id || user?.id,
            task_type: 'follow_up',
            title: 'Follow up on facility tour',
            description: 'Contact lead about their facility tour experience',
            priority: 'high',
            due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours later
            created_by: user?.id,
          }]);
      }
    } catch (error) {
      console.error('Error saving tour:', error);
      toast.error('Failed to save tour');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOutcomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTour) return;

    try {
      const updateData: any = {
        status: outcomeData.status,
        outcome_notes: outcomeData.outcome_notes || null,
      };

      if (outcomeData.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      if (outcomeData.follow_up_scheduled) {
        updateData.follow_up_scheduled = new Date(outcomeData.follow_up_scheduled).toISOString();
      }

      const { error } = await supabase
        .from('facility_tours')
        .update(updateData)
        .eq('id', selectedTour.id);

      if (error) throw error;

      // Create follow-up task if scheduled
      if (outcomeData.follow_up_scheduled) {
        await supabase
          .from('lead_follow_up_tasks')
          .insert([{
            lead_id: selectedTour.lead_id,
            assigned_to: selectedTour.guide_id || user?.id,
            task_type: 'follow_up',
            title: 'Follow up on completed facility tour',
            description: outcomeData.outcome_notes || 'Follow up on facility tour outcome',
            priority: 'medium',
            due_date: outcomeData.follow_up_scheduled,
            created_by: user?.id,
          }]);
      }

      toast.success('Tour outcome updated!');
      setIsOutcomeDialogOpen(false);
      setSelectedTour(null);
      resetOutcomeForm();
      fetchTours();
    } catch (error) {
      console.error('Error updating tour outcome:', error);
      toast.error('Failed to update tour outcome');
    }
  };

  const handleEdit = (tour: FacilityTour) => {
    setEditingTour(tour);
    const scheduledDate = new Date(tour.scheduled_at);
    setFormData({
      lead_id: tour.lead_id,
      location_id: tour.location_id,
      guide_id: tour.guide_id || '',
      scheduled_date: scheduledDate.toISOString().split('T')[0],
      scheduled_time: scheduledDate.toTimeString().slice(0, 5),
      duration_minutes: tour.duration_minutes.toString(),
      tour_type: tour.tour_type,
      notes: tour.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleUpdateOutcome = (tour: FacilityTour) => {
    setSelectedTour(tour);
    setOutcomeData({
      status: tour.status,
      outcome_notes: tour.outcome_notes || '',
      follow_up_scheduled: tour.follow_up_scheduled 
        ? new Date(tour.follow_up_scheduled).toISOString().split('T')[0]
        : '',
    });
    setIsOutcomeDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      lead_id: '',
      location_id: '',
      guide_id: '',
      scheduled_date: '',
      scheduled_time: '',
      duration_minutes: '60',
      tour_type: 'standard',
      notes: '',
    });
  };

  const resetOutcomeForm = () => {
    setOutcomeData({
      status: 'completed',
      outcome_notes: '',
      follow_up_scheduled: '',
    });
  };

  const filteredTours = tours.filter(tour => {
    if (filterStatus !== 'all' && tour.status !== filterStatus) return false;
    if (filterLocation !== 'all' && tour.location_id !== filterLocation) return false;
    return true;
  });

  const tourStats = {
    total: tours.length,
    scheduled: tours.filter(t => t.status === 'scheduled').length,
    completed: tours.filter(t => t.status === 'completed').length,
    no_show: tours.filter(t => t.status === 'no_show').length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Facility Tours</h2>
          <p className="text-gray-600">Schedule and manage facility tours for leads</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setEditingTour(null);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Tour
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTour ? 'Edit Tour' : 'Schedule New Tour'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lead_id">Lead *</Label>
                <Select
                  value={formData.lead_id}
                  onValueChange={(value) => setFormData({ ...formData, lead_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead" />
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

              <div className="space-y-2">
                <Label htmlFor="location_id">Location *</Label>
                <Select
                  value={formData.location_id}
                  onValueChange={(value) => setFormData({ ...formData, location_id: value })}
                  required
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="guide_id">Tour Guide</Label>
                <Select
                  value={formData.guide_id}
                  onValueChange={(value) => setFormData({ ...formData, guide_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select guide (optional)" />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_date">Date *</Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled_time">Time *</Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tour_type">Tour Type</Label>
                  <Select
                    value={formData.tour_type}
                    onValueChange={(value: FacilityTour['tour_type']) =>
                      setFormData({ ...formData, tour_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Tour</SelectItem>
                      <SelectItem value="premium">Premium Tour</SelectItem>
                      <SelectItem value="group">Group Tour</SelectItem>
                      <SelectItem value="virtual">Virtual Tour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    min="15"
                    max="240"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Special requirements or notes for the tour"
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingTour(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {editingTour ? 'Update Tour' : 'Schedule Tour'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tours</p>
                <p className="text-2xl font-bold text-gray-900">{tourStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{tourStats.scheduled}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{tourStats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <X className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">No Shows</p>
                <p className="text-2xl font-bold text-gray-900">{tourStats.no_show}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no_show">No Show</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterLocation} onValueChange={setFilterLocation}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tours Table */}
      <Card>
        <CardHeader>
          <CardTitle>Facility Tours</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Guide</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTours.map((tour) => (
                <TableRow key={tour.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {tour.lead?.first_name} {tour.lead?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{tour.lead?.email}</p>
                      {tour.lead?.phone && (
                        <p className="text-sm text-gray-500">{tour.lead?.phone}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{tour.location?.name}</p>
                      {tour.location?.address && (
                        <p className="text-sm text-gray-500">{tour.location?.address}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {tour.guide ? (
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-500" />
                        {tour.guide.first_name} {tour.guide.last_name}
                      </div>
                    ) : (
                      <span className="text-gray-500">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {new Date(tour.scheduled_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(tour.scheduled_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} ({tour.duration_minutes}m)
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={tourTypeColors[tour.tour_type]}>
                      {tour.tour_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[tour.status]}>
                      {tour.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tour)}
                        disabled={tour.status === 'completed' || tour.status === 'cancelled'}
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                      {tour.status === 'scheduled' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateOutcome(tour)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredTours.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tours found</p>
              <p className="text-sm text-gray-400 mb-4">
                Schedule your first facility tour to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tour Outcome Dialog */}
      <Dialog open={isOutcomeDialogOpen} onOpenChange={setIsOutcomeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Tour Outcome</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOutcomeSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Tour Status *</Label>
              <Select
                value={outcomeData.status}
                onValueChange={(value: FacilityTour['status']) =>
                  setOutcomeData({ ...outcomeData, status: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outcome_notes">Outcome Notes</Label>
              <Textarea
                id="outcome_notes"
                value={outcomeData.outcome_notes}
                onChange={(e) => setOutcomeData({ ...outcomeData, outcome_notes: e.target.value })}
                placeholder="Tour feedback, lead interest level, next steps..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="follow_up_scheduled">Schedule Follow-up (Optional)</Label>
              <Input
                id="follow_up_scheduled"
                type="date"
                value={outcomeData.follow_up_scheduled}
                onChange={(e) => setOutcomeData({ ...outcomeData, follow_up_scheduled: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOutcomeDialogOpen(false);
                  setSelectedTour(null);
                  resetOutcomeForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Update Outcome
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};