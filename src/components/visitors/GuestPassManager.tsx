import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Users, Ticket, CalendarClock, DollarSign } from 'lucide-react';

interface GuestPassType {
  id: string;
  name: string;
  description: string;
  price: number;
  validity_hours: number;
  includes_amenities: string[];
  is_active: boolean;
}

interface GuestPass {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  amount_paid: number;
  status: string;
  valid_until: string;
  used_at: string | null;
  guest_pass_types: {
    name: string;
    validity_hours: number;
  };
}

export default function GuestPassManager() {
  const [passTypes, setPassTypes] = useState<GuestPassType[]>([]);
  const [guestPasses, setGuestPasses] = useState<GuestPass[]>([]);
  const [selectedPassType, setSelectedPassType] = useState<string>('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sell');
  const [organizationId, setOrganizationId] = useState<string>('');

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserOrganization();
      fetchPassTypes();
      fetchGuestPasses();
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

  const fetchPassTypes = async () => {
    const { data, error } = await supabase
      .from('guest_pass_types')
      .select('*')
      .eq('is_active', true)
      .order('price');

    if (error) {
      console.error('Error fetching pass types:', error);
    } else {
      setPassTypes(data || []);
    }
  };

  const fetchGuestPasses = async () => {
    const { data, error } = await supabase
      .from('guest_passes')
      .select(`
        *,
        guest_pass_types (
          name,
          validity_hours
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching guest passes:', error);
    } else {
      setGuestPasses(data || []);
    }
  };

  const handleSellPass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPassType || !guestName || !organizationId) {
      toast({
        title: "Error",
        description: "Please select a pass type and enter guest name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const passType = passTypes.find(p => p.id === selectedPassType);
    if (!passType) return;

    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + passType.validity_hours);

    const { error } = await supabase
      .from('guest_passes')
      .insert({
        organization_id: organizationId,
        pass_type_id: selectedPassType,
        purchased_by: user?.id,
        guest_name: guestName,
        guest_email: guestEmail || null,
        guest_phone: guestPhone || null,
        valid_until: validUntil.toISOString(),
        amount_paid: passType.price,
        payment_method: paymentMethod,
        status: 'active'
      });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to sell guest pass",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Guest pass sold to ${guestName}`,
      });
      
      // Reset form
      setGuestName('');
      setGuestEmail('');
      setGuestPhone('');
      setSelectedPassType('');
      setPaymentMethod('cash');
      setIsDialogOpen(false);
      
      // Refresh data
      fetchGuestPasses();
    }
  };

  const getStatusBadge = (pass: GuestPass) => {
    if (pass.used_at) {
      return <Badge variant="secondary">Used</Badge>;
    }
    
    const now = new Date();
    const validUntil = new Date(pass.valid_until);
    
    if (validUntil < now) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    return <Badge variant="default">Active</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Calculate stats
  const totalRevenue = guestPasses.reduce((sum, pass) => sum + pass.amount_paid, 0);
  const activePasses = guestPasses.filter(pass => 
    pass.status === 'active' && new Date(pass.valid_until) > new Date() && !pass.used_at
  ).length;
  const usedToday = guestPasses.filter(pass => 
    pass.used_at && new Date(pass.used_at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Ticket className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Passes</p>
                <p className="text-2xl font-bold">{activePasses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Used Today</p>
                <p className="text-2xl font-bold">{usedToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CalendarClock className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sold</p>
                <p className="text-2xl font-bold">{guestPasses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="sell">Sell Passes</TabsTrigger>
            <TabsTrigger value="history">Pass History</TabsTrigger>
            <TabsTrigger value="types">Pass Types</TabsTrigger>
          </TabsList>

          {activeTab === 'sell' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Sell Guest Pass
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Sell Guest Pass</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSellPass} className="space-y-4">
                  <div>
                    <Label htmlFor="passType">Pass Type</Label>
                    <Select value={selectedPassType} onValueChange={setSelectedPassType} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pass type" />
                      </SelectTrigger>
                      <SelectContent>
                        {passTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name} - {formatCurrency(type.price)} ({type.validity_hours}h)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="guestName">Guest Name</Label>
                    <Input
                      id="guestName"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="guestEmail">Email (Optional)</Label>
                    <Input
                      id="guestEmail"
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="guestPhone">Phone (Optional)</Label>
                    <Input
                      id="guestPhone"
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Credit Card</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Processing..." : "Sell Pass"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <TabsContent value="sell" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Pass Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {passTypes.map((type) => (
                  <Card key={type.id} className="border-2">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg">{type.name}</h3>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(type.price)}</p>
                      <p className="text-sm text-muted-foreground">Valid for {type.validity_hours} hours</p>
                      {type.description && (
                        <p className="text-sm mt-2">{type.description}</p>
                      )}
                      {type.includes_amenities.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium">Includes:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {type.includes_amenities.map((amenity, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Guest Pass History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {guestPasses.map((pass) => (
                  <div key={pass.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{pass.guest_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {pass.guest_pass_types?.name} • {formatCurrency(pass.amount_paid)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Valid until: {formatDateTime(pass.valid_until)}
                      </div>
                      {pass.used_at && (
                        <div className="text-xs text-muted-foreground">
                          Used: {formatDateTime(pass.used_at)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(pass)}
                    </div>
                  </div>
                ))}

                {guestPasses.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No guest passes sold yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle>Pass Type Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Pass type management coming soon. Current types are configured in the database.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}