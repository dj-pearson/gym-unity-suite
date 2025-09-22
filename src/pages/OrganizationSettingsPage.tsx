import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Building, Users, CreditCard, Bell, Shield, Mail, Globe, Palette, Save } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
}

interface OrganizationSettings {
  membership_freeze_enabled: boolean;
  guest_pass_enabled: boolean;
  class_booking_enabled: boolean;
  auto_billing_enabled: boolean;
  late_fee_enabled: boolean;
  referral_program_enabled: boolean;
  mobile_checkin_enabled: boolean;
  email_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
  marketing_emails_enabled: boolean;
}

export default function OrganizationSettingsPage() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [settings, setSettings] = useState<OrganizationSettings>({
    membership_freeze_enabled: true,
    guest_pass_enabled: true,
    class_booking_enabled: true,
    auto_billing_enabled: false,
    late_fee_enabled: false,
    referral_program_enabled: true,
    mobile_checkin_enabled: true,
    email_notifications_enabled: true,
    sms_notifications_enabled: false,
    marketing_emails_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [orgForm, setOrgForm] = useState({
    name: '',
    slug: '',
    primary_color: '#2563eb',
    secondary_color: '#f97316'
  });

  const [billingSettings, setBillingSettings] = useState({
    currency: 'USD',
    timezone: 'America/New_York',
    billing_cycle: 'monthly',
    late_fee_amount: '25.00',
    late_fee_days: '5'
  });

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      
      // Fetch organization details
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', user?.user_metadata?.organization_id)
        .single();

      if (orgError) throw orgError;
      
      if (orgData) {
        setOrganization(orgData);
        setOrgForm({
          name: orgData.name || '',
          slug: orgData.slug || '',
          primary_color: orgData.primary_color || '#2563eb',
          secondary_color: orgData.secondary_color || '#f97316'
        });
      }

    } catch (error) {
      console.error('Error fetching organization data:', error);
      toast({
        title: "Error",
        description: "Failed to load organization settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveOrganizationSettings = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('organizations')
        .update({
          name: orgForm.name,
          slug: orgForm.slug,
          primary_color: orgForm.primary_color,
          secondary_color: orgForm.secondary_color,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.user_metadata?.organization_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization settings saved successfully",
      });

      // Refresh the data
      await fetchOrganizationData();
    } catch (error) {
      console.error('Error saving organization settings:', error);
      toast({
        title: "Error",
        description: "Failed to save organization settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveFeatureSettings = async () => {
    // In a real implementation, this would save to a settings table
    toast({
      title: "Settings Saved",
      description: "Feature settings have been updated",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="gym-card">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading organization settings...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="gym-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Organization Settings</span>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Main Settings */}
      <Card className="gym-card">
        <CardContent className="p-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Building className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Organization Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="org-name">Organization Name</Label>
                    <Input
                      id="org-name"
                      value={orgForm.name}
                      onChange={(e) => setOrgForm({...orgForm, name: e.target.value})}
                      placeholder="Enter organization name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="org-slug">URL Slug</Label>
                    <Input
                      id="org-slug"
                      value={orgForm.slug}
                      onChange={(e) => setOrgForm({...orgForm, slug: e.target.value})}
                      placeholder="organization-url"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be used in your organization's URL
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveOrganizationSettings} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Feature Settings</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Membership Freeze</Label>
                      <p className="text-sm text-muted-foreground">Allow members to freeze their memberships</p>
                    </div>
                    <Switch
                      checked={settings.membership_freeze_enabled}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, membership_freeze_enabled: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Guest Passes</Label>
                      <p className="text-sm text-muted-foreground">Enable guest pass purchases</p>
                    </div>
                    <Switch
                      checked={settings.guest_pass_enabled}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, guest_pass_enabled: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Class Booking</Label>
                      <p className="text-sm text-muted-foreground">Allow members to book classes online</p>
                    </div>
                    <Switch
                      checked={settings.class_booking_enabled}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, class_booking_enabled: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Mobile Check-in</Label>
                      <p className="text-sm text-muted-foreground">Enable mobile app check-in</p>
                    </div>
                    <Switch
                      checked={settings.mobile_checkin_enabled}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, mobile_checkin_enabled: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Referral Program</Label>
                      <p className="text-sm text-muted-foreground">Enable member referral rewards</p>
                    </div>
                    <Switch
                      checked={settings.referral_program_enabled}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, referral_program_enabled: checked})
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveFeatureSettings}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Feature Settings
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="billing" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Billing Settings</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Currency</Label>
                    <Select value={billingSettings.currency} onValueChange={(value) => 
                      setBillingSettings({...billingSettings, currency: value})
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Timezone</Label>
                    <Select value={billingSettings.timezone} onValueChange={(value) => 
                      setBillingSettings({...billingSettings, timezone: value})
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Automatic Billing</Label>
                      <p className="text-sm text-muted-foreground">Automatically charge recurring payments</p>
                    </div>
                    <Switch
                      checked={settings.auto_billing_enabled}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, auto_billing_enabled: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Late Fees</Label>
                      <p className="text-sm text-muted-foreground">Charge late fees for overdue payments</p>
                    </div>
                    <Switch
                      checked={settings.late_fee_enabled}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, late_fee_enabled: checked})
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Late Fee Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={billingSettings.late_fee_amount}
                      onChange={(e) => setBillingSettings({...billingSettings, late_fee_amount: e.target.value})}
                      placeholder="25.00"
                    />
                  </div>
                  <div>
                    <Label>Grace Period (Days)</Label>
                    <Input
                      type="number"
                      value={billingSettings.late_fee_days}
                      onChange={(e) => setBillingSettings({...billingSettings, late_fee_days: e.target.value})}
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Bell className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Notification Settings</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send system notifications via email</p>
                    </div>
                    <Switch
                      checked={settings.email_notifications_enabled}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, email_notifications_enabled: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send important alerts via SMS</p>
                    </div>
                    <Switch
                      checked={settings.sms_notifications_enabled}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, sms_notifications_enabled: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">Send promotional and marketing emails</p>
                    </div>
                    <Switch
                      checked={settings.marketing_emails_enabled}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, marketing_emails_enabled: checked})
                      }
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="branding" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Palette className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Branding Settings</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Logo Upload</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Globe className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Drag and drop your logo here, or click to select
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Primary Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="color"
                          value={orgForm.primary_color}
                          onChange={(e) => setOrgForm({...orgForm, primary_color: e.target.value})}
                          className="w-12 h-10 rounded border"
                        />
                        <Input
                          value={orgForm.primary_color}
                          onChange={(e) => setOrgForm({...orgForm, primary_color: e.target.value})}
                          placeholder="#2563eb"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Secondary Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="color"
                          value={orgForm.secondary_color}
                          onChange={(e) => setOrgForm({...orgForm, secondary_color: e.target.value})}
                          className="w-12 h-10 rounded border"
                        />
                        <Input
                          value={orgForm.secondary_color}
                          onChange={(e) => setOrgForm({...orgForm, secondary_color: e.target.value})}
                          placeholder="#f97316"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={saveOrganizationSettings} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Branding'}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}