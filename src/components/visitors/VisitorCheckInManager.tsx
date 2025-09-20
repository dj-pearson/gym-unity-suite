import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, Users, Clock } from 'lucide-react';

interface GuestPass {
  id: string;
  guest_name: string;
  guest_email: string;
  status: string;
  valid_until: string;
  used_at: string | null;
  guest_pass_types: {
    name: string;
  };
}

interface VisitorCheckIn {
  id: string;
  visitor_name: string;
  visitor_email: string;
  check_in_time: string;
  check_out_time: string | null;
  purpose: string;
  liability_waiver_signed: boolean;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  guest_passes?: {
    guest_name: string;
    guest_pass_types: {
      name: string;
    };
  };
}

export default function VisitorCheckInManager() {
  const [availablePasses, setAvailablePasses] = useState<GuestPass[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<VisitorCheckIn[]>([]);
  const [selectedPassId, setSelectedPassId] = useState<string>('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [purpose, setPurpose] = useState('day_pass');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [waiverSigned, setWaiverSigned] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [organizationId, setOrganizationId] = useState<string>('');

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserOrganization();
      fetchAvailablePasses();
      fetchActiveVisitors();
    }
  }, [user]);

  const fetchUserOrganization = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user?.id)
      .single();

    if (error) {
      console.error('Error fetching organization:', error);
    } else {
      setOrganizationId(data.organization_id);
    }
  };

  const fetchAvailablePasses = async () => {
    const { data, error } = await supabase
      .from('guest_passes')
      .select(`
        *,
        guest_pass_types (
          name
        )
      `)
      .eq('status', 'active')
      .is('used_at', null)
      .gt('valid_until', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching guest passes:', error);
    } else {
      setAvailablePasses(data || []);
    }
  };

  const fetchActiveVisitors = async () => {
    const { data, error } = await supabase
      .from('visitor_checkins')
      .select(`
        *,
        guest_passes (
          guest_name,
          guest_pass_types (
            name
          )
        )
      `)
      .is('check_out_time', null)
      .order('check_in_time', { ascending: false });

    if (error) {
      console.error('Error fetching active visitors:', error);
    } else {
      setActiveVisitors(data || []);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!visitorName || !organizationId) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    if (purpose === 'day_pass' && !selectedPassId) {
      toast({
        title: "Error",
        description: "Please select a guest pass for day pass visitors",
        variant: "destructive",
      });
      return;
    }

    if (!waiverSigned) {
      toast({
        title: "Error",
        description: "Liability waiver must be signed before check-in",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check in visitor
      const { data: checkInData, error: checkInError } = await supabase
        .from('visitor_checkins')
        .insert({
          organization_id: organizationId,
          guest_pass_id: purpose === 'day_pass' ? selectedPassId : null,
          visitor_name: visitorName,
          visitor_email: visitorEmail || null,
          purpose: purpose,
          liability_waiver_signed: waiverSigned,
          emergency_contact_name: emergencyContactName || null,
          emergency_contact_phone: emergencyContactPhone || null
        })
        .select()
        .single();

      if (checkInError) throw checkInError;

      // Mark guest pass as used if applicable
      if (purpose === 'day_pass' && selectedPassId) {
        const { error: passError } = await supabase
          .from('guest_passes')
          .update({ used_at: new Date().toISOString() })
          .eq('id', selectedPassId);

        if (passError) throw passError;
      }

      // Create liability waiver record
      const { error: waiverError } = await supabase
        .from('liability_waivers')
        .insert({
          organization_id: organizationId,
          visitor_checkin_id: checkInData.id,
          signee_name: visitorName,
          signee_email: visitorEmail || null,
          waiver_content: 'Standard liability waiver - participant acknowledges risks and agrees to hold facility harmless.',
          witness_staff_id: user?.id
        });

      if (waiverError) throw waiverError;

      toast({
        title: "Success",
        description: `${visitorName} checked in successfully`,
      });

      // Reset form
      setVisitorName('');
      setVisitorEmail('');
      setSelectedPassId('');
      setPurpose('day_pass');
      setEmergencyContactName('');
      setEmergencyContactPhone('');
      setWaiverSigned(false);
      setIsDialogOpen(false);

      // Refresh data
      fetchAvailablePasses();
      fetchActiveVisitors();

    } catch (error) {
      console.error('Check-in error:', error);
      toast({
        title: "Error",
        description: "Failed to check in visitor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async (visitorId: string) => {
    const { error } = await supabase
      .from('visitor_checkins')
      .update({ check_out_time: new Date().toISOString() })
      .eq('id', visitorId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to check out visitor",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Visitor checked out successfully",
      });
      fetchActiveVisitors();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const getVisitorDuration = (checkInTime: string) => {
    const checkIn = new Date(checkInTime);
    const now = new Date();
    const diffMs = now.getTime() - checkIn.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visitor Check-In</h1>
          <p className="text-muted-foreground">Manage daily visitors and guest pass usage</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Check In Visitor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Check In Visitor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCheckIn} className="space-y-4">
              <div>
                <Label htmlFor="purpose">Visit Purpose</Label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day_pass">Day Pass</SelectItem>
                    <SelectItem value="guest">Member Guest</SelectItem>
                    <SelectItem value="tour">Facility Tour</SelectItem>
                    <SelectItem value="meeting">Meeting/Appointment</SelectItem>
                    <SelectItem value="delivery">Delivery/Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {purpose === 'day_pass' && (
                <div>
                  <Label htmlFor="guestPass">Select Guest Pass</Label>
                  <Select value={selectedPassId} onValueChange={setSelectedPassId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose available pass" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePasses.map((pass) => (
                        <SelectItem key={pass.id} value={pass.id}>
                          {pass.guest_name} - {pass.guest_pass_types.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="visitorName">Visitor Name</Label>
                <Input
                  id="visitorName"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="visitorEmail">Email (Optional)</Label>
                <Input
                  id="visitorEmail"
                  type="email"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                <Input
                  id="emergencyContactName"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyContactPhone"
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="waiver"
                  checked={waiverSigned}
                  onCheckedChange={(checked) => setWaiverSigned(checked as boolean)}
                  required
                />
                <Label htmlFor="waiver" className="text-sm">
                  Liability waiver signed and witnessed
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Checking In..." : "Check In Visitor"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Visitors</p>
                <p className="text-2xl font-bold">{activeVisitors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Available Passes</p>
                <p className="text-2xl font-bold">{availablePasses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Today's Check-ins</p>
                <p className="text-2xl font-bold">
                  {activeVisitors.filter(v => 
                    new Date(v.check_in_time).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Visitors */}
      <Card>
        <CardHeader>
          <CardTitle>Currently in Facility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeVisitors.map((visitor) => (
              <div key={visitor.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{visitor.visitor_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {visitor.purpose === 'day_pass' && visitor.guest_passes && (
                      <span>Day Pass: {visitor.guest_passes.guest_pass_types.name}</span>
                    )}
                    {visitor.purpose === 'guest' && <span>Member Guest</span>}
                    {visitor.purpose === 'tour' && <span>Facility Tour</span>}
                    {visitor.purpose === 'meeting' && <span>Meeting/Appointment</span>}
                    {visitor.purpose === 'delivery' && <span>Delivery/Service</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Checked in: {formatTime(visitor.check_in_time)} • Duration: {getVisitorDuration(visitor.check_in_time)}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={visitor.liability_waiver_signed ? "default" : "destructive"}>
                    {visitor.liability_waiver_signed ? "Waiver Signed" : "No Waiver"}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCheckOut(visitor.id)}
                  >
                    Check Out
                  </Button>
                </div>
              </div>
            ))}

            {activeVisitors.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No visitors currently in the facility
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}