import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Mail,
  MessageSquare,
  Users,
  TrendingUp,
  Gift,
  Star,
  Calendar,
  Send,
  Plus,
  Settings,
  BarChart3,
  Target,
  Heart,
  Award
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EmailCampaignManager from '@/components/marketing/EmailCampaignManager';
import SMSCampaignManager from '@/components/marketing/SMSCampaignManager';
import LoyaltyProgramsManager from '@/components/marketing/LoyaltyProgramsManager';
import RetentionCampaignsManager from '@/components/marketing/RetentionCampaignsManager';
import ReferralProgramsManager from '@/components/marketing/ReferralProgramsManager';
import MemberFeedbackManager from '@/components/marketing/MemberFeedbackManager';
import { usePermissions } from '@/hooks/usePermissions';

interface CampaignStats {
  total_campaigns: number;
  active_campaigns: number;
  total_sends: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
}

export default function MarketingPage() {
  const { profile } = useAuth();
  const { hasPermission, PERMISSIONS } = usePermissions();
  const { toast } = useToast();
  const [stats, setStats] = useState<CampaignStats>({
    total_campaigns: 0,
    active_campaigns: 0,
    total_sends: 0,
    open_rate: 0,
    click_rate: 0,
    conversion_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (hasPermission(PERMISSIONS.VIEW_REPORTS)) {
      fetchMarketingStats();
    }
  }, [profile?.organization_id]); // Removed hasPermission from dependencies

  const fetchMarketingStats = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);

      // Fetch marketing analytics data
      const { data: analyticsData, error } = await supabase
        .from('marketing_analytics')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .gte('period_start', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching marketing stats:', error);
      }

      // Calculate aggregate stats
      const totalCampaigns = analyticsData?.length || 0;
      const activeCampaigns = analyticsData?.filter(a => a.period_end >= new Date().toISOString().split('T')[0]).length || 0;
      const totalSends = analyticsData?.reduce((sum, a) => sum + (a.impressions || 0), 0) || 0;
      const avgOpenRate = analyticsData?.length ? 
        analyticsData.reduce((sum, a) => sum + (a.click_through_rate || 0), 0) / analyticsData.length : 0;
      const avgClickRate = analyticsData?.length ? 
        analyticsData.reduce((sum, a) => sum + (a.click_through_rate || 0), 0) / analyticsData.length * 0.7 : 0;
      const avgConversionRate = analyticsData?.length ? 
        analyticsData.reduce((sum, a) => sum + (a.conversion_rate || 0), 0) / analyticsData.length : 0;

      setStats({
        total_campaigns: totalCampaigns,
        active_campaigns: activeCampaigns,
        total_sends: totalSends,
        open_rate: avgOpenRate,
        click_rate: avgClickRate,
        conversion_rate: avgConversionRate,
      });
    } catch (error) {
      console.error('Error fetching marketing stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const canManageMarketing = hasPermission(PERMISSIONS.VIEW_REPORTS);

  if (!canManageMarketing) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Mail className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to view marketing tools.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Marketing & Retention</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading marketing data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gradient-secondary rounded-lg">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Marketing & Retention</h1>
            <p className="text-muted-foreground">
              Engage members and drive retention through targeted campaigns
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            className="bg-gradient-secondary hover:opacity-90"
            onClick={() => setActiveTab('email')}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">
              {stats.total_campaigns}
            </div>
            <div className="text-sm text-muted-foreground">Total Campaigns</div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {stats.active_campaigns}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-secondary">
              {stats.total_sends.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Sends</div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-accent">
              {(stats.open_rate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Open Rate</div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">
              {(stats.click_rate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Click Rate</div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">
              {(stats.conversion_rate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Conversion</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="gym-card hover:shadow-elevation-2 cursor-pointer">
              <CardContent className="p-6 text-center">
                <Mail className="mx-auto h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Email Campaign</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Send targeted emails to member segments
                </p>
                <Button size="sm" onClick={() => setActiveTab('email')}>Create Email</Button>
              </CardContent>
            </Card>

            <Card className="gym-card hover:shadow-elevation-2 cursor-pointer">
              <CardContent className="p-6 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-secondary mb-3" />
                <h3 className="font-semibold text-foreground mb-2">SMS Campaign</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Send SMS reminders and promotions
                </p>
                <Button size="sm" variant="outline" onClick={() => setActiveTab('sms')}>Create SMS</Button>
              </CardContent>
            </Card>

            <Card className="gym-card hover:shadow-elevation-2 cursor-pointer">
              <CardContent className="p-6 text-center">
                <Gift className="mx-auto h-8 w-8 text-accent mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Loyalty Program</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Reward members for engagement
                </p>
                <Button size="sm" variant="outline" onClick={() => setActiveTab('loyalty')}>Manage Rewards</Button>
              </CardContent>
            </Card>

            <Card className="gym-card hover:shadow-elevation-2 cursor-pointer">
              <CardContent className="p-6 text-center">
                <Heart className="mx-auto h-8 w-8 text-warning mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Retention</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Win back at-risk members
                </p>
                <Button size="sm" variant="outline" onClick={() => setActiveTab('retention')}>View Campaigns</Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="gym-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Campaign Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">New Member Welcome Series</span>
                    </div>
                    <Badge variant="outline">85% Open Rate</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-secondary rounded-full"></div>
                      <span className="text-sm">Class Reminder SMS</span>
                    </div>
                    <Badge variant="outline">92% Delivery</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <span className="text-sm">Member Retention Campaign</span>
                    </div>
                    <Badge variant="outline">23% Response</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-warning rounded-full"></div>
                      <span className="text-sm">Referral Program Launch</span>
                    </div>
                    <Badge variant="outline">15 Referrals</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gym-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Member Segments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm">New Members (0-30 days)</span>
                    </div>
                    <span className="text-sm font-semibold">42 members</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Star className="h-4 w-4 text-secondary" />
                      <span className="text-sm">Active Members</span>
                    </div>
                    <span className="text-sm font-semibold">284 members</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Heart className="h-4 w-4 text-warning" />
                      <span className="text-sm">At-Risk Members</span>
                    </div>
                    <span className="text-sm font-semibold">18 members</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Award className="h-4 w-4 text-accent" />
                      <span className="text-sm">VIP Members</span>
                    </div>
                    <span className="text-sm font-semibold">67 members</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="email">
          <EmailCampaignManager />
        </TabsContent>

        <TabsContent value="sms">
          <SMSCampaignManager />
        </TabsContent>

        <TabsContent value="loyalty">
          <LoyaltyProgramsManager />
        </TabsContent>

        <TabsContent value="retention">
          <RetentionCampaignsManager />
        </TabsContent>

        <TabsContent value="referrals">
          <ReferralProgramsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}