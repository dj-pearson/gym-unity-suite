import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Mail, 
  Send, 
  Calendar, 
  Users, 
  BarChart3, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const SAMPLE_CAMPAIGNS = [
  {
    id: '1',
    name: 'New Member Welcome Series',
    subject: 'Welcome to RepClub! Your fitness journey starts now 💪',
    status: 'active',
    sent_count: 45,
    open_rate: 0.85,
    click_rate: 0.23,
    created_at: '2024-01-15T10:00:00Z',
    scheduled_at: null,
    segment: 'new_members'
  },
  {
    id: '2',
    name: 'Class Reminder Campaign',
    subject: 'Don\'t forget your yoga class tomorrow at 10 AM!',
    status: 'scheduled',
    sent_count: 0,
    open_rate: 0,
    click_rate: 0,
    created_at: '2024-01-20T14:30:00Z',
    scheduled_at: '2024-01-22T09:00:00Z',
    segment: 'active_members'
  },
  {
    id: '3',
    name: 'Member Retention Offer',
    subject: '🎯 Special offer just for you - Come back to RepClub',
    status: 'completed',
    sent_count: 23,
    open_rate: 0.67,
    click_rate: 0.15,
    created_at: '2024-01-10T16:45:00Z',
    scheduled_at: null,
    segment: 'at_risk_members'
  }
];

export default function EmailCampaignManager() {
  const [campaigns, setCampaigns] = useState(SAMPLE_CAMPAIGNS);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    content: '',
    segment: 'all_members',
    schedule_type: 'now'
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      case 'draft':
        return <Edit className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleCreateCampaign = () => {
    // In a real app, this would create the campaign via API
    console.log('Creating campaign:', newCampaign);
    setShowCreateDialog(false);
    setNewCampaign({
      name: '',
      subject: '',
      content: '',
      segment: 'all_members',
      schedule_type: 'now'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Email Campaigns</h2>
          <p className="text-muted-foreground">Create and manage targeted email campaigns</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-secondary hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Email Campaign</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Monthly Newsletter"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="segment">Target Segment</Label>
                  <Select value={newCampaign.segment} onValueChange={(value) => setNewCampaign({...newCampaign, segment: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select segment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_members">All Members</SelectItem>
                      <SelectItem value="new_members">New Members</SelectItem>
                      <SelectItem value="active_members">Active Members</SelectItem>
                      <SelectItem value="at_risk_members">At-Risk Members</SelectItem>
                      <SelectItem value="vip_members">VIP Members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  placeholder="Enter your email subject"
                  value={newCampaign.subject}
                  onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Email Content</Label>
                <Textarea
                  id="content"
                  rows={6}
                  placeholder="Write your email content here..."
                  value={newCampaign.content}
                  onChange={(e) => setNewCampaign({...newCampaign, content: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule</Label>
                <Select value={newCampaign.schedule_type} onValueChange={(value) => setNewCampaign({...newCampaign, schedule_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="When to send" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">Send Now</SelectItem>
                    <SelectItem value="schedule">Schedule for Later</SelectItem>
                    <SelectItem value="draft">Save as Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCampaign} className="bg-gradient-secondary hover:opacity-90">
                <Send className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-primary" />
              <div className="text-sm text-muted-foreground">Total Campaigns</div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {campaigns.length}
            </div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Send className="h-4 w-4 text-secondary" />
              <div className="text-sm text-muted-foreground">Emails Sent</div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {campaigns.reduce((sum, c) => sum + c.sent_count, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-accent" />
              <div className="text-sm text-muted-foreground">Avg Open Rate</div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {(campaigns.filter(c => c.sent_count > 0).reduce((sum, c) => sum + c.open_rate, 0) / campaigns.filter(c => c.sent_count > 0).length * 100 || 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-warning" />
              <div className="text-sm text-muted-foreground">Avg Click Rate</div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {(campaigns.filter(c => c.sent_count > 0).reduce((sum, c) => sum + c.click_rate, 0) / campaigns.filter(c => c.sent_count > 0).length * 100 || 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card className="gym-card">
        <CardHeader>
          <CardTitle>Email Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(campaign.status)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-foreground">{campaign.name}</h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{campaign.subject}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{campaign.sent_count} sent</span>
                      </span>
                      {campaign.sent_count > 0 && (
                        <>
                          <span>{(campaign.open_rate * 100).toFixed(1)}% open</span>
                          <span>{(campaign.click_rate * 100).toFixed(1)}% click</span>
                        </>
                      )}
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {campaign.scheduled_at 
                            ? `Scheduled for ${new Date(campaign.scheduled_at).toLocaleDateString()}`
                            : `Created ${new Date(campaign.created_at).toLocaleDateString()}`
                          }
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}