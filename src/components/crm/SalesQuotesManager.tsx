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
import { Plus, Edit2, Eye, Send, FileText, DollarSign, Trash2 } from 'lucide-react';
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

interface SalesQuote {
  id: string;
  lead_id: string;
  created_by: string;
  quote_number: string;
  title: string;
  description: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  valid_until: string | null;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  terms_conditions: string | null;
  notes: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  responded_at: string | null;
  created_at: string;
  lead?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  quote_items?: QuoteItem[];
  creator?: {
    first_name: string;
    last_name: string;
  };
}

interface QuoteItem {
  id: string;
  quote_id: string;
  item_type: 'membership_plan' | 'service' | 'product' | 'discount' | 'fee';
  item_reference_id: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  order_index: number;
  created_at: string;
}

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  billing_interval: string;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  viewed: 'bg-purple-100 text-purple-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-orange-100 text-orange-800',
};

export const SalesQuotesManager: React.FC = () => {
  const { user, profile } = useAuth();
  const [quotes, setQuotes] = useState<SalesQuote[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<SalesQuote | null>(null);
  const [viewQuote, setViewQuote] = useState<SalesQuote | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [quoteItems, setQuoteItems] = useState<Omit<QuoteItem, 'id' | 'quote_id' | 'created_at'>[]>([
    {
      item_type: 'membership_plan',
      item_reference_id: '',
      name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      order_index: 0,
    },
  ]);
  const [formData, setFormData] = useState({
    lead_id: '',
    title: '',
    description: '',
    valid_until: '',
    terms_conditions: '',
    notes: '',
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchQuotes();
      fetchLeads();
      fetchMembershipPlans();
    }
  }, [profile?.organization_id]);

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_quotes')
        .select(`
          *,
          lead:leads(first_name, last_name, email, phone),
          creator:profiles!created_by(first_name, last_name),
          quote_items:sales_quote_items(*)
        `)
        .in('lead_id', 
          await supabase
            .from('leads')
            .select('id')
            .eq('organization_id', profile?.organization_id)
            .then(({ data }) => data?.map(l => l.id) || [])
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast.error('Failed to load quotes');
    }
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, email')
        .eq('organization_id', profile?.organization_id)
        .neq('status', 'member')
        .order('first_name');

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const fetchMembershipPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('id, name, price, billing_interval')
        .eq('organization_id', profile?.organization_id)
        .order('name');

      if (error) throw error;
      setMembershipPlans(data || []);
    } catch (error) {
      console.error('Error fetching membership plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuoteNumber = () => {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    return `QT-${date.getFullYear()}-${timestamp}`;
  };

  const calculateSubtotal = () => {
    return quoteItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const subtotal = calculateSubtotal();
      const taxAmount = subtotal * 0.08; // 8% tax rate - should be configurable
      const totalAmount = subtotal + taxAmount;

      const quoteData = {
        lead_id: formData.lead_id,
        created_by: user?.id,
        quote_number: editingQuote?.quote_number || generateQuoteNumber(),
        title: formData.title,
        description: formData.description || null,
        subtotal,
        discount_amount: 0,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        valid_until: formData.valid_until || null,
        terms_conditions: formData.terms_conditions || null,
        notes: formData.notes || null,
        status: 'draft',
      };

      let quoteId: string;
      if (editingQuote) {
        const { error } = await supabase
          .from('sales_quotes')
          .update(quoteData)
          .eq('id', editingQuote.id);
        
        if (error) throw error;
        quoteId = editingQuote.id;

        // Delete existing quote items
        await supabase
          .from('sales_quote_items')
          .delete()
          .eq('quote_id', quoteId);
      } else {
        const { data, error } = await supabase
          .from('sales_quotes')
          .insert([quoteData])
          .select('id')
          .single();
        
        if (error) throw error;
        quoteId = data.id;
      }

      // Insert quote items
      const itemsToInsert = quoteItems.map((item, index) => ({
        quote_id: quoteId,
        ...item,
        order_index: index,
      }));

      const { error: itemsError } = await supabase
        .from('sales_quote_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success(editingQuote ? 'Quote updated!' : 'Quote created!');
      setIsDialogOpen(false);
      setEditingQuote(null);
      resetForm();
      fetchQuotes();
    } catch (error) {
      console.error('Error saving quote:', error);
      toast.error('Failed to save quote');
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...quoteItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate total price for the item
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    // Auto-populate from membership plan
    if (field === 'item_reference_id' && updatedItems[index].item_type === 'membership_plan') {
      const plan = membershipPlans.find(p => p.id === value);
      if (plan) {
        updatedItems[index].name = plan.name;
        updatedItems[index].unit_price = plan.price;
        updatedItems[index].total_price = updatedItems[index].quantity * plan.price;
        updatedItems[index].description = `${plan.billing_interval} membership`;
      }
    }
    
    setQuoteItems(updatedItems);
  };

  const addQuoteItem = () => {
    setQuoteItems([
      ...quoteItems,
      {
        item_type: 'service',
        item_reference_id: '',
        name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        total_price: 0,
        order_index: quoteItems.length,
      },
    ]);
  };

  const removeQuoteItem = (index: number) => {
    if (quoteItems.length > 1) {
      setQuoteItems(quoteItems.filter((_, i) => i !== index));
    }
  };

  const handleSendQuote = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from('sales_quotes')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', quoteId);

      if (error) throw error;

      toast.success('Quote sent to lead!');
      fetchQuotes();
    } catch (error) {
      console.error('Error sending quote:', error);
      toast.error('Failed to send quote');
    }
  };

  const resetForm = () => {
    setFormData({
      lead_id: '',
      title: '',
      description: '',
      valid_until: '',
      terms_conditions: '',
      notes: '',
    });
    setQuoteItems([
      {
        item_type: 'membership_plan',
        item_reference_id: '',
        name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        total_price: 0,
        order_index: 0,
      },
    ]);
  };

  const handleEdit = (quote: SalesQuote) => {
    setEditingQuote(quote);
    setFormData({
      lead_id: quote.lead_id,
      title: quote.title,
      description: quote.description || '',
      valid_until: quote.valid_until ? quote.valid_until.split('T')[0] : '',
      terms_conditions: quote.terms_conditions || '',
      notes: quote.notes || '',
    });
    setQuoteItems(quote.quote_items || []);
    setIsDialogOpen(true);
  };

  const handleView = (quote: SalesQuote) => {
    setViewQuote(quote);
    setIsViewDialogOpen(true);
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

  const quoteStats = {
    total: quotes.length,
    draft: quotes.filter(q => q.status === 'draft').length,
    sent: quotes.filter(q => q.status === 'sent').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Quotes & Proposals</h2>
          <p className="text-gray-600">Create and manage sales quotes for leads</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setEditingQuote(null);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              New Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuote ? 'Edit Quote' : 'Create New Quote'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Quote Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Premium Membership Package"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the quote"
                  rows={2}
                />
              </div>

              {/* Quote Items */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Quote Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addQuoteItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                
                {quoteItems.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={item.item_type}
                          onValueChange={(value) => handleItemChange(index, 'item_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="membership_plan">Membership Plan</SelectItem>
                            <SelectItem value="service">Service</SelectItem>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="fee">Fee</SelectItem>
                            <SelectItem value="discount">Discount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {item.item_type === 'membership_plan' && (
                        <div>
                          <Label>Plan</Label>
                          <Select
                            value={item.item_reference_id || ''}
                            onValueChange={(value) => handleItemChange(index, 'item_reference_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                            <SelectContent>
                              {membershipPlans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {plan.name} - ${plan.price}/{plan.billing_interval}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div>
                        <Label>Name</Label>
                        <Input
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          placeholder="Item name"
                        />
                      </div>

                      <div>
                        <Label>Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>

                      <div>
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          ${item.total_price.toFixed(2)}
                        </span>
                        {quoteItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuoteItem(index)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {item.item_type !== 'membership_plan' && (
                      <div className="mt-2">
                        <Label>Description</Label>
                        <Input
                          value={item.description || ''}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </div>
                    )}
                  </Card>
                ))}

                {/* Quote Summary */}
                <Card className="p-4 bg-gray-50">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (8%):</span>
                      <span>${(calculateSubtotal() * 0.08).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${(calculateSubtotal() * 1.08).toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms_conditions">Terms & Conditions</Label>
                <Textarea
                  id="terms_conditions"
                  value={formData.terms_conditions}
                  onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                  placeholder="Payment terms, cancellation policy, etc."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes for internal use"
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingQuote(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {editingQuote ? 'Update Quote' : 'Create Quote'}
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
              <FileText className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Quotes</p>
                <p className="text-2xl font-bold text-gray-900">{quoteStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Edit2 className="w-8 h-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-gray-900">{quoteStats.draft}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Send className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sent</p>
                <p className="text-2xl font-bold text-gray-900">{quoteStats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-gray-900">{quoteStats.accepted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quotes & Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote #</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.quote_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {quote.lead?.first_name} {quote.lead?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{quote.lead?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{quote.title}</p>
                      {quote.description && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {quote.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${quote.total_amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[quote.status]}>
                      {quote.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(quote.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(quote)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(quote)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {quote.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendQuote(quote.id)}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {quotes.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No quotes created yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Create your first sales quote to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quote View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quote Preview</DialogTitle>
          </DialogHeader>
          {viewQuote && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold">{viewQuote.title}</h3>
                <p className="text-gray-600">Quote #{viewQuote.quote_number}</p>
                <p className="text-sm text-gray-500">
                  For: {viewQuote.lead?.first_name} {viewQuote.lead?.last_name}
                </p>
              </div>
              
              {viewQuote.quote_items && viewQuote.quote_items.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Items</h4>
                  <div className="space-y-2">
                    {viewQuote.quote_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-gray-500">{item.description}</p>
                          )}
                          <p className="text-sm text-gray-500">
                            {item.quantity} × ${item.unit_price.toFixed(2)}
                          </p>
                        </div>
                        <div className="font-medium">
                          ${item.total_price.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${viewQuote.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${viewQuote.tax_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${viewQuote.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {viewQuote.terms_conditions && (
                <div>
                  <h4 className="font-medium mb-2">Terms & Conditions</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {viewQuote.terms_conditions}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};