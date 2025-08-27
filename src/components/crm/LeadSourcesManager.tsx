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
import { Plus, Edit, Trash2, Globe, Users, TrendingUp, DollarSign } from 'lucide-react';

interface LeadSource {
  id: string;
  name: string;
  description?: string;
  source_type: string;
  tracking_url?: string;
  cost_per_lead?: number;
  conversion_rate?: number;
  is_active: boolean;
  created_at: string;
}

interface LeadSourceFormData {
  name: string;
  description: string;
  source_type: string;
  tracking_url: string;
  cost_per_lead: string;
  conversion_rate: string;
}

export default function LeadSourcesManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<LeadSource | null>(null);
  const [formData, setFormData] = useState<LeadSourceFormData>({
    name: '',
    description: '',
    source_type: 'digital',
    tracking_url: '',
    cost_per_lead: '',
    conversion_rate: ''
  });

  useEffect(() => {
    fetchLeadSources();
  }, [profile?.organization_id]);

  const fetchLeadSources = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('lead_sources')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSources(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch lead sources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;

    try {
      const sourceData = {
        name: formData.name,
        description: formData.description || null,
        source_type: formData.source_type,
        tracking_url: formData.tracking_url || null,
        cost_per_lead: formData.cost_per_lead ? parseFloat(formData.cost_per_lead) : null,
        conversion_rate: formData.conversion_rate ? parseFloat(formData.conversion_rate) : null,
        organization_id: profile.organization_id,
        is_active: true
      };

      let error;
      if (editingSource) {
        ({ error } = await supabase
          .from('lead_sources')
          .update(sourceData)
          .eq('id', editingSource.id));
      } else {
        ({ error } = await supabase
          .from('lead_sources')
          .insert([sourceData]));
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Lead source ${editingSource ? 'updated' : 'created'} successfully`,
      });

      setDialogOpen(false);
      resetForm();
      fetchLeadSources();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save lead source",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (source: LeadSource) => {
    setEditingSource(source);
    setFormData({
      name: source.name,
      description: source.description || '',
      source_type: source.source_type,
      tracking_url: source.tracking_url || '',
      cost_per_lead: source.cost_per_lead?.toString() || '',
      conversion_rate: source.conversion_rate?.toString() || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this lead source?')) return;

    try {
      const { error } = await supabase
        .from('lead_sources')
        .delete()
        .eq('id', sourceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead source deleted successfully",
      });

      fetchLeadSources();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete lead source",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (source: LeadSource) => {
    try {
      const { error } = await supabase
        .from('lead_sources')
        .update({ is_active: !source.is_active })
        .eq('id', source.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Lead source ${!source.is_active ? 'activated' : 'deactivated'}`,
      });

      fetchLeadSources();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update lead source status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      source_type: 'digital',
      tracking_url: '',
      cost_per_lead: '',
      conversion_rate: ''
    });
    setEditingSource(null);
  };

  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'digital': return <Globe className="h-4 w-4" />;
      case 'referral': return <Users className="h-4 w-4" />;
      case 'advertising': return <TrendingUp className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getSourceTypeColor = (type: string) => {
    switch (type) {
      case 'digital': return 'bg-blue-100 text-blue-800';
      case 'referral': return 'bg-green-100 text-green-800';
      case 'advertising': return 'bg-purple-100 text-purple-800';
      case 'walk_in': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lead Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading lead sources...</div>
        </CardContent>
      </Card>
    );
  }

  const totalSources = sources.length;
  const activeSources = sources.filter(s => s.is_active).length;
  const avgConversionRate = sources.length > 0 
    ? sources.reduce((sum, s) => sum + (s.conversion_rate || 0), 0) / sources.length 
    : 0;
  const totalCostPerLead = sources.reduce((sum, s) => sum + (s.cost_per_lead || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lead Sources</h2>
          <p className="text-muted-foreground">
            Track and manage all lead generation channels
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Source
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSource ? 'Edit' : 'Add'} Lead Source</DialogTitle>
              <DialogDescription>
                Configure a new lead acquisition channel to track performance
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Source Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="source_type">Source Type</Label>
                <Select value={formData.source_type} onValueChange={(value) => setFormData({ ...formData, source_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="walk_in">Walk-in</SelectItem>
                    <SelectItem value="advertising">Advertising</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="tracking_url">Tracking URL</Label>
                <Input
                  id="tracking_url"
                  type="url"
                  value={formData.tracking_url}
                  onChange={(e) => setFormData({ ...formData, tracking_url: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost_per_lead">Cost per Lead ($)</Label>
                  <Input
                    id="cost_per_lead"
                    type="number"
                    step="0.01"
                    value={formData.cost_per_lead}
                    onChange={(e) => setFormData({ ...formData, cost_per_lead: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="conversion_rate">Conversion Rate (%)</Label>
                  <Input
                    id="conversion_rate"
                    type="number"
                    step="0.1"
                    value={formData.conversion_rate}
                    onChange={(e) => setFormData({ ...formData, conversion_rate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSource ? 'Update' : 'Create'} Source
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalSources}</div>
                <div className="text-sm text-muted-foreground">Total Sources</div>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{activeSources}</div>
                <div className="text-sm text-muted-foreground">Active Sources</div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{avgConversionRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Avg Conversion</div>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${totalCostPerLead.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">Total Cost/Lead</div>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Sources</CardTitle>
          <CardDescription>
            Performance metrics for each lead generation channel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sources.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No lead sources yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your lead acquisition channels by adding your first source
              </p>
              <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Source
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sources.map((source) => (
                <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getSourceTypeIcon(source.source_type)}
                      <div>
                        <div className="font-medium">{source.name}</div>
                        {source.description && (
                          <div className="text-sm text-muted-foreground">{source.description}</div>
                        )}
                      </div>
                    </div>
                    <Badge className={getSourceTypeColor(source.source_type)}>
                      {source.source_type.replace('_', ' ')}
                    </Badge>
                    <Badge variant={source.is_active ? "default" : "secondary"}>
                      {source.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {source.cost_per_lead && (
                      <div className="text-sm text-muted-foreground">
                        ${source.cost_per_lead}/lead
                      </div>
                    )}
                    {source.conversion_rate && (
                      <div className="text-sm text-muted-foreground">
                        {source.conversion_rate}% conv
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(source)}
                    >
                      {source.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(source)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(source.id)}
                    >
                      <Trash2 className="h-4 w-4" />
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