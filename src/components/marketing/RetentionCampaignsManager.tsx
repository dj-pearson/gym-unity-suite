import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Mail, Target, Users, TrendingUp, Calendar, Gift } from 'lucide-react';

interface RetentionCampaign {
  id: string;
  name: string;
  description?: string;
  campaign_type: 'win_back' | 'at_risk' | 'loyalty_reward' | 'milestone_celebration' | 'birthday' | 'anniversary';
  trigger_conditions: any;
  message_template: string;
  reward_type?: 'discount' | 'free_classes' | 'merchandise' | 'loyalty_points' | 'guest_pass';
  reward_value?: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  executions_count?: number;
}

interface CampaignFormData {
  name: string;
  description: string;
  campaign_type: string;
  message_template: string;
  reward_type: string;
  reward_value: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
  trigger_conditions: {
    days_since_last_visit: string;
    engagement_threshold: string;
    membership_length: string;
  };
}

export default function RetentionCampaignsManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<RetentionCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<RetentionCampaign | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    campaign_type: 'at_risk',
    message_template: '',
    reward_type: 'discount',
    reward_value: '10',
    is_active: true,
    start_date: '',
    end_date: '',
    trigger_conditions: {
      days_since_last_visit: '30',
      engagement_threshold: '2',
      membership_length: '90'
    }
  });

  useEffect(() => {
    fetchCampaigns();
  }, [profile?.organization_id]);

  const fetchCampaigns = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('retention_campaigns')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get execution counts separately
      const campaignsWithCounts = await Promise.all((data || []).map(async (campaign) => {
        const { count } = await supabase
          .from('campaign_executions')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id);
        
        return {
          ...campaign,
          executions_count: count || 0
        };
      }));
      
      setCampaigns(campaignsWithCounts as RetentionCampaign[]);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to fetch campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !profile?.organization_id) return;

    try {
      const campaignData = {
        organization_id: profile.organization_id,
        name: formData.name,
        description: formData.description || null,
        campaign_type: formData.campaign_type as RetentionCampaign['campaign_type'],
        message_template: formData.message_template,
        reward_type: formData.reward_type === 'none' ? null : formData.reward_type,
        reward_value: formData.reward_type === 'none' ? null : parseFloat(formData.reward_value) || 0,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        trigger_conditions: formData.trigger_conditions,
        created_by: profile.id
      };

      if (editingCampaign) {
        const { error } = await supabase
          .from('retention_campaigns')
          .update(campaignData)
          .eq('id', editingCampaign.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('retention_campaigns')
          .insert([campaignData]);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Campaign ${editingCampaign ? 'updated' : 'created'} successfully`,
      });

      setDialogOpen(false);
      resetForm();
      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save campaign",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (campaignId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('retention_campaigns')
        .update({ is_active: !isActive })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Campaign ${!isActive ? 'activated' : 'deactivated'}`,
      });

      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update campaign",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      campaign_type: 'at_risk',
      message_template: '',
      reward_type: 'discount',
      reward_value: '10',
      is_active: true,
      start_date: '',
      end_date: '',
      trigger_conditions: {
        days_since_last_visit: '30',
        engagement_threshold: '2',
        membership_length: '90'
      }
    });
    setEditingCampaign(null);
  };

  const handleEdit = (campaign: RetentionCampaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      campaign_type: campaign.campaign_type,
      message_template: campaign.message_template,
      reward_type: campaign.reward_type || 'none',
      reward_value: campaign.reward_value?.toString() || '0',
      is_active: campaign.is_active,
      start_date: campaign.start_date ? campaign.start_date.split('T')[0] : '',
      end_date: campaign.end_date ? campaign.end_date.split('T')[0] : '',
      trigger_conditions: campaign.trigger_conditions || {
        days_since_last_visit: '30',
        engagement_threshold: '2',
        membership_length: '90'
      }
    });
    setDialogOpen(true);
  };

  const getCampaignTypeColor = (type: string) => {
    switch (type) {
      case 'win_back': return 'bg-red-100 text-red-800';
      case 'at_risk': return 'bg-orange-100 text-orange-800';
      case 'loyalty_reward': return 'bg-purple-100 text-purple-800';
      case 'milestone_celebration': return 'bg-green-100 text-green-800';
      case 'birthday': return 'bg-pink-100 text-pink-800';
      case 'anniversary': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'win_back': return <Target className="h-4 w-4" />;
      case 'at_risk': return <TrendingUp className="h-4 w-4" />;
      case 'loyalty_reward': return <Gift className="h-4 w-4" />;
      case 'milestone_celebration': return <Target className="h-4 w-4" />;
      case 'birthday': return <Calendar className="h-4 w-4" />;
      case 'anniversary': return <Calendar className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  if (loading) return <div className="text-center py-8">Loading campaigns...</div>;

  const activeCampaigns = campaigns.filter(c => c.is_active).length;
  const totalExecutions = campaigns.reduce((sum, c) => sum + (c.executions_count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Retention Campaigns</h2>
          <p className="text-muted-foreground">
            Create automated campaigns to engage and retain members
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCampaign ? 'Edit' : 'Create'} Campaign</DialogTitle>
              <DialogDescription>
                Design an automated retention campaign to engage members
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="campaign_type">Campaign Type</Label>
                  <Select value={formData.campaign_type} onValueChange={(value) => setFormData({ ...formData, campaign_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="at_risk">At-Risk Members</SelectItem>
                      <SelectItem value="win_back">Win-Back</SelectItem>
                      <SelectItem value="loyalty_reward">Loyalty Reward</SelectItem>
                      <SelectItem value="milestone_celebration">Milestone Celebration</SelectItem>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="anniversary">Anniversary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the campaign"
                />
              </div>

              <div>
                <Label htmlFor="message_template">Message Template</Label>
                <Textarea
                  id="message_template"
                  value={formData.message_template}
                  onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                  rows={4}
                  placeholder="Hi {{first_name}}, we noticed you haven't visited us in a while..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reward_type">Reward Type</Label>
                  <Select value={formData.reward_type} onValueChange={(value) => setFormData({ ...formData, reward_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Reward</SelectItem>
                      <SelectItem value="discount">Discount</SelectItem>
                      <SelectItem value="free_classes">Free Classes</SelectItem>
                      <SelectItem value="merchandise">Merchandise</SelectItem>
                      <SelectItem value="loyalty_points">Loyalty Points</SelectItem>
                      <SelectItem value="guest_pass">Guest Pass</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.reward_type !== 'none' && (
                  <div>
                    <Label htmlFor="reward_value">
                      Reward Value {formData.reward_type === 'discount' && '(%)'}
                    </Label>
                    <Input
                      id="reward_value"
                      type="number"
                      value={formData.reward_value}
                      onChange={(e) => setFormData({ ...formData, reward_value: e.target.value })}
                      min="0"
                    />
                  </div>
                )}
              </div>

              {/* Trigger Conditions */}
              <div className="space-y-3">
                <Label>Trigger Conditions</Label>
                <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="days_since_last_visit">Days Since Last Visit</Label>
                    <Input
                      id="days_since_last_visit"
                      type="number"
                      value={formData.trigger_conditions.days_since_last_visit}
                      onChange={(e) => setFormData({
                        ...formData,
                        trigger_conditions: {
                          ...formData.trigger_conditions,
                          days_since_last_visit: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="engagement_threshold">Min Engagement Score</Label>
                    <Input
                      id="engagement_threshold"
                      type="number"
                      value={formData.trigger_conditions.engagement_threshold}
                      onChange={(e) => setFormData({
                        ...formData,
                        trigger_conditions: {
                          ...formData.trigger_conditions,
                          engagement_threshold: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="membership_length">Min Membership (days)</Label>
                    <Input
                      id="membership_length"
                      type="number"
                      value={formData.trigger_conditions.membership_length}
                      onChange={(e) => setFormData({
                        ...formData,
                        trigger_conditions: {
                          ...formData.trigger_conditions,
                          membership_length: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active Campaign</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCampaign ? 'Update' : 'Create'} Campaign
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaign Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{campaigns.length}</div>
                <div className="text-sm text-muted-foreground">Total Campaigns</div>
              </div>
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{activeCampaigns}</div>
                <div className="text-sm text-muted-foreground">Active Campaigns</div>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalExecutions}</div>
                <div className="text-sm text-muted-foreground">Total Sent</div>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>
            Manage your retention and engagement campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No campaigns created</h3>
              <p className="text-muted-foreground">
                Create automated campaigns to engage and retain your members
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getCampaignTypeIcon(campaign.campaign_type)}
                    </div>
                    <div>
                      <h4 className="font-medium">{campaign.name}</h4>
                      {campaign.description && (
                        <p className="text-sm text-muted-foreground">{campaign.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getCampaignTypeColor(campaign.campaign_type)}>
                          {campaign.campaign_type.replace('_', ' ')}
                        </Badge>
                        {campaign.reward_type && (
                          <Badge variant="outline">
                            {campaign.reward_type} {campaign.reward_value && `(${campaign.reward_value})`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{campaign.executions_count || 0} sent</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={campaign.is_active}
                        onCheckedChange={() => handleToggleActive(campaign.id, campaign.is_active)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(campaign)}
                      >
                        Edit
                      </Button>
                    </div>
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