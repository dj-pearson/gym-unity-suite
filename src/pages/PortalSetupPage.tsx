import React from 'react';
import { WhiteLabelSetupWizard } from '@/components/portal/WhiteLabelSetupWizard';
import { CustomDomainSetup } from '@/components/portal/CustomDomainSetup';
import { useAuth } from '@/contexts/AuthContext';
import { usePortalConfig } from '@/hooks/usePortalConfig';
import { usePortalTheme } from '@/hooks/usePortalTheme';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
  ExternalLink, Settings, CheckCircle, Globe, Palette,
  ToggleLeft, Users, Copy, ArrowUpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PortalSetupPage() {
  const { organization } = useAuth();
  const { config, isLoading } = usePortalConfig(organization?.id);
  const { theme } = usePortalTheme(organization?.id);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Show setup wizard for first-time setup
  if (!config?.setup_completed) {
    return (
      <div className="p-6">
        <WhiteLabelSetupWizard />
      </div>
    );
  }

  const portalUrl = config.portal_custom_domain && config.portal_domain_verified
    ? `https://${config.portal_custom_domain}`
    : config.portal_subdomain
      ? `https://${config.portal_subdomain}.repclub.app`
      : null;

  const enabledFeatures = theme?.features_enabled
    ? Object.entries(theme.features_enabled as Record<string, boolean>).filter(([, v]) => v).length
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Member Portal</h1>
          <p className="text-muted-foreground">
            Manage your white-label member portal
          </p>
        </div>
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1">
          <CheckCircle className="h-3 w-3" />
          Active
        </Badge>
      </div>

      {/* Portal URL Card */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Portal URL</p>
              {portalUrl && (
                <code className="text-lg font-mono text-primary">{portalUrl}</code>
              )}
              {config.portal_custom_domain && config.portal_domain_verified && config.portal_subdomain && (
                <p className="text-xs text-muted-foreground">
                  Also available at: {config.portal_subdomain}.repclub.app
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => {
                  if (portalUrl) {
                    navigator.clipboard.writeText(portalUrl);
                    toast({ title: 'Copied!', description: 'Portal URL copied to clipboard.' });
                  }
                }}
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
              <Button
                size="sm"
                className="gap-1"
                onClick={() => portalUrl && window.open(portalUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
                Visit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{config.portal_active_members}</p>
            <p className="text-xs text-muted-foreground">Active Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{config.portal_visits_total}</p>
            <p className="text-xs text-muted-foreground">Total Visits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{enabledFeatures}</p>
            <p className="text-xs text-muted-foreground">Features Enabled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold capitalize">{config.portal_tier}</p>
            <p className="text-xs text-muted-foreground">Current Tier</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="domain" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="domain" className="gap-1">
            <Globe className="h-3 w-3 hidden sm:block" />
            Domain
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-1">
            <Palette className="h-3 w-3 hidden sm:block" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-1">
            <ToggleLeft className="h-3 w-3 hidden sm:block" />
            Features
          </TabsTrigger>
          <TabsTrigger value="registration" className="gap-1">
            <Users className="h-3 w-3 hidden sm:block" />
            Registration
          </TabsTrigger>
        </TabsList>

        {/* Domain Tab */}
        <TabsContent value="domain" className="space-y-4">
          {/* Subdomain Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Subdomain</CardTitle>
              <CardDescription>
                Your default portal address on repclub.app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono bg-muted px-3 py-1.5 rounded">
                  https://{config.portal_subdomain}.repclub.app
                </code>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Custom Domain */}
          <CustomDomainSetup
            organizationId={organization?.id || ''}
            currentDomain={config.portal_custom_domain}
            isVerified={config.portal_domain_verified}
            verificationToken={config.portal_domain_verification_token}
            onDomainConfigured={() => {
              toast({
                title: 'Custom Domain Configured',
                description: 'Your portal is now accessible via your custom domain.',
              });
            }}
          />

          {/* Upgrade prompt for non-enterprise */}
          {config.portal_tier !== 'enterprise' && (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center space-y-3">
                <ArrowUpCircle className="h-8 w-8 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-semibold">Upgrade to Enterprise</p>
                  <p className="text-sm text-muted-foreground">
                    Custom domains, custom CSS, API access, and more.
                    Remove all Rep Club branding for a fully white-labeled experience.
                  </p>
                </div>
                <Button variant="outline" className="gap-2">
                  <ArrowUpCircle className="h-4 w-4" />
                  Upgrade Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Theme</CardTitle>
              <CardDescription>
                Your portal's visual identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {theme && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Primary Color</p>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-md border"
                          style={{ backgroundColor: `hsl(${theme.color_primary})` }}
                        />
                        <code className="text-xs">{theme.color_primary}</code>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Secondary Color</p>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-md border"
                          style={{ backgroundColor: `hsl(${theme.color_secondary})` }}
                        />
                        <code className="text-xs">{theme.color_secondary}</code>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Font</p>
                      <p>{theme.font_family_body || 'Inter'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Border Radius</p>
                      <p>{theme.border_radius || '0.5rem'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Button Style</p>
                      <p className="capitalize">{theme.button_style || 'Default'}</p>
                    </div>
                  </div>

                  {theme.logo_url && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Logo</p>
                        <img src={theme.logo_url} alt="Portal logo" className="h-10 w-auto" />
                      </div>
                    </>
                  )}
                </>
              )}

              <Button
                variant="outline"
                className="gap-2 w-full"
                onClick={() => navigate('/organization-settings')}
              >
                <Palette className="h-4 w-4" />
                Edit Branding in Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enabled Features</CardTitle>
              <CardDescription>
                Features your members can access in the portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {theme?.features_enabled && (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(theme.features_enabled as Record<string, boolean>).map(([key, enabled]) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 text-sm py-1"
                    >
                      {enabled ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                      )}
                      <span className={enabled ? '' : 'text-muted-foreground'}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Separator className="my-4" />

              <Button
                variant="outline"
                className="gap-2 w-full"
                onClick={() => navigate('/organization-settings')}
              >
                <ToggleLeft className="h-4 w-4" />
                Manage Features in Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Registration Tab */}
        <TabsContent value="registration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registration Settings</CardTitle>
              <CardDescription>
                How new members join your portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Self-Registration</span>
                  <Badge variant={config.allow_self_registration ? 'default' : 'secondary'}>
                    {config.allow_self_registration ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Require Admin Approval</span>
                  <Badge variant={config.require_approval ? 'default' : 'secondary'}>
                    {config.require_approval ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Welcome Message</span>
                  <Badge variant={config.welcome_enabled ? 'default' : 'secondary'}>
                    {config.welcome_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>

              {config.welcome_message && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Welcome Message Preview</p>
                    <p className="text-sm bg-muted rounded p-3">{config.welcome_message}</p>
                  </div>
                </>
              )}

              <Button
                variant="outline"
                className="gap-2 w-full"
                onClick={() => navigate('/organization-settings')}
              >
                <Settings className="h-4 w-4" />
                Edit Registration Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
