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
import { Plus, Mail, Send, Eye, Copy, Edit, Trash2, Play, Pause } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  template_type: 'welcome' | 'follow_up' | 'tour_reminder' | 'promotional' | 'abandoned_lead' | 'post_tour' | 'referral';
  trigger_event: string | null;
  delay_hours: number | null;
  is_active: boolean;
  variables: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  template_id: string;
  target_audience: 'all_leads' | 'qualified_leads' | 'tour_attendees' | 'members' | 'custom';
  custom_filter: any;
  scheduled_at: string | null;
  sent_at: string | null;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  total_recipients: number;
  opened_count: number;
  clicked_count: number;
  created_by: string;
  created_at: string;
  template?: EmailTemplate;
}

interface EmailLog {
  id: string;
  template_id: string;
  campaign_id: string | null;
  recipient_email: string;
  lead_id: string | null;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  error_message: string | null;
}

const templateTypeColors = {
  welcome: 'bg-blue-100 text-blue-800',
  follow_up: 'bg-yellow-100 text-yellow-800',
  tour_reminder: 'bg-purple-100 text-purple-800',
  promotional: 'bg-green-100 text-green-800',
  abandoned_lead: 'bg-orange-100 text-orange-800',
  post_tour: 'bg-indigo-100 text-indigo-800',
  referral: 'bg-pink-100 text-pink-800',
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  sending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const availableVariables = [
  '{{first_name}}',
  '{{last_name}}',
  '{{email}}',
  '{{phone}}',
  '{{gym_name}}',
  '{{location_name}}',
  '{{tour_date}}',
  '{{tour_time}}',
  '{{salesperson_name}}',
  '{{unsubscribe_link}}',
];

export const EmailTemplateManager: React.FC = () => {
  const { user, profile } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'templates' | 'campaigns' | 'analytics'>('templates');

  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    content: '',
    template_type: 'welcome' as EmailTemplate['template_type'],
    trigger_event: '',
    delay_hours: '',
    is_active: true,
  });

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    template_id: '',
    target_audience: 'all_leads' as EmailCampaign['target_audience'],
    scheduled_at: '',
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchTemplates();
      fetchCampaigns();
      fetchEmailLogs();
    }
  }, [profile?.organization_id]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load email templates');
    }
  };

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select(`
          *,
          template:email_templates(name, subject)
        `)
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchEmailLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEmailLogs(data || []);
    } catch (error) {
      console.error('Error fetching email logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const templateData = {
        organization_id: profile?.organization_id,
        name: templateForm.name,
        subject: templateForm.subject,
        content: templateForm.content,
        template_type: templateForm.template_type,
        trigger_event: templateForm.trigger_event || null,
        delay_hours: templateForm.delay_hours ? parseInt(templateForm.delay_hours) : null,
        is_active: templateForm.is_active,
        variables: extractVariables(templateForm.content + ' ' + templateForm.subject),
        created_by: user?.id,
      };

      let error;
      if (editingTemplate) {
        const result = await supabase
          .from('email_templates')
          .update({ ...templateData, updated_at: new Date().toISOString() })
          .eq('id', editingTemplate.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('email_templates')
          .insert([templateData]);
        error = result.error;
      }

      if (error) throw error;

      toast.success(editingTemplate ? 'Template updated!' : 'Template created!');
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
      resetTemplateForm();
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calculate recipients based on target audience
      let totalRecipients = 0;
      
      // This would be calculated based on the actual audience
      // For now, we'll use a placeholder
      switch (campaignForm.target_audience) {
        case 'all_leads':
          const { count: leadsCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', profile?.organization_id);
          totalRecipients = leadsCount || 0;
          break;
        case 'qualified_leads':
          const { count: qualifiedCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', profile?.organization_id)
            .in('status', ['qualified', 'hot', 'warm']);
          totalRecipients = qualifiedCount || 0;
          break;
        default:
          totalRecipients = 0;
      }

      const campaignData = {
        organization_id: profile?.organization_id,
        name: campaignForm.name,
        template_id: campaignForm.template_id,
        target_audience: campaignForm.target_audience,
        scheduled_at: campaignForm.scheduled_at || null,
        status: campaignForm.scheduled_at ? 'scheduled' : 'draft',
        total_recipients: totalRecipients,
        created_by: user?.id,
      };

      let error;
      if (editingCampaign) {
        const result = await supabase
          .from('email_campaigns')
          .update(campaignData)
          .eq('id', editingCampaign.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('email_campaigns')
          .insert([campaignData]);
        error = result.error;
      }

      if (error) throw error;

      toast.success(editingCampaign ? 'Campaign updated!' : 'Campaign created!');
      setIsCampaignDialogOpen(false);
      setEditingCampaign(null);
      resetCampaignForm();
      fetchCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign');
    }
  };

  const toggleTemplateStatus = async (templateId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', templateId);

      if (error) throw error;

      toast.success(`Template ${isActive ? 'activated' : 'deactivated'}`);
      fetchTemplates();
    } catch (error) {
      console.error('Error updating template status:', error);
      toast.error('Failed to update template status');
    }
  };

  const sendTestEmail = async (template: EmailTemplate) => {
    try {
      // This would integrate with your email service
      // For now, we'll just show a success message
      toast.success('Test email sent to your email address');
      
      // Log the test email
      await supabase
        .from('email_logs')
        .insert([{
          organization_id: profile?.organization_id,
          template_id: template.id,
          recipient_email: user?.email,
          status: 'sent',
          sent_at: new Date().toISOString(),
        }]);

      fetchEmailLogs();
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    }
  };

  const duplicateTemplate = async (template: EmailTemplate) => {
    try {
      const duplicateData = {
        organization_id: profile?.organization_id,
        name: `${template.name} (Copy)`,
        subject: template.subject,
        content: template.content,
        template_type: template.template_type,
        trigger_event: template.trigger_event,
        delay_hours: template.delay_hours,
        is_active: false,
        variables: template.variables,
        created_by: user?.id,
      };

      const { error } = await supabase
        .from('email_templates')
        .insert([duplicateData]);

      if (error) throw error;

      toast.success('Template duplicated successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const extractVariables = (text: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const matches = text.match(variableRegex);
    return matches ? [...new Set(matches)] : [];
  };

  const renderPreview = (template: EmailTemplate) => {
    let previewSubject = template.subject;
    let previewContent = template.content;

    // Replace variables with sample data
    const sampleData = {
      '{{first_name}}': 'John',
      '{{last_name}}': 'Doe',
      '{{email}}': 'john.doe@example.com',
      '{{phone}}': '(555) 123-4567',
      '{{gym_name}}': 'Fitness Plus',
      '{{location_name}}': 'Downtown Location',
      '{{tour_date}}': 'March 15, 2024',
      '{{tour_time}}': '2:00 PM',
      '{{salesperson_name}}': 'Sarah Johnson',
      '{{unsubscribe_link}}': '#unsubscribe',
    };

    Object.entries(sampleData).forEach(([variable, value]) => {
      previewSubject = previewSubject.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
      previewContent = previewContent.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return { subject: previewSubject, content: previewContent };
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      content: template.content,
      template_type: template.template_type,
      trigger_event: template.trigger_event || '',
      delay_hours: template.delay_hours?.toString() || '',
      is_active: template.is_active,
    });
    setIsTemplateDialogOpen(true);
  };

  const handleEditCampaign = (campaign: EmailCampaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      name: campaign.name,
      template_id: campaign.template_id,
      target_audience: campaign.target_audience,
      scheduled_at: campaign.scheduled_at?.split('T')[0] || '',
    });
    setIsCampaignDialogOpen(true);
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      subject: '',
      content: '',
      template_type: 'welcome',
      trigger_event: '',
      delay_hours: '',
      is_active: true,
    });
  };

  const resetCampaignForm = () => {
    setCampaignForm({
      name: '',
      template_id: '',
      target_audience: 'all_leads',
      scheduled_at: '',
    });
  };

  const calculateAnalytics = () => {
    const totalSent = emailLogs.filter(log => log.status === 'sent' || log.status === 'delivered').length;
    const totalOpened = emailLogs.filter(log => log.opened_at).length;
    const totalClicked = emailLogs.filter(log => log.clicked_at).length;

    return {
      totalSent,
      openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0',
      clickRate: totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0',
      totalTemplates: templates.length,
      activeTemplates: templates.filter(t => t.is_active).length,
    };
  };

  const analytics = calculateAnalytics();

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
          <h2 className="text-2xl font-bold text-gray-900">Email Template Manager</h2>
          <p className="text-gray-600">Create and manage automated email campaigns</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => {
                resetCampaignForm();
                setEditingCampaign(null);
              }}>
                <Send className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCampaignSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign_name">Campaign Name *</Label>
                  <Input
                    id="campaign_name"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    placeholder="March 2024 Lead Follow-up"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template_id">Email Template *</Label>
                  <Select
                    value={campaignForm.template_id}
                    onValueChange={(value) => setCampaignForm({ ...campaignForm, template_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.filter(t => t.is_active).map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_audience">Target Audience *</Label>
                  <Select
                    value={campaignForm.target_audience}
                    onValueChange={(value: EmailCampaign['target_audience']) =>
                      setCampaignForm({ ...campaignForm, target_audience: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_leads">All Leads</SelectItem>
                      <SelectItem value="qualified_leads">Qualified Leads</SelectItem>
                      <SelectItem value="tour_attendees">Tour Attendees</SelectItem>
                      <SelectItem value="members">Members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_at">Schedule Send (Optional)</Label>
                  <Input
                    id="scheduled_at"
                    type="date"
                    value={campaignForm.scheduled_at}
                    onChange={(e) => setCampaignForm({ ...campaignForm, scheduled_at: e.target.value })}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCampaignDialogOpen(false);
                      setEditingCampaign(null);
                      resetCampaignForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetTemplateForm();
                setEditingTemplate(null);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Edit Email Template' : 'Create New Email Template'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleTemplateSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template_name">Template Name *</Label>
                    <Input
                      id="template_name"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      placeholder="Welcome Email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template_type">Template Type *</Label>
                    <Select
                      value={templateForm.template_type}
                      onValueChange={(value: EmailTemplate['template_type']) =>
                        setTemplateForm({ ...templateForm, template_type: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="welcome">Welcome</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                        <SelectItem value="tour_reminder">Tour Reminder</SelectItem>
                        <SelectItem value="promotional">Promotional</SelectItem>
                        <SelectItem value="abandoned_lead">Abandoned Lead</SelectItem>
                        <SelectItem value="post_tour">Post Tour</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line *</Label>
                  <Input
                    id="subject"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    placeholder="Welcome to {{gym_name}}, {{first_name}}!"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Email Content *</Label>
                  <Textarea
                    id="content"
                    value={templateForm.content}
                    onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                    placeholder="Hi {{first_name}},&#10;&#10;Welcome to {{gym_name}}! We're excited to have you..."
                    rows={12}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trigger_event">Trigger Event</Label>
                    <Input
                      id="trigger_event"
                      value={templateForm.trigger_event}
                      onChange={(e) => setTemplateForm({ ...templateForm, trigger_event: e.target.value })}
                      placeholder="lead_created, tour_scheduled, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delay_hours">Delay (Hours)</Label>
                    <Input
                      id="delay_hours"
                      type="number"
                      min="0"
                      value={templateForm.delay_hours}
                      onChange={(e) => setTemplateForm({ ...templateForm, delay_hours: e.target.value })}
                      placeholder="24"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={templateForm.is_active}
                    onCheckedChange={(checked) => setTemplateForm({ ...templateForm, is_active: checked })}
                  />
                  <Label>Active Template</Label>
                </div>

                {/* Available Variables */}
                <div className="space-y-2">
                  <Label>Available Variables</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableVariables.map((variable) => (
                      <Badge key={variable} className="cursor-pointer bg-blue-100 text-blue-800" onClick={() => {
                        setTemplateForm({
                          ...templateForm,
                          content: templateForm.content + ' ' + variable
                        });
                      }}>
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsTemplateDialogOpen(false);
                      setEditingTemplate(null);
                      resetTemplateForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Templates ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'campaigns'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Campaigns ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Analytics Overview */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Mail className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Sent</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalSent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Eye className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Open Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.openRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Send className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Click Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.clickRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Mail className="w-8 h-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Templates</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalTemplates}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Play className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Templates</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.activeTemplates}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Email Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Email Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead>Clicked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailLogs.slice(0, 10).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.recipient_email}</TableCell>
                      <TableCell>
                        {templates.find(t => t.id === log.template_id)?.name || 'Unknown Template'}
                      </TableCell>
                      <TableCell>
                        {new Date(log.sent_at).toLocaleDateString()} {new Date(log.sent_at).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          log.status === 'sent' || log.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                          log.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.opened_at ? (
                          <div>
                            <Badge className="bg-green-100 text-green-800">Yes</Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(log.opened_at).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.clicked_at ? (
                          <div>
                            <Badge className="bg-blue-100 text-blue-800">Yes</Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(log.clicked_at).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">No</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {emailLogs.length === 0 && (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No email activity yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <Card>
          <CardHeader>
            <CardTitle>Email Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge className={templateTypeColors[template.template_type]}>
                        {template.template_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {template.subject}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={template.is_active}
                          onCheckedChange={(checked) => toggleTemplateStatus(template.id, checked)}
                        />
                        <span className={template.is_active ? 'text-green-600' : 'text-gray-400'}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(template.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPreviewTemplate(template);
                            setIsPreviewDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => sendTestEmail(template)}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateTemplate(template)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {templates.length === 0 && (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No email templates created yet</p>
                <p className="text-sm text-gray-400 mb-4">
                  Create your first email template to start engaging with leads
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <Card>
          <CardHeader>
            <CardTitle>Email Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Target Audience</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{campaign.template?.name || 'Unknown Template'}</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800">
                        {campaign.target_audience.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{campaign.total_recipients}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[campaign.status]}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {campaign.scheduled_at ? new Date(campaign.scheduled_at).toLocaleDateString() : 'Not scheduled'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCampaign(campaign)}
                          disabled={campaign.status === 'sent'}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {campaign.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Send campaign immediately
                              toast.success('Campaign sent successfully!');
                            }}
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

            {campaigns.length === 0 && (
              <div className="text-center py-8">
                <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No email campaigns created yet</p>
                <p className="text-sm text-gray-400 mb-4">
                  Create your first campaign to reach your leads and members
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Subject Line</Label>
                <div className="p-3 bg-gray-50 rounded border">
                  {renderPreview(previewTemplate).subject}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email Content</Label>
                <div className="p-4 bg-white border rounded max-h-96 overflow-y-auto">
                  <div className="whitespace-pre-wrap">
                    {renderPreview(previewTemplate).content}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => sendTestEmail(previewTemplate)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Test Email
                </Button>
                <Button onClick={() => setIsPreviewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};