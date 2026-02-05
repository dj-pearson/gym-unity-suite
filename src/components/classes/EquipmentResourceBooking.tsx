import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getStatusColor } from '@/lib/colorUtils';
import { 
  Dumbbell, 
  MapPin, 
  Calendar, 
  Clock, 
  Plus, 
  Edit, 
  Trash2,
  CheckCircle,
  AlertCircle,
  Filter
} from 'lucide-react';

interface ResourceBooking {
  id: string;
  resource_type: 'equipment' | 'room';
  resource_id: string;
  booked_by: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
  equipment?: {
    name: string;
    equipment_type: string;
  };
  facility_area?: {
    name: string;
    area_type: string;
  };
  booker?: {
    first_name: string;
    last_name: string;
  };
}

interface Equipment {
  id: string;
  name: string;
  equipment_type: string;
  status: string;
}

interface FacilityArea {
  id: string;
  name: string;
  area_type: string;
  max_capacity?: number;
}

export default function EquipmentResourceBooking() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<ResourceBooking[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [rooms, setRooms] = useState<FacilityArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'equipment' | 'room'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'completed' | 'cancelled'>('all');

  // Form state
  const [formData, setFormData] = useState({
    resource_type: 'equipment' as 'equipment' | 'room',
    resource_id: '',
    start_time: '',
    end_time: '',
    purpose: '',
    notes: ''
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchData();
    }
  }, [profile?.organization_id]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchBookings(),
        fetchEquipment(),
        fetchRooms()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('resource_bookings')
        .select('*')
        .order('start_time', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load resource bookings');
    }
  };

  const fetchEquipment = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, equipment_type, status')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setEquipment(data || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const fetchRooms = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('facility_areas')
        .select('id, name, area_type, max_capacity')
        .eq('organization_id', profile.organization_id)
        .order('name');

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.id) return;

    // Validate time range
    const startTime = new Date(formData.start_time);
    const endTime = new Date(formData.end_time);
    
    if (endTime <= startTime) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      const bookingData = {
        resource_type: formData.resource_type,
        resource_id: formData.resource_id,
        booked_by: profile.id,
        start_time: formData.start_time,
        end_time: formData.end_time,
        purpose: formData.purpose,
        notes: formData.notes || null,
        status: 'confirmed' as const
      };

      const { error } = await supabase
        .from('resource_bookings')
        .insert([bookingData]);

      if (error) throw error;
      
      toast.success('Resource booking created successfully');
      setFormData({
        resource_type: 'equipment',
        resource_id: '',
        start_time: '',
        end_time: '',
        purpose: '',
        notes: ''
      });
      setShowAddDialog(false);
      fetchBookings();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create resource booking');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('resource_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('resource_bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);

      if (error) throw error;
      toast.success('Booking completed successfully');
      fetchBookings();
    } catch (error) {
      console.error('Error completing booking:', error);
      toast.error('Failed to complete booking');
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredBookings = bookings.filter(booking => {
    const typeMatch = filterType === 'all' || booking.resource_type === filterType;
    const statusMatch = filterStatus === 'all' || booking.status === filterStatus;
    return typeMatch && statusMatch;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading resource bookings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Resource Booking</h2>
          <p className="text-muted-foreground">Manage equipment and room reservations</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Resource Booking</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Resource Type</Label>
                <Select 
                  value={formData.resource_type} 
                  onValueChange={(value: 'equipment' | 'room') => setFormData(prev => ({
                    ...prev, 
                    resource_type: value,
                    resource_id: '' // Reset resource selection when type changes
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="room">Room/Area</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Resource</Label>
                <Select 
                  value={formData.resource_id} 
                  onValueChange={(value) => setFormData(prev => ({...prev, resource_id: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select resource" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.resource_type === 'equipment' ? (
                      equipment.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.equipment_type})
                        </SelectItem>
                      ))
                    ) : (
                      rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name} ({room.area_type})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date/Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({...prev, start_time: e.target.value}))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date/Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({...prev, end_time: e.target.value}))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Purpose</Label>
                <Input
                  value={formData.purpose}
                  onChange={(e) => setFormData(prev => ({...prev, purpose: e.target.value}))}
                  placeholder="e.g., Personal Training Session, Maintenance"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                  placeholder="Additional notes or requirements"
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Booking
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="room">Rooms</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Resource Bookings</h3>
              <p className="text-muted-foreground mb-4">
                No resource bookings found. Create your first booking to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {booking.resource_type === 'equipment' ? (
                        <Dumbbell className="w-5 h-5 text-primary" />
                      ) : (
                        <MapPin className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">
                        Resource: {booking.resource_id}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {booking.resource_type} • {booking.purpose}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateTime(booking.start_time)} - {formatDateTime(booking.end_time)}
                        </span>
                        <span>
                          Booked by: {booking.booked_by}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                    
                    {booking.status === 'confirmed' && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCompleteBooking(booking.id)}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Complete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {booking.notes && (
                  <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                    <strong>Notes:</strong> {booking.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}