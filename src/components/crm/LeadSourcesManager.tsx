import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Trash2, TrendingUp, DollarSign, Users } from 'lucide-react';
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

interface LeadSource {
  id: string;
  name: string;
  category: 'online' | 'referral' | 'advertising' | 'social_media' | 'direct' | 'other';
  description: string | null;
  tracking_code: string | null;
  is_active: boolean;
  cost_per_lead: number | null;
  created_at: string;
  updated_at: string;
}

interface LeadSourceAnalytics {
  source_id: string;
  source_name: string;
  total_leads: number;
  converted_leads: number;
  conversion_rate: number;
  total_revenue: number;
  cost_per_acquisition: number;
}

const categoryColors = {
  online: 'bg-blue-100 text-blue-800',
  referral: 'bg-green-100 text-green-800',
  advertising: 'bg-purple-100 text-purple-800',
  social_media: 'bg-pink-100 text-pink-800',
  direct: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
};

const categoryIcons = {
  online: TrendingUp,
  referral: Users,
  advertising: DollarSign,
  social_media: Users,
  direct: TrendingUp,
  other: TrendingUp,
};

export const LeadSourcesManager: React.FC = () => {
  const { user, profile } = useAuth();
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [analytics, setAnalytics] = useState<LeadSourceAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<LeadSource | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'online' as LeadSource['category'],
    description: '',
    tracking_code: '',
    cost_per_lead: '',
    is_active: true,
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchLeadSources();
      fetchAnalytics();
    }
  }, [profile?.organization_id]);

  const fetchLeadSources = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_sources')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSources(data || []);
    } catch (error) {
      console.error('Error fetching lead sources:', error);
      toast.error('Failed to load lead sources');
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Fetch analytics data - this would be a more complex query in practice
      const { data: leadsData, error } = await supabase
        .from('leads')
        .select(`
          lead_source_id,
          status,
          conversion_value,
          lead_sources (
            id,
            name,
            cost_per_lead
          )
        `)
        .eq('organization_id', profile?.organization_id);

      if (error) throw error;

      // Process analytics data
      const analyticsMap = new Map<string, LeadSourceAnalytics>();
      
      leadsData?.forEach((lead) => {
        const sourceId = lead.lead_source_id;
        if (!sourceId || !lead.lead_sources) return;

        if (!analyticsMap.has(sourceId)) {
          analyticsMap.set(sourceId, {
            source_id: sourceId,
            source_name: lead.lead_sources.name,
            total_leads: 0,
            converted_leads: 0,
            conversion_rate: 0,
            total_revenue: 0,
            cost_per_acquisition: 0,
          });
        }

        const analytics = analyticsMap.get(sourceId)!;
        analytics.total_leads += 1;
        
        if (lead.status === 'member') {
          analytics.converted_leads += 1;
          analytics.total_revenue += lead.conversion_value || 0;
        }
      });

      // Calculate conversion rates and CPA
      analyticsMap.forEach((analytics) => {
        analytics.conversion_rate = analytics.total_leads > 0 
          ? (analytics.converted_leads / analytics.total_leads) * 100 
          : 0;
          
        const source = sources.find(s => s.id === analytics.source_id);
        const totalCost = source?.cost_per_lead ? source.cost_per_lead * analytics.total_leads : 0;
        analytics.cost_per_acquisition = analytics.converted_leads > 0 
          ? totalCost / analytics.converted_leads 
          : 0;
      });

      setAnalytics(Array.from(analyticsMap.values()));
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const sourceData = {
        organization_id: profile?.organization_id,
        name: formData.name,
        category: formData.category,
        description: formData.description || null,
        tracking_code: formData.tracking_code || null,
        cost_per_lead: formData.cost_per_lead ? parseFloat(formData.cost_per_lead) : null,
        is_active: formData.is_active,
      };

      let error;
      if (editingSource) {
        const result = await supabase
          .from('lead_sources')
          .update(sourceData)
          .eq('id', editingSource.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('lead_sources')
          .insert([sourceData]);
        error = result.error;
      }

      if (error) throw error;

      toast.success(editingSource ? 'Lead source updated!' : 'Lead source created!');
      setIsDialogOpen(false);
      setEditingSource(null);
      resetForm();
      fetchLeadSources();
      fetchAnalytics();
    } catch (error) {
      console.error('Error saving lead source:', error);
      toast.error('Failed to save lead source');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (source: LeadSource) => {
    setEditingSource(source);
    setFormData({
      name: source.name,
      category: source.category,
      description: source.description || '',
      tracking_code: source.tracking_code || '',
      cost_per_lead: source.cost_per_lead?.toString() || '',
      is_active: source.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this lead source?')) return;

    try {
      const { error } = await supabase
        .from('lead_sources')
        .delete()
        .eq('id', sourceId);

      if (error) throw error;

      toast.success('Lead source deleted!');
      fetchLeadSources();
      fetchAnalytics();
    } catch (error) {
      console.error('Error deleting lead source:', error);
      toast.error('Failed to delete lead source');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'online',
      description: '',
      tracking_code: '',
      cost_per_lead: '',
      is_active: true,
    });
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lead Sources</h2>
          <p className="text-gray-600">Manage and track the performance of your lead sources</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setEditingSource(null);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Source
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSource ? 'Edit Lead Source' : 'Add Lead Source'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Source Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Google Ads, Facebook"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: LeadSource['category']) => 
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="advertising">Advertising</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this lead source"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tracking_code">Tracking Code (Optional)</Label>
                <Input
                  id="tracking_code"
                  value={formData.tracking_code}
                  onChange={(e) => setFormData({ ...formData, tracking_code: e.target.value })}
                  placeholder="UTM code or tracking parameter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_per_lead">Cost Per Lead ($)</Label>
                <Input
                  id="cost_per_lead"
                  type="number"
                  step="0.01"
                  value={formData.cost_per_lead}
                  onChange={(e) => setFormData({ ...formData, cost_per_lead: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingSource(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {editingSource ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sources</p>
                <p className="text-2xl font-bold text-gray-900">{sources.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Sources</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sources.filter(s => s.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Conversion</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.length > 0 
                    ? `${(analytics.reduce((acc, a) => acc + a.conversion_rate, 0) / analytics.length).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${analytics.reduce((acc, a) => acc + a.total_revenue, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Sources Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Total Leads</TableHead>
                <TableHead>Conversions</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Cost/Lead</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => {
                const sourceAnalytics = analytics.find(a => a.source_id === source.id);
                const IconComponent = categoryIcons[source.category];
                
                return (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <IconComponent className="w-4 h-4 mr-2 text-gray-500" />
                        {source.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={categoryColors[source.category]}>
                        {source.category.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{sourceAnalytics?.total_leads || 0}</TableCell>
                    <TableCell>{sourceAnalytics?.converted_leads || 0}</TableCell>
                    <TableCell>
                      {sourceAnalytics?.conversion_rate 
                        ? `${sourceAnalytics.conversion_rate.toFixed(1)}%`
                        : '0%'
                      }
                    </TableCell>
                    <TableCell>
                      ${sourceAnalytics?.total_revenue.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      {source.cost_per_lead ? `$${source.cost_per_lead}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={source.is_active ? 'default' : 'secondary'}>
                        {source.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(source)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(source.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {sources.length === 0 && (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No lead sources configured yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Set up your lead sources to start tracking attribution
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};