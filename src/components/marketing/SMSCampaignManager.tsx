import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Phone, Plus, Send, Users, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface SMSCampaign {
  id: string;
  campaign_name: string;
  message_content: string;
  recipient_type: string;
  recipient_count: number;
  scheduled_at: string | null;
  sent_at: string | null;
  delivery_count: number;
  failure_count: number;
  status: string;
  created_at: string;
}

export default function SMSCampaignManager() {
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    campaign_name: '',
    message_content: '',
    recipient_type: '',
    scheduled_at: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (organizationId) {
      fetchCampaigns();
    }
  }, [organizationId]);

  const fetchUserProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setOrganizationId(data.organization_id);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchCampaigns = async () => {
    if (!organizationId) return;

    try {
      const { data, error } = await supabase
        .from('sms_campaigns')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load SMS campaigns",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!organizationId || !formData.campaign_name || !formData.message_content || !formData.recipient_type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('sms_campaigns')
        .insert({
          organization_id: organizationId,
          campaign_name: formData.campaign_name,
          message_content: formData.message_content,
          recipient_type: formData.recipient_type,
          scheduled_at: formData.scheduled_at || null,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "SMS campaign created successfully"
      });

      setIsDialogOpen(false);
      setFormData({
        campaign_name: '',
        message_content: '',
        recipient_type: '',
        scheduled_at: ''
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create SMS campaign",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-secondary', icon: Clock },
      scheduled: { color: 'bg-blue-500', icon: Calendar },
      sending: { color: 'bg-yellow-500', icon: Send },
      sent: { color: 'bg-green-500', icon: CheckCircle },
      failed: { color: 'bg-red-500', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="gym-card">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">SMS Campaign Manager</h2>
          <p className="text-muted-foreground">Create and manage SMS marketing campaigns</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gym-button-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create SMS Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaign_name">Campaign Name</Label>
                <Input
                  id="campaign_name"
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({...formData, campaign_name: e.target.value})}
                  placeholder="Enter campaign name"
                />
              </div>
              <div>
                <Label htmlFor="recipient_type">Recipients</Label>
                <Select value={formData.recipient_type} onValueChange={(value) => setFormData({...formData, recipient_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_members">All Members</SelectItem>
                    <SelectItem value="active_members">Active Members</SelectItem>
                    <SelectItem value="leads">Leads</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message_content">Message</Label>
                <Textarea
                  id="message_content"
                  value={formData.message_content}
                  onChange={(e) => setFormData({...formData, message_content: e.target.value})}
                  placeholder="Enter your SMS message (160 characters recommended)"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.message_content.length} characters
                </p>
              </div>
              <div>
                <Label htmlFor="scheduled_at">Schedule (Optional)</Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
                />
              </div>
              <Button onClick={handleCreateCampaign} className="w-full gym-button-primary">
                <MessageSquare className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {campaigns.length === 0 ? (
        <Card className="gym-card">
          <CardContent className="p-6 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No SMS Campaigns Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first SMS campaign to reach your members instantly
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gym-button-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="gym-card">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{campaign.campaign_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Target: {campaign.recipient_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-sm">{campaign.message_content}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{campaign.recipient_count} recipients</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{campaign.delivery_count} delivered</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>{campaign.failure_count} failed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}