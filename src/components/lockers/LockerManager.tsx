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
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Lock, Users, Wrench, DollarSign, Eye, Edit, Trash2 } from 'lucide-react';

interface Locker {
  id: string;
  locker_number: string;
  locker_type: string;
  size_category: string;
  has_lock: boolean;
  lock_type: string;
  lock_combination: string;
  key_number: string;
  monthly_rate: number;
  daily_rate: number;
  deposit_amount: number;
  is_available: boolean;
  is_out_of_order: boolean;
  maintenance_notes: string;
}

interface LockerRental {
  id: string;
  rental_type: string;
  start_date: string;
  end_date: string;
  monthly_rate: number;
  deposit_paid: number;
  status: string;
  next_payment_due: string;
  member_id: string;
  lockers: {
    locker_number: string;
    locker_type: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function LockerManager() {
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [rentals, setRentals] = useState<LockerRental[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('lockers');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [isAddLockerOpen, setIsAddLockerOpen] = useState(false);
  const [isRentLockerOpen, setIsRentLockerOpen] = useState(false);
  const [lockerNumber, setLockerNumber] = useState('');
  const [lockerType, setLockerType] = useState('standard');
  const [sizeCategory, setSizeCategory] = useState('medium');
  const [hasLock, setHasLock] = useState(true);
  const [lockType, setLockType] = useState('combination');
  const [lockCombination, setLockCombination] = useState('');
  const [keyNumber, setKeyNumber] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('10.00');
  const [dailyRate, setDailyRate] = useState('2.00');
  const [depositAmount, setDepositAmount] = useState('25.00');
  
  // Rental form states
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [rentalType, setRentalType] = useState('monthly');
  const [depositPaid, setDepositPaid] = useState('');

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserOrganization();
      fetchLockers();
      fetchRentals();
      fetchMembers();
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

  const fetchLockers = async () => {
    const { data, error } = await supabase
      .from('lockers')
      .select('*')
      .order('locker_number');

    if (error) {
      console.error('Error fetching lockers:', error);
    } else {
      setLockers(data || []);
    }
  };

  const fetchRentals = async () => {
    const { data, error } = await supabase
      .from('locker_rentals')
      .select(`
        *,
        lockers (
          locker_number,
          locker_type
        ),
        profiles (
          first_name,
          last_name,
          email
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rentals:', error);
    } else {
      setRentals((data as any) || []);
    }
  };

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('role', 'member')
      .order('first_name');

    if (error) {
      console.error('Error fetching members:', error);
    } else {
      setMembers(data || []);
    }
  };

  const handleAddLocker = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lockerNumber || !organizationId) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase
      .from('lockers')
      .insert({
        organization_id: organizationId,
        locker_number: lockerNumber,
        locker_type: lockerType,
        size_category: sizeCategory,
        has_lock: hasLock,
        lock_type: lockType,
        lock_combination: lockType === 'combination' ? lockCombination : null,
        key_number: lockType === 'key' ? keyNumber : null,
        monthly_rate: parseFloat(monthlyRate),
        daily_rate: parseFloat(dailyRate),
        deposit_amount: parseFloat(depositAmount)
      });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add locker",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Locker ${lockerNumber} added successfully`,
      });
      
      // Reset form
      setLockerNumber('');
      setLockCombination('');
      setKeyNumber('');
      setMonthlyRate('10.00');
      setDailyRate('2.00');
      setDepositAmount('25.00');
      setIsAddLockerOpen(false);
      
      // Refresh data
      fetchLockers();
    }
  };

  const handleRentLocker = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLocker || !selectedMemberId || !organizationId) {
      toast({
        title: "Error",
        description: "Please select a locker and member",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create rental record
      const { error: rentalError } = await supabase
        .from('locker_rentals')
        .insert({
          organization_id: organizationId,
          locker_id: selectedLocker.id,
          member_id: selectedMemberId,
          rental_type: rentalType,
          monthly_rate: selectedLocker.monthly_rate,
          deposit_paid: parseFloat(depositPaid || '0'),
          status: 'active'
        });

      if (rentalError) throw rentalError;

      // Mark locker as unavailable
      const { error: lockerError } = await supabase
        .from('lockers')
        .update({ is_available: false })
        .eq('id', selectedLocker.id);

      if (lockerError) throw lockerError;

      toast({
        title: "Success",
        description: `Locker ${selectedLocker.locker_number} rented successfully`,
      });
      
      // Reset form
      setSelectedLocker(null);
      setSelectedMemberId('');
      setRentalType('monthly');
      setDepositPaid('');
      setIsRentLockerOpen(false);
      
      // Refresh data
      fetchLockers();
      fetchRentals();

    } catch (error) {
      console.error('Rental error:', error);
      toast({
        title: "Error",
        description: "Failed to rent locker",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndRental = async (rentalId: string, lockerId: string) => {
    const { error: rentalError } = await supabase
      .from('locker_rentals')
      .update({ status: 'ended', end_date: new Date().toISOString().split('T')[0] })
      .eq('id', rentalId);

    if (rentalError) {
      toast({
        title: "Error",
        description: "Failed to end rental",
        variant: "destructive",
      });
      return;
    }

    // Mark locker as available
    const { error: lockerError } = await supabase
      .from('lockers')
      .update({ is_available: true })
      .eq('id', lockerId);

    if (lockerError) {
      toast({
        title: "Error",
        description: "Failed to update locker availability",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Rental ended successfully",
    });

    fetchLockers();
    fetchRentals();
  };

  const getLockerStatusBadge = (locker: Locker) => {
    if (locker.is_out_of_order) {
      return <Badge variant="destructive">Out of Order</Badge>;
    }
    if (!locker.is_available) {
      return <Badge variant="secondary">Rented</Badge>;
    }
    return <Badge variant="default">Available</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate stats
  const totalLockers = lockers.length;
  const availableLockers = lockers.filter(l => l.is_available && !l.is_out_of_order).length;
  const rentedLockers = lockers.filter(l => !l.is_available).length;
  const outOfOrderLockers = lockers.filter(l => l.is_out_of_order).length;
  const monthlyRevenue = rentals.reduce((sum, rental) => sum + rental.monthly_rate, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Lockers</p>
                <p className="text-2xl font-bold">{totalLockers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">{availableLockers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Rented</p>
                <p className="text-2xl font-bold">{rentedLockers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wrench className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Out of Order</p>
                <p className="text-2xl font-bold">{outOfOrderLockers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="lockers">Locker Inventory</TabsTrigger>
            <TabsTrigger value="rentals">Active Rentals</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <div className="flex space-x-2">
            {activeTab === 'lockers' && (
              <>
                <Dialog open={isAddLockerOpen} onOpenChange={setIsAddLockerOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Locker
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Locker</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddLocker} className="space-y-4">
                      <div>
                        <Label htmlFor="lockerNumber">Locker Number</Label>
                        <Input
                          id="lockerNumber"
                          value={lockerNumber}
                          onChange={(e) => setLockerNumber(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="lockerType">Locker Type</Label>
                        <Select value={lockerType} onValueChange={setLockerType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                            <SelectItem value="xl">Extra Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="sizeCategory">Size Category</Label>
                        <Select value={sizeCategory} onValueChange={setSizeCategory}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                            <SelectItem value="xl">Extra Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="hasLock"
                          checked={hasLock}
                          onCheckedChange={(checked) => setHasLock(checked as boolean)}
                        />
                        <Label htmlFor="hasLock">Has Built-in Lock</Label>
                      </div>

                      {hasLock && (
                        <>
                          <div>
                            <Label htmlFor="lockType">Lock Type</Label>
                            <Select value={lockType} onValueChange={setLockType}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="combination">Combination</SelectItem>
                                <SelectItem value="key">Key</SelectItem>
                                <SelectItem value="digital">Digital</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {lockType === 'combination' && (
                            <div>
                              <Label htmlFor="lockCombination">Lock Combination</Label>
                              <Input
                                id="lockCombination"
                                value={lockCombination}
                                onChange={(e) => setLockCombination(e.target.value)}
                                placeholder="e.g., 1234"
                              />
                            </div>
                          )}

                          {lockType === 'key' && (
                            <div>
                              <Label htmlFor="keyNumber">Key Number</Label>
                              <Input
                                id="keyNumber"
                                value={keyNumber}
                                onChange={(e) => setKeyNumber(e.target.value)}
                                placeholder="e.g., K001"
                              />
                            </div>
                          )}
                        </>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label htmlFor="monthlyRate">Monthly Rate</Label>
                          <Input
                            id="monthlyRate"
                            type="number"
                            step="0.01"
                            value={monthlyRate}
                            onChange={(e) => setMonthlyRate(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="dailyRate">Daily Rate</Label>
                          <Input
                            id="dailyRate"
                            type="number"
                            step="0.01"
                            value={dailyRate}
                            onChange={(e) => setDailyRate(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="depositAmount">Deposit</Label>
                          <Input
                            id="depositAmount"
                            type="number"
                            step="0.01"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                          />
                        </div>
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Adding..." : "Add Locker"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isRentLockerOpen} onOpenChange={setIsRentLockerOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Rent Locker
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Rent Locker</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRentLocker} className="space-y-4">
                      <div>
                        <Label htmlFor="selectLocker">Available Locker</Label>
                        <Select value={selectedLocker?.id || ''} onValueChange={(value) => {
                          const locker = lockers.find(l => l.id === value);
                          setSelectedLocker(locker || null);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose available locker" />
                          </SelectTrigger>
                          <SelectContent>
                            {lockers.filter(l => l.is_available && !l.is_out_of_order).map((locker) => (
                              <SelectItem key={locker.id} value={locker.id}>
                                #{locker.locker_number} - {locker.locker_type} ({formatCurrency(locker.monthly_rate)}/mo)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="memberSelect">Member</Label>
                        <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose member" />
                          </SelectTrigger>
                          <SelectContent>
                            {members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.first_name} {member.last_name} ({member.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="rentalType">Rental Type</Label>
                        <Select value={rentalType} onValueChange={setRentalType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="annual">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="depositPaid">Deposit Paid</Label>
                        <Input
                          id="depositPaid"
                          type="number"
                          step="0.01"
                          value={depositPaid}
                          onChange={(e) => setDepositPaid(e.target.value)}
                          placeholder={selectedLocker ? selectedLocker.deposit_amount.toString() : '0.00'}
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Processing..." : "Rent Locker"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        <TabsContent value="lockers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Locker Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {lockers.map((locker) => (
                  <Card key={locker.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">#{locker.locker_number}</h3>
                        {getLockerStatusBadge(locker)}
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Type:</span> {locker.locker_type}</p>
                        <p><span className="font-medium">Size:</span> {locker.size_category}</p>
                        <p><span className="font-medium">Monthly:</span> {formatCurrency(locker.monthly_rate)}</p>
                        <p><span className="font-medium">Deposit:</span> {formatCurrency(locker.deposit_amount)}</p>
                        
                        {locker.has_lock && (
                          <p><span className="font-medium">Lock:</span> {locker.lock_type}</p>
                        )}
                        
                        {locker.maintenance_notes && (
                          <p className="text-yellow-600 text-xs">
                            <span className="font-medium">Note:</span> {locker.maintenance_notes}
                          </p>
                        )}
                      </div>

                      <div className="flex space-x-1 mt-3">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                        {locker.is_available && (
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {lockers.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No lockers added yet. Click "Add Locker" to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rentals">
          <Card>
            <CardHeader>
              <CardTitle>Active Locker Rentals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rentals.map((rental) => (
                  <div key={rental.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        Locker #{rental.lockers.locker_number}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {rental.profiles.first_name} {rental.profiles.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {rental.rental_type} • {formatCurrency(rental.monthly_rate)}/mo
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Started: {formatDate(rental.start_date)} • Next Payment: {formatDate(rental.next_payment_due)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        new Date(rental.next_payment_due) < new Date() ? "destructive" : "default"
                      }>
                        {rental.status}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEndRental(rental.id, rental.lockers.locker_number)}
                      >
                        End Rental
                      </Button>
                    </div>
                  </div>
                ))}

                {rentals.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No active rentals
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Locker Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Maintenance tracking coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}