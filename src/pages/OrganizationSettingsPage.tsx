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
import { supabase, edgeFunctions } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Building, Users, CreditCard, Bell, Shield, Mail, Globe, Palette, Save, ExternalLink, Check, X, AlertTriangle, Copy } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  subscription_tier?: string;
  custom_domain?: string;
  custom_domain_verified?: boolean;
  domain_verification_token?: string;
  domain_ssl_enabled?: boolean;
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
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [showDNSInstructions, setShowDNSInstructions] = useState(false);

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
        // @ts-ignore - TypeScript types may not include all fields
        const org = orgData as any;
        setOrganization(orgData);
        setOrgForm({
          name: orgData.name || '',
          slug: orgData.slug || '',
          primary_color: orgData.primary_color || '#2563eb',
          secondary_color: orgData.secondary_color || '#f97316'
        });
        setCustomDomain(org.custom_domain || '');
        setShowDNSInstructions(!!org.custom_domain && !org.custom_domain_verified);
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

  const saveCustomDomain = async () => {
    try {
      setSaving(true);

      // Check if organization is on enterprise tier
      if (organization?.subscription_tier !== 'enterprise') {
        toast({
          title: "Enterprise Feature",
          description: "Custom domains are only available for enterprise tier organizations. Please upgrade your plan.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('organizations')
        .update({
          custom_domain: customDomain || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.user_metadata?.organization_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Custom domain saved. Please verify your DNS settings.",
      });

      setShowDNSInstructions(true);
      // Refresh the data to get verification token
      await fetchOrganizationData();
    } catch (error: any) {
      console.error('Error saving custom domain:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save custom domain",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const verifyCustomDomain = async () => {
    try {
      setVerifyingDomain(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await edgeFunctions.invoke('verify-custom-domain', {
        body: {
          organizationId: user?.user_metadata?.organization_id,
          domain: customDomain,
        },
      });

      if (response.error) throw response.error;

      const result = response.data;

      if (result.verified) {
        toast({
          title: "Domain Verified!",
          description: "Your custom domain has been successfully verified.",
        });
        setShowDNSInstructions(false);
        await fetchOrganizationData();
      } else {
        toast({
          title: "Verification Failed",
          description: result.message || "Please check your DNS records and try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error verifying custom domain:', error);
      toast({
        title: "Verification Error",
        description: error.message || "Failed to verify custom domain",
        variant: "destructive",
      });
    } finally {
      setVerifyingDomain(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="custom-domain">
                Custom Domain
                {organization?.subscription_tier === 'enterprise' && organization?.custom_domain_verified && (
                  <Check className="h-3 w-3 ml-1 text-green-500" />
                )}
              </TabsTrigger>
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

            <TabsContent value="custom-domain" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Custom Domain Settings</h3>
                  </div>
                  {organization?.subscription_tier === 'enterprise' && (
                    <Badge variant="default">Enterprise Feature</Badge>
                  )}
                </div>

                {organization?.subscription_tier !== 'enterprise' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-900">Enterprise Feature</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        Custom domains are only available for enterprise tier organizations. Upgrade your plan to use your own domain for your client portal and booking pages.
                      </p>
                      <Button variant="outline" className="mt-3" size="sm">
                        Upgrade to Enterprise
                      </Button>
                    </div>
                  </div>
                )}

                {organization?.subscription_tier === 'enterprise' && (
                  <>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="custom-domain">Custom Domain</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="custom-domain"
                            value={customDomain}
                            onChange={(e) => setCustomDomain(e.target.value)}
                            placeholder="portal.yourgym.com"
                            disabled={organization?.custom_domain_verified}
                          />
                          {organization?.custom_domain_verified ? (
                            <Badge variant="default" className="flex items-center space-x-1">
                              <Check className="h-3 w-3" />
                              <span>Verified</span>
                            </Badge>
                          ) : (
                            <Button onClick={saveCustomDomain} disabled={saving || !customDomain}>
                              <Save className="h-4 w-4 mr-2" />
                              {saving ? 'Saving...' : 'Save Domain'}
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter your custom domain (e.g., portal.yourgym.com)
                        </p>
                      </div>

                      {organization?.custom_domain && !organization?.custom_domain_verified && showDNSInstructions && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-medium text-blue-900">DNS Configuration Required</h4>
                              <p className="text-sm text-blue-700 mt-1">
                                Configure your DNS settings to verify domain ownership and enable your custom domain.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <h5 className="font-medium text-sm text-blue-900 mb-2">Step 1: Add TXT Record for Verification</h5>
                              <div className="bg-white border border-blue-200 rounded p-3 space-y-2">
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div>
                                    <span className="font-medium">Type:</span>
                                    <div className="font-mono mt-1">TXT</div>
                                  </div>
                                  <div>
                                    <span className="font-medium">Name:</span>
                                    <div className="font-mono mt-1">@</div>
                                  </div>
                                  <div>
                                    <span className="font-medium">Value:</span>
                                    <div className="flex items-center space-x-1 mt-1">
                                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                        {organization?.domain_verification_token || 'Generating...'}
                                      </code>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(organization?.domain_verification_token || '')}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h5 className="font-medium text-sm text-blue-900 mb-2">Step 2: Add CNAME Record to Point to Our Service</h5>
                              <div className="bg-white border border-blue-200 rounded p-3 space-y-2">
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div>
                                    <span className="font-medium">Type:</span>
                                    <div className="font-mono mt-1">CNAME</div>
                                  </div>
                                  <div>
                                    <span className="font-medium">Name:</span>
                                    <div className="font-mono mt-1">@</div>
                                  </div>
                                  <div>
                                    <span className="font-medium">Value:</span>
                                    <div className="flex items-center space-x-1 mt-1">
                                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                        gym-unity.app
                                      </code>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard('gym-unity.app')}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="pt-2">
                              <Button onClick={verifyCustomDomain} disabled={verifyingDomain}>
                                {verifyingDomain ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Verifying...
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Verify Domain
                                  </>
                                )}
                              </Button>
                              <p className="text-xs text-blue-700 mt-2">
                                DNS changes can take up to 24 hours to propagate. Click verify once your DNS records are configured.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {organization?.custom_domain_verified && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-medium text-green-900">Domain Verified Successfully!</h4>
                              <p className="text-sm text-green-700 mt-1">
                                Your custom domain <strong>{organization.custom_domain}</strong> is now active and serving your client portal.
                              </p>
                              <div className="mt-3">
                                <a
                                  href={`https://${organization.custom_domain}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-green-700 hover:text-green-900 flex items-center space-x-1"
                                >
                                  <span>Visit your custom domain</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-2">About Custom Domains</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Use your own domain for your member portal and booking pages</li>
                        <li>• Maintain consistent branding across all member touchpoints</li>
                        <li>• SSL certificates are automatically provisioned and managed</li>
                        <li>• Changes to DNS can take up to 24 hours to propagate</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}