import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText, Send, DollarSign, Edit, Trash2, Eye } from 'lucide-react';

interface SalesQuote {
  id: string;
  lead_id: string;
  quote_number: string;
  created_by: string;
  status: 'draft' | 'sent' | 'accepted' | 'expired' | 'rejected';
  valid_until?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  terms_conditions?: string;
  created_at: string;
  lead?: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
  line_items?: QuoteLineItem[];
}

interface QuoteLineItem {
  id: string;
  item_type: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface QuoteFormData {
  lead_id: string;
  valid_until: string;
  notes: string;
  terms_conditions: string;
  line_items: {
    item_name: string;
    description: string;
    quantity: string;
    unit_price: string;
  }[];
}

export default function SalesQuotesManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<SalesQuote[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<SalesQuote | null>(null);
  const [formData, setFormData] = useState<QuoteFormData>({
    lead_id: '',
    valid_until: '',
    notes: '',
    terms_conditions: '',
    line_items: [{ item_name: '', description: '', quantity: '1', unit_price: '0' }]
  });

  useEffect(() => {
    fetchQuotes();
    fetchLeads();
    fetchMembershipPlans();
  }, [profile?.organization_id]);

  const fetchQuotes = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('sales_quotes')
        .select(`
          *,
          lead:leads!inner(first_name, last_name, email, organization_id),
          line_items:quote_line_items(*)
        `)
        .eq('lead.organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data as any[] || []);
    } catch (error: any) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, email')
        .eq('organization_id', profile.organization_id)
        .order('first_name');

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      console.error('Error fetching leads:', error);
    }
  };

  const fetchMembershipPlans = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('id, name, price')
        .eq('organization_id', profile.organization_id)
        .order('price');

      if (error) throw error;
      setMembershipPlans(data || []);
    } catch (error: any) {
      console.error('Error fetching membership plans:', error);
    }
  };

  const generateQuoteNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `Q-${year}${month}-${random}`;
  };

  const calculateTotals = () => {
    const subtotal = formData.line_items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      return sum + (quantity * unitPrice);
    }, 0);
    
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    try {
      const { subtotal, tax, total } = calculateTotals();
      const quoteNumber = editingQuote?.quote_number || generateQuoteNumber();

      const quoteData = {
        lead_id: formData.lead_id,
        quote_number: quoteNumber,
        created_by: profile.id,
        status: 'draft' as const,
        valid_until: formData.valid_until || null,
        subtotal,
        tax_amount: tax,
        total_amount: total,
        notes: formData.notes || null,
        terms_conditions: formData.terms_conditions || null
      };

      let quoteId = editingQuote?.id;
      if (editingQuote) {
        const { error } = await supabase
          .from('sales_quotes')
          .update(quoteData)
          .eq('id', editingQuote.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('sales_quotes')
          .insert([quoteData])
          .select('id')
          .single();
        if (error) throw error;
        quoteId = data.id;
      }

      // Save line items
      if (quoteId) {
        // Delete existing line items if editing
        if (editingQuote) {
          await supabase
            .from('quote_line_items')
            .delete()
            .eq('quote_id', quoteId);
        }

        // Insert new line items
        const lineItems = formData.line_items.map(item => ({
          quote_id: quoteId,
          item_type: 'membership_plan',
          item_name: item.item_name,
          description: item.description || null,
          quantity: parseInt(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price) || 0,
          total_price: (parseInt(item.quantity) || 1) * (parseFloat(item.unit_price) || 0)
        }));

        const { error: lineItemsError } = await supabase
          .from('quote_line_items')
          .insert(lineItems);

        if (lineItemsError) throw lineItemsError;
      }

      toast({
        title: "Success",
        description: `Quote ${editingQuote ? 'updated' : 'created'} successfully`,
      });

      setDialogOpen(false);
      resetForm();
      fetchQuotes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save quote",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (quoteId: string, status: SalesQuote['status']) => {
    try {
      const updateData: any = { status };
      if (status === 'sent') {
        updateData.sent_at = new Date().toISOString();
      } else if (status === 'accepted') {
        updateData.accepted_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('sales_quotes')
        .update(updateData)
        .eq('id', quoteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quote status updated successfully",
      });

      fetchQuotes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update quote status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      lead_id: '',
      valid_until: '',
      notes: '',
      terms_conditions: '',
      line_items: [{ item_name: '', description: '', quantity: '1', unit_price: '0' }]
    });
    setEditingQuote(null);
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      line_items: [...formData.line_items, { item_name: '', description: '', quantity: '1', unit_price: '0' }]
    });
  };

  const removeLineItem = (index: number) => {
    setFormData({
      ...formData,
      line_items: formData.line_items.filter((_, i) => i !== index)
    });
  };

  const updateLineItem = (index: number, field: string, value: string) => {
    const updatedItems = [...formData.line_items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData({ ...formData, line_items: updatedItems });
  };

  const handleEdit = (quote: SalesQuote) => {
    setEditingQuote(quote);
    setFormData({
      lead_id: quote.lead_id,
      valid_until: quote.valid_until ? quote.valid_until.split('T')[0] : '',
      notes: quote.notes || '',
      terms_conditions: quote.terms_conditions || '',
      line_items: quote.line_items?.map(item => ({
        item_name: item.item_name,
        description: item.description || '',
        quantity: item.quantity.toString(),
        unit_price: item.unit_price.toString()
      })) || [{ item_name: '', description: '', quantity: '1', unit_price: '0' }]
    });
    setDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'default';
      case 'sent': return 'secondary';
      case 'draft': return 'outline';
      case 'expired': return 'destructive';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) return <div className="text-center py-8">Loading quotes...</div>;

  const totalQuotes = quotes.length;
  const totalValue = quotes.reduce((sum, quote) => sum + quote.total_amount, 0);
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;
  const acceptanceRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;

  const { subtotal, tax, total } = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sales Quotes</h2>
          <p className="text-muted-foreground">
            Create and manage membership quotes for prospects
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingQuote ? 'Edit' : 'Create'} Quote</DialogTitle>
              <DialogDescription>
                Create a detailed quote for a prospective member
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lead_id">Lead</Label>
                  <Select value={formData.lead_id} onValueChange={(value) => setFormData({ ...formData, lead_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lead" />
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
                <div>
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Quote Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                {formData.line_items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <Label>Item</Label>
                      <Select
                        value={item.item_name}
                        onValueChange={(value) => {
                          const plan = membershipPlans.find(p => p.name === value);
                          if (plan) {
                            updateLineItem(index, 'item_name', value);
                            updateLineItem(index, 'unit_price', plan.price.toString());
                          } else {
                            updateLineItem(index, 'item_name', value);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {membershipPlans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.name}>
                              {plan.name} (${plan.price})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(index, 'unit_price', e.target.value)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                        disabled={formData.line_items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* Quote Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (10%):</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="terms_conditions">Terms & Conditions</Label>
                <Textarea
                  id="terms_conditions"
                  value={formData.terms_conditions}
                  onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingQuote ? 'Update' : 'Create'} Quote
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quote Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalQuotes}</div>
                <div className="text-sm text-muted-foreground">Total Quotes</div>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${totalValue.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">Total Value</div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{acceptedQuotes}</div>
                <div className="text-sm text-muted-foreground">Accepted</div>
              </div>
              <Send className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{acceptanceRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Acceptance Rate</div>
              </div>
              <Send className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotes List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Quotes</CardTitle>
          <CardDescription>
            Track quote status and manage proposals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No quotes created</h3>
              <p className="text-muted-foreground">
                Create quotes to send professional proposals to your leads
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div key={quote.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-medium">{quote.quote_number}</h4>
                      <p className="text-sm text-muted-foreground">
                        {quote.lead?.first_name} {quote.lead?.last_name}
                      </p>
                      {quote.valid_until && (
                        <p className="text-sm text-muted-foreground">
                          Valid until {new Date(quote.valid_until).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">${quote.total_amount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {quote.line_items?.length || 0} items
                      </p>
                    </div>
                    <Badge variant={getStatusColor(quote.status)}>
                      {quote.status}
                    </Badge>
                    {quote.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(quote.id, 'sent')}
                      >
                        Send
                      </Button>
                    )}
                    {quote.status === 'sent' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(quote.id, 'accepted')}
                      >
                        Mark Accepted
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(quote)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}