import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, Calculator, Plus, Download, Users, Clock, TrendingUp, FileText, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface PayrollPeriod {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  total_amount: number;
  notes?: string;
  processed_at?: string;
}

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  hourly_rate?: number;
  salary?: number;
}

interface PayrollEntry {
  id: string;
  staff_id: string;
  payroll_period_id: string;
  regular_hours: number;
  overtime_hours: number;
  commission_amount: number;
  bonus_amount: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  notes?: string;
}

export default function PayrollManager() {
  const { user } = useAuth();
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [isCreatePeriodOpen, setIsCreatePeriodOpen] = useState(false);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newPeriod, setNewPeriod] = useState({
    start_date: new Date(),
    end_date: new Date(),
    notes: ''
  });

  const [newEntry, setNewEntry] = useState({
    staff_id: '',
    regular_hours: 0,
    overtime_hours: 0,
    commission_amount: 0,
    bonus_amount: 0,
    notes: ''
  });

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      
      // Fetch payroll periods
      const { data: periods, error: periodsError } = await supabase
        .from('payroll_periods')
        .select('*')
        .order('start_date', { ascending: false });

      if (periodsError) throw periodsError;
      setPayrollPeriods(periods || []);

      // Fetch staff members
      const { data: staff, error: staffError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .in('role', ['staff', 'manager'])
        .eq('organization_id', user?.user_metadata?.organization_id);

      if (staffError) throw staffError;
      setStaffMembers(staff || []);

    } catch (error) {
      console.error('Error fetching payroll data:', error);
      toast({
        title: "Error",
        description: "Failed to load payroll data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPayrollPeriod = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_periods')
        .insert({
          organization_id: user?.user_metadata?.organization_id,
          start_date: format(newPeriod.start_date, 'yyyy-MM-dd'),
          end_date: format(newPeriod.end_date, 'yyyy-MM-dd'),
          notes: newPeriod.notes,
          created_by: user?.id,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      setPayrollPeriods([data, ...payrollPeriods]);
      setIsCreatePeriodOpen(false);
      setNewPeriod({
        start_date: new Date(),
        end_date: new Date(),
        notes: ''
      });

      toast({
        title: "Success",
        description: "Payroll period created successfully",
      });
    } catch (error) {
      console.error('Error creating payroll period:', error);
      toast({
        title: "Error",
        description: "Failed to create payroll period",
        variant: "destructive",
      });
    }
  };

  const calculateTotalGross = () => {
    const staff = staffMembers.find(s => s.id === newEntry.staff_id);
    if (!staff) return 0;

    const hourlyRate = staff.hourly_rate || 15; // Default rate
    const regularPay = newEntry.regular_hours * hourlyRate;
    const overtimePay = newEntry.overtime_hours * (hourlyRate * 1.5);
    
    return regularPay + overtimePay + newEntry.commission_amount + newEntry.bonus_amount;
  };

  const exportPayrollData = () => {
    // In a real implementation, this would generate a CSV or PDF
    toast({
      title: "Export Started",
      description: "Payroll data export is being prepared...",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      processing: "secondary",
      completed: "default",
      cancelled: "destructive"
    };
    
    return <Badge variant={variants[status] || "outline"}>{status.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="gym-card">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading payroll data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="gym-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold">{staffMembers.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Periods</p>
                <p className="text-2xl font-bold">
                  {payrollPeriods.filter(p => p.status === 'draft' || p.status === 'processing').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">
                  ${payrollPeriods
                    .filter(p => p.processed_at && new Date(p.processed_at).getMonth() === new Date().getMonth())
                    .reduce((sum, p) => sum + (p.total_amount || 0), 0)
                    .toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {payrollPeriods.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="gym-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Payroll Management</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button onClick={exportPayrollData} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={isCreatePeriodOpen} onOpenChange={setIsCreatePeriodOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Period
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Payroll Period</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {format(newPeriod.start_date, 'MMM dd, yyyy')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent>
                            <Calendar
                              mode="single"
                              selected={newPeriod.start_date}
                              onSelect={(date) => date && setNewPeriod({...newPeriod, start_date: date})}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {format(newPeriod.end_date, 'MMM dd, yyyy')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent>
                            <Calendar
                              mode="single"
                              selected={newPeriod.end_date}
                              onSelect={(date) => date && setNewPeriod({...newPeriod, end_date: date})}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={newPeriod.notes}
                        onChange={(e) => setNewPeriod({...newPeriod, notes: e.target.value})}
                        placeholder="Optional notes for this payroll period"
                      />
                    </div>
                    <Button onClick={createPayrollPeriod} className="w-full">
                      Create Period
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="periods" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="periods">Payroll Periods</TabsTrigger>
              <TabsTrigger value="staff">Staff Overview</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="periods" className="space-y-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Processed Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollPeriods.map((period) => (
                      <TableRow key={period.id}>
                        <TableCell>
                          {format(new Date(period.start_date), 'MMM dd')} - {format(new Date(period.end_date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>{getStatusBadge(period.status)}</TableCell>
                        <TableCell>${(period.total_amount || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          {period.processed_at ? format(new Date(period.processed_at), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedPeriod(period)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="staff" className="space-y-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffMembers.map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{staff.first_name} {staff.last_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{staff.role}</Badge>
                        </TableCell>
                        <TableCell>{staff.email}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View History
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <div className="text-center py-8">
                <Calculator className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Payroll Reports</h3>
                <p className="text-muted-foreground mb-4">
                  Generate detailed payroll reports and analytics.
                </p>
                <Button onClick={exportPayrollData}>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}