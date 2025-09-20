import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar as CalendarIcon, Clock, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface LaneReservation {
  id: string;
  pool_id: string;
  lane_number: number;
  member_id: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  purpose: string;
  hourly_rate: number;
  total_cost: number;
  payment_status: string;
  status: string;
  checked_in_at: string | null;
  cancelled_at: string | null;
  pool_facilities: {
    pool_name: string;
    pool_type: string;
    lane_count: number;
  };
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

interface PoolFacility {
  id: string;
  pool_name: string;
  lane_count: number;
  is_available: boolean;
}

export function PoolLaneReservationManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<LaneReservation[]>([]);
  const [pools, setPools] = useState<PoolFacility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    pool_id: '',
    lane_number: 1,
    member_email: '',
    reservation_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    duration_minutes: 60,
    purpose: 'lap_swimming',
    hourly_rate: 15.00,
    payment_method: 'cash'
  });

  useEffect(() => {
    fetchReservations();
    fetchPools();
  }, [user]);

  const fetchReservations = async () => {
    if (!user?.user_metadata?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('pool_lane_reservations')
        .select(`
          *,
          pool_facilities!inner(pool_name, pool_type, lane_count),
          profiles!inner(first_name, last_name, email)
        `)
        .eq('organization_id', user.user_metadata.organization_id)
        .order('reservation_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setReservations(data as any || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch lane reservations',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPools = async () => {
    if (!user?.user_metadata?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('pool_facilities')
        .select('id, pool_name, lane_count, is_available')
        .eq('organization_id', user.user_metadata.organization_id)
        .eq('is_available', true)
        .eq('is_closed_for_maintenance', false)
        .order('pool_name');

      if (error) throw error;
      setPools(data || []);
    } catch (error) {
      console.error('Error fetching pools:', error);
    }
  };

  const calculateTotalCost = () => {
    return (formData.hourly_rate * formData.duration_minutes) / 60;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.user_metadata?.organization_id) return;

    try {
      // Find member by email
      const { data: memberData, error: memberError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.member_email)
        .eq('organization_id', user.user_metadata.organization_id)
        .single();

      if (memberError || !memberData) {
        toast({
          title: 'Error',
          description: 'Member not found with that email address',
          variant: 'destructive'
        });
        return;
      }

      const endTime = new Date(`1970-01-01T${formData.start_time}:00`);
      endTime.setMinutes(endTime.getMinutes() + formData.duration_minutes);
      const endTimeString = endTime.toTimeString().slice(0, 5);

      const reservationData = {
        pool_id: formData.pool_id,
        lane_number: formData.lane_number,
        member_id: memberData.id,
        organization_id: user.user_metadata.organization_id,
        reservation_date: formData.reservation_date,
        start_time: formData.start_time,
        end_time: endTimeString,
        duration_minutes: formData.duration_minutes,
        purpose: formData.purpose,
        hourly_rate: formData.hourly_rate,
        total_cost: calculateTotalCost(),
        payment_status: 'pending',
        status: 'confirmed'
      };

      const { error } = await supabase
        .from('pool_lane_reservations')
        .insert(reservationData);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Lane reservation created successfully'
      });

      setIsDialogOpen(false);
      resetForm();
      fetchReservations();
    } catch (error) {
      console.error('Error saving reservation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create lane reservation',
        variant: 'destructive'
      });
    }
  };

  const handleCheckIn = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pool_lane_reservations')
        .update({ 
          checked_in_at: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member checked in successfully'
      });

      fetchReservations();
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: 'Error',
        description: 'Failed to check in',
        variant: 'destructive'
      });
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Reason for cancellation (optional):');
    
    try {
      const { error } = await supabase
        .from('pool_lane_reservations')
        .update({ 
          cancelled_at: new Date().toISOString(),
          status: 'cancelled',
          cancellation_reason: reason || null
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lane reservation cancelled successfully'
      });

      fetchReservations();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel reservation',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      pool_id: '',
      lane_number: 1,
      member_email: '',
      reservation_date: format(new Date(), 'yyyy-MM-dd'),
      start_time: '09:00',
      duration_minutes: 60,
      purpose: 'lap_swimming',
      hourly_rate: 15.00,
      payment_method: 'cash'
    });
  };

  const getStatusBadge = (reservation: LaneReservation) => {
    if (reservation.cancelled_at) {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (reservation.checked_in_at) {
      return <Badge variant="default">Checked In</Badge>;
    }
    if (reservation.status === 'confirmed') {
      return <Badge variant="secondary">Confirmed</Badge>;
    }
    return <Badge variant="outline">{reservation.status}</Badge>;
  };

  const purposeOptions = [
    { value: 'lap_swimming', label: 'Lap Swimming' },
    { value: 'training', label: 'Training' },
    { value: 'private_lesson', label: 'Private Lesson' },
    { value: 'therapy', label: 'Therapy/Rehabilitation' }
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading lane reservations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Lane Reservations</h2>
          <p className="text-muted-foreground">Manage pool lane bookings and check-ins</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              New Lane Reservation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Lane Reservation</DialogTitle>
              <DialogDescription>
                Book a pool lane for a member
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="member_email">Member Email *</Label>
                  <Input
                    id="member_email"
                    type="email"
                    value={formData.member_email}
                    onChange={(e) => setFormData({...formData, member_email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pool_id">Pool *</Label>
                  <Select value={formData.pool_id} onValueChange={(value) => {
                    setFormData({...formData, pool_id: value});
                    const selectedPool = pools.find(p => p.id === value);
                    if (selectedPool && formData.lane_number > selectedPool.lane_count) {
                      setFormData(prev => ({...prev, pool_id: value, lane_number: 1}));
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pool" />
                    </SelectTrigger>
                    <SelectContent>
                      {pools.map(pool => (
                        <SelectItem key={pool.id} value={pool.id}>
                          {pool.pool_name} ({pool.lane_count} lanes)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="lane_number">Lane Number *</Label>
                  <Select value={formData.lane_number.toString()} onValueChange={(value) => setFormData({...formData, lane_number: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: pools.find(p => p.id === formData.pool_id)?.lane_count || 6 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          Lane {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="reservation_date">Date *</Label>
                  <Input
                    id="reservation_date"
                    type="date"
                    value={formData.reservation_date}
                    onChange={(e) => setFormData({...formData, reservation_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration_minutes">Duration</Label>
                  <Select 
                    value={formData.duration_minutes.toString()} 
                    onValueChange={(value) => setFormData({...formData, duration_minutes: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="purpose">Purpose</Label>
                  <Select value={formData.purpose} onValueChange={(value) => setFormData({...formData, purpose: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {purposeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({...formData, hourly_rate: parseFloat(e.target.value)})}
                />
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">Total Cost: ${calculateTotalCost().toFixed(2)}</div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Reservation</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reservations.map((reservation) => (
          <Card key={reservation.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {reservation.pool_facilities.pool_name} - Lane {reservation.lane_number}
                  </CardTitle>
                  <CardDescription>
                    {reservation.profiles.first_name} {reservation.profiles.last_name} ({reservation.profiles.email})
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(reservation)}
                  {reservation.status === 'confirmed' && !reservation.cancelled_at && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCheckIn(reservation.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Check In
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(reservation.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {format(new Date(reservation.reservation_date), 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Clock className="w-4 h-4 mr-2" />
                  {reservation.start_time} - {reservation.end_time}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <DollarSign className="w-4 h-4 mr-2" />
                  ${reservation.total_cost.toFixed(2)}
                </div>
                <div>
                  <Badge variant="outline" className="capitalize">
                    {reservation.purpose.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reservations.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent>
            <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Lane Reservations Found</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating your first lane reservation.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Reservation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}