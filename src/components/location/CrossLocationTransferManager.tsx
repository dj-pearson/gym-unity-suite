import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, ArrowRightLeft, CheckCircle, XCircle, Clock, User, Briefcase, Package, Wrench } from 'lucide-react';
import { format } from 'date-fns';

interface Transfer {
  id: string;
  transfer_type: string;
  entity_id: string;
  from_location_id: string;
  to_location_id: string;
  transfer_date: string;
  effective_date: string;
  reason: string;
  transfer_fee: number;
  status: string;
  initiated_by: string;
  approved_by: string;
  approved_at: string;
  from_location: { name: string };
  to_location: { name: string };
  initiator: { first_name: string; last_name: string };
}

export function CrossLocationTransferManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [formData, setFormData] = useState({
    transfer_type: 'member',
    entity_id: '',
    from_location_id: '',
    to_location_id: '',
    effective_date: new Date().toISOString().split('T')[0],
    reason: '',
    transfer_fee: '0.00'
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: transfers, isLoading } = useQuery({
    queryKey: ['cross-location-transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cross_location_transfers')
        .select(`
          *,
          from_location:locations!cross_location_transfers_from_location_id_fkey(name),
          to_location:locations!cross_location_transfers_to_location_id_fkey(name),
          initiator:profiles!cross_location_transfers_initiated_by_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, location_code')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('role', 'member')
        .order('first_name');

      if (error) throw error;
      return data;
    },
  });

  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('role', ['staff', 'manager'])
        .order('first_name');

      if (error) throw error;
      return data;
    },
  });

  const { data: equipment } = useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, equipment_type')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const createTransferMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('cross_location_transfers')
        .insert({
          ...data,
          organization_id: user?.user_metadata?.organization_id,
          initiated_by: user?.id,
          transfer_date: new Date().toISOString().split('T')[0],
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-location-transfers'] });
      toast.success('Transfer request created successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create transfer request');
    },
  });

  const approveTransferMutation = useMutation({
    mutationFn: async ({ transferId, approved }: { transferId: string; approved: boolean }) => {
      const { error } = await supabase
        .from('cross_location_transfers')
        .update({
          status: approved ? 'approved' : 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', transferId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-location-transfers'] });
      toast.success('Transfer status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update transfer status');
    },
  });

  const resetForm = () => {
    setFormData({
      transfer_type: 'member',
      entity_id: '',
      from_location_id: '',
      to_location_id: '',
      effective_date: new Date().toISOString().split('T')[0],
      reason: '',
      transfer_fee: '0.00'
    });
    setSelectedTransfer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.from_location_id === formData.to_location_id) {
      toast.error('Source and destination locations must be different');
      return;
    }

    const submissionData = {
      ...formData,
      transfer_fee: parseFloat(formData.transfer_fee),
    };

    createTransferMutation.mutate(submissionData);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'member': return <User className="h-4 w-4" />;
      case 'staff': return <Briefcase className="h-4 w-4" />;
      case 'equipment': return <Wrench className="h-4 w-4" />;
      case 'inventory': return <Package className="h-4 w-4" />;
      default: return <ArrowRightLeft className="h-4 w-4" />;
    }
  };

  const getEntityOptions = () => {
    switch (formData.transfer_type) {
      case 'member':
        return members?.map(m => ({ id: m.id, name: `${m.first_name} ${m.last_name} (${m.email})` })) || [];
      case 'staff':
        return staff?.map(s => ({ id: s.id, name: `${s.first_name} ${s.last_name} (${s.email})` })) || [];
      case 'equipment':
        return equipment?.map(e => ({ id: e.id, name: `${e.name} (${e.equipment_type})` })) || [];
      default:
        return [];
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading transfers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Cross-Location Transfers</h2>
          <p className="text-muted-foreground">Manage transfers between locations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Transfer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Transfer Request</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transfer_type">Transfer Type</Label>
                  <Select 
                    value={formData.transfer_type} 
                    onValueChange={(value) => setFormData({ ...formData, transfer_type: value, entity_id: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="entity_id">Select {formData.transfer_type}</Label>
                  <Select value={formData.entity_id} onValueChange={(value) => setFormData({ ...formData, entity_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Choose ${formData.transfer_type}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {getEntityOptions().map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="from_location_id">From Location</Label>
                  <Select value={formData.from_location_id} onValueChange={(value) => setFormData({ ...formData, from_location_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} {location.location_code && `(${location.location_code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="to_location_id">To Location</Label>
                  <Select value={formData.to_location_id} onValueChange={(value) => setFormData({ ...formData, to_location_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} {location.location_code && `(${location.location_code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="effective_date">Effective Date</Label>
                  <Input
                    id="effective_date"
                    type="date"
                    value={formData.effective_date}
                    onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="transfer_fee">Transfer Fee ($)</Label>
                  <Input
                    id="transfer_fee"
                    type="number"
                    step="0.01"
                    value={formData.transfer_fee}
                    onChange={(e) => setFormData({ ...formData, transfer_fee: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Reason for Transfer</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Explain why this transfer is needed..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTransferMutation.isPending}>
                  {createTransferMutation.isPending ? 'Creating...' : 'Create Request'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transfer Requests</CardTitle>
          <CardDescription>Recent transfer requests between locations</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>From → To</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers?.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(transfer.transfer_type)}
                      <span className="capitalize">{transfer.transfer_type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {transfer.entity_id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{transfer.from_location?.name}</span>
                      <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{transfer.to_location?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(transfer.effective_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>${transfer.transfer_fee?.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(transfer.status)}
                      <Badge variant={
                        transfer.status === 'approved' ? 'default' :
                        transfer.status === 'rejected' ? 'destructive' :
                        transfer.status === 'completed' ? 'secondary' : 'outline'
                      }>
                        {transfer.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {transfer.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveTransferMutation.mutate({ transferId: transfer.id, approved: true })}
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveTransferMutation.mutate({ transferId: transfer.id, approved: false })}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}