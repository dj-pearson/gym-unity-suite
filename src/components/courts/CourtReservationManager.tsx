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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Edit, Trash2, Calendar as CalendarIcon, Clock, DollarSign, User, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface CourtReservation {
  id: string;
  court_id: string;
  member_id: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  hourly_rate: number;
  total_cost: number;
  payment_status: string;
  payment_method: string | null;
  additional_players: string[];
  special_requests: string | null;
  status: string;
  checked_in_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  sports_courts: {
    court_number: string;
    court_type: string;
  };
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

interface SportsCourt {
  id: string;
  court_number: string;
  court_type: string;
  hourly_rate: number;
  is_available: boolean;
  is_out_of_order: boolean;
}

export function CourtReservationManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<CourtReservation[]>([]);
  const [courts, setCourts] = useState<SportsCourt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<CourtReservation | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState({
    court_id: '',
    member_email: '',
    reservation_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    duration_minutes: 60,
    payment_method: 'cash' as string,
    additional_players: [] as string[],
    special_requests: ''
  });

  useEffect(() => {
    fetchReservations();
    fetchCourts();
  }, [user]);

  const fetchReservations = async () => {
    if (!user?.user_metadata?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('court_reservations')
        .select(`
          *,
          sports_courts!inner(court_number, court_type),
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
        description: 'Failed to fetch reservations',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourts = async () => {
    if (!user?.user_metadata?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('sports_courts')
        .select('id, court_number, court_type, hourly_rate, is_available, is_out_of_order')
        .eq('organization_id', user.user_metadata.organization_id)
        .eq('is_available', true)
        .eq('is_out_of_order', false)
        .order('court_number');

      if (error) throw error;
      setCourts(data || []);
    } catch (error) {
      console.error('Error fetching courts:', error);
    }
  };

  const calculateTotalCost = () => {
    const selectedCourt = courts.find(c => c.id === formData.court_id);
    if (!selectedCourt) return 0;
    return (selectedCourt.hourly_rate * formData.duration_minutes) / 60;
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

      const selectedCourt = courts.find(c => c.id === formData.court_id);
      if (!selectedCourt) return;

      const endTime = new Date(`1970-01-01T${formData.start_time}:00`);
      endTime.setMinutes(endTime.getMinutes() + formData.duration_minutes);
      const endTimeString = endTime.toTimeString().slice(0, 5);

      const reservationData = {
        court_id: formData.court_id,
        member_id: memberData.id,
        organization_id: user.user_metadata.organization_id,
        reservation_date: formData.reservation_date,
        start_time: formData.start_time,
        end_time: endTimeString,
        duration_minutes: formData.duration_minutes,
        hourly_rate: selectedCourt.hourly_rate,
        total_cost: calculateTotalCost(),
        payment_method: formData.payment_method,
        additional_players: formData.additional_players,
        special_requests: formData.special_requests || null,
        payment_status: 'pending',
        status: 'confirmed'
      };

      if (editingReservation) {
        const { error } = await supabase
          .from('court_reservations')
          .update(reservationData)
          .eq('id', editingReservation.id);
        
        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Reservation updated successfully'
        });
      } else {
        const { error } = await supabase
          .from('court_reservations')
          .insert(reservationData);
        
        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Reservation created successfully'
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchReservations();
    } catch (error) {
      console.error('Error saving reservation:', error);
      toast({
        title: 'Error',
        description: 'Failed to save reservation',
        variant: 'destructive'
      });
    }
  };

  const handleCheckIn = async (id: string) => {
    try {
      const { error } = await supabase
        .from('court_reservations')
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
        .from('court_reservations')
        .update({ 
          cancelled_at: new Date().toISOString(),
          status: 'cancelled',
          cancellation_reason: reason || null
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Reservation cancelled successfully'
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
      court_id: '',
      member_email: '',
      reservation_date: format(new Date(), 'yyyy-MM-dd'),
      start_time: '09:00',
      duration_minutes: 60,
      payment_method: 'cash',
      additional_players: [],
      special_requests: ''
    });
    setEditingReservation(null);
  };

  const getStatusBadge = (reservation: CourtReservation) => {
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

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading reservations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Court Reservations</h2>
          <p className="text-muted-foreground">Manage court bookings and check-ins</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              New Reservation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Court Reservation</DialogTitle>
              <DialogDescription>
                Book a court for a member
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
                  <Label htmlFor="court_id">Court *</Label>
                  <Select value={formData.court_id} onValueChange={(value) => setFormData({...formData, court_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select court" />
                    </SelectTrigger>
                    <SelectContent>
                      {courts.map(court => (
                        <SelectItem key={court.id} value={court.id}>
                          Court {court.court_number} - {court.court_type} (${court.hourly_rate}/hr)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                <div>
                  <Label htmlFor="duration_minutes">Duration (min)</Label>
                  <Select 
                    value={formData.duration_minutes.toString()} 
                    onValueChange={(value) => setFormData({...formData, duration_minutes: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Credit Card</SelectItem>
                    <SelectItem value="debit">Debit Card</SelectItem>
                    <SelectItem value="membership">Membership Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="special_requests">Special Requests</Label>
                <Textarea
                  id="special_requests"
                  value={formData.special_requests}
                  onChange={(e) => setFormData({...formData, special_requests: e.target.value})}
                  rows={2}
                />
              </div>

              {formData.court_id && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium">Total Cost: ${calculateTotalCost().toFixed(2)}</div>
                </div>
              )}

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
                    Court {reservation.sports_courts.court_number} - {reservation.sports_courts.court_type}
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
                <div className="flex items-center text-muted-foreground">
                  <Badge variant="outline">{reservation.payment_status}</Badge>
                </div>
              </div>
              
              {reservation.special_requests && (
                <div className="mt-3 text-sm">
                  <strong>Special Requests:</strong> {reservation.special_requests}
                </div>
              )}
              
              {reservation.cancellation_reason && (
                <div className="mt-3 text-sm text-destructive">
                  <strong>Cancellation Reason:</strong> {reservation.cancellation_reason}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {reservations.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent>
            <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reservations Found</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating your first court reservation.
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