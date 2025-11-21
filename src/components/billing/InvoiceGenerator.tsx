import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getStatusBadgeVariant } from '@/lib/colorUtils';
import { 
  Plus,
  FileText,
  Download,
  Send,
  Eye,
  Calendar,
  DollarSign,
  User,
  Trash2
} from 'lucide-react';

const invoiceSchema = z.object({
  member_id: z.string().min(1, 'Member is required'),
  due_date: z.string().min(1, 'Due date is required'),
  notes: z.string().optional(),
});

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.01, 'Quantity must be positive'),
  unit_price: z.number().min(0, 'Price must be positive'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;
type LineItemFormData = z.infer<typeof lineItemSchema>;

export function InvoiceGenerator() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [lineItems, setLineItems] = useState<LineItemFormData[]>([]);
  const [newLineItem, setNewLineItem] = useState<LineItemFormData>({
    description: '',
    quantity: 1,
    unit_price: 0,
  });
  const { profile, organization } = useAuth();
  const { toast } = useToast();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    },
  });

  useEffect(() => {
    fetchInvoices();
    fetchMembers();
  }, [profile?.organization_id]);

  const fetchInvoices = async () => {
    if (!profile?.organization_id) return;

    try {
      setIsLoading(true);
      // Note: This would require new tables 'invoices' and 'invoice_line_items' in the database
      // For now, we'll simulate the data structure
      setInvoices([
        {
          id: 'inv-001',
          invoice_number: 'INV-2024-001',
          member_name: 'John Doe',
          member_email: 'john.doe@example.com',
          issue_date: '2024-01-15',
          due_date: '2024-02-15',
          status: 'pending',
          total_amount: 129.99,
          line_items: [
            { description: 'Monthly Membership - January', quantity: 1, unit_price: 99.99 },
            { description: 'Personal Training Session', quantity: 2, unit_price: 15.00 },
          ],
          notes: 'Thank you for being a valued member!',
        },
        {
          id: 'inv-002',
          invoice_number: 'INV-2024-002',
          member_name: 'Jane Smith',
          member_email: 'jane.smith@example.com',
          issue_date: '2024-01-16',
          due_date: '2024-02-16',
          status: 'paid',
          total_amount: 99.99,
          line_items: [
            { description: 'Monthly Membership - January', quantity: 1, unit_price: 99.99 },
          ],
          paid_date: '2024-01-18',
        }
      ]);
    } catch (error: any) {
      toast({
        title: 'Error loading invoices',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('organization_id', profile.organization_id)
        .eq('role', 'member')
        .order('first_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading members',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (data: InvoiceFormData) => {
    if (lineItems.length === 0) {
      toast({
        title: 'No line items',
        description: 'Please add at least one line item to the invoice.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const selectedMember = members.find(m => m.id === data.member_id);
      const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const tax = subtotal * 0.1; // 10% tax
      const total = subtotal + tax;

      const newInvoice = {
        id: `inv-${Date.now()}`,
        invoice_number: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
        member_id: data.member_id,
        member_name: selectedMember ? `${selectedMember.first_name || ''} ${selectedMember.last_name || ''}`.trim() : 'Unknown',
        member_email: selectedMember?.email || '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: data.due_date,
        status: 'pending',
        total_amount: total,
        subtotal,
        tax_amount: tax,
        line_items: [...lineItems],
        notes: data.notes || '',
        organization_id: profile?.organization_id,
        created_at: new Date().toISOString(),
      };

      setInvoices(prev => [newInvoice, ...prev]);
      
      toast({
        title: 'Invoice created',
        description: `Invoice ${newInvoice.invoice_number} has been created successfully.`,
      });

      setIsDialogOpen(false);
      setLineItems([]);
      form.reset();
    } catch (error: any) {
      toast({
        title: 'Error creating invoice',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const addLineItem = () => {
    if (!newLineItem.description || newLineItem.quantity <= 0 || newLineItem.unit_price < 0) {
      toast({
        title: 'Invalid line item',
        description: 'Please fill in all fields with valid values.',
        variant: 'destructive',
      });
      return;
    }

    setLineItems(prev => [...prev, { ...newLineItem }]);
    setNewLineItem({
      description: '',
      quantity: 1,
      unit_price: 0,
    });
  };

  const removeLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const getTotalAmount = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      // In a real implementation, this would send the invoice via email
      toast({
        title: 'Invoice sent',
        description: 'The invoice has been sent to the member\'s email address.',
      });
      
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId ? { ...inv, status: 'pending' } : inv
      ));
    } catch (error: any) {
      toast({
        title: 'Error sending invoice',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId ? { 
          ...inv, 
          status: 'paid', 
          paid_date: new Date().toISOString().split('T')[0] 
        } : inv
      ));
      
      toast({
        title: 'Invoice marked as paid',
        description: 'The invoice has been marked as paid.',
      });
    } catch (error: any) {
      toast({
        title: 'Error updating invoice',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-48 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Invoice Management</h2>
          <p className="text-muted-foreground">
            Generate and manage member invoices
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setLineItems([]); form.reset(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Create New Invoice
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="member_id">Member *</Label>
                  <Select value={form.watch('member_id')} onValueChange={(value) => form.setValue('member_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {member.first_name && member.last_name
                              ? `${member.first_name} ${member.last_name}`
                              : member.email}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.member_id && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.member_id.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    {...form.register('due_date')}
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Line Items</h3>
                  <div className="text-sm text-muted-foreground">
                    Total: ${getTotalAmount().toFixed(2)}
                  </div>
                </div>

                {/* Add Line Item */}
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newLineItem.description}
                      onChange={(e) => setNewLineItem(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g., Monthly Membership"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={newLineItem.quantity}
                      onChange={(e) => setNewLineItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="col-span-3">
                    <Label htmlFor="unit_price">Unit Price</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      value={newLineItem.unit_price}
                      onChange={(e) => setNewLineItem(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Button type="button" onClick={addLineItem} size="sm">
                      Add Item
                    </Button>
                  </div>
                </div>

                {/* Line Items Table */}
                {lineItems.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                          <TableCell>${(item.quantity * item.unit_price).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeLineItem(index)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  {...form.register('notes')}
                  rows={3}
                  placeholder="Additional notes or payment instructions..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create Invoice
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Invoices List */}
      <div className="grid gap-4">
        {invoices.map((invoice) => (
          <Card key={invoice.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    <FileText className="w-5 h-5" />
                    {invoice.invoice_number}
                    <Badge variant={getStatusBadgeVariant(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {invoice.member_name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due: {new Date(invoice.due_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      ${invoice.total_amount.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button size="sm" variant="outline">
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="w-3 h-3" />
                  </Button>
                  {invoice.status === 'pending' && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSendInvoice(invoice.id)}
                      >
                        <Send className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleMarkAsPaid(invoice.id)}
                      >
                        Mark Paid
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Line Items:</h4>
                  <div className="space-y-1">
                    {invoice.line_items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.description} (x{item.quantity})</span>
                        <span>${(item.quantity * item.unit_price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {invoice.notes && (
                  <div>
                    <h4 className="font-medium mb-1">Notes:</h4>
                    <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                  </div>
                )}
                
                {invoice.status === 'paid' && invoice.paid_date && (
                  <div className="text-sm text-green-600">
                    Paid on {new Date(invoice.paid_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {invoices.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Invoices Created</h3>
            <p className="text-muted-foreground mb-4">
              Create your first invoice to start billing members for services.
            </p>
            <Button onClick={() => { setLineItems([]); form.reset(); setIsDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Invoice
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}