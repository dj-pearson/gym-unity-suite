import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { checkSubdomainAvailability } from '@/hooks/usePortalConfig';
import { cn } from '@/lib/utils';
import {
  Check, ArrowRight, ArrowLeft, Loader2, Globe, Palette,
  Upload, ToggleLeft, Eye, Sparkles, Rocket, ExternalLink,
  CheckCircle, XCircle, Building
} from 'lucide-react';

// Preset themes for quick start
const PRESET_THEMES = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, minimal, blue accents',
    primary: '221 83% 53%',
    secondary: '24 95% 53%',
    background: '0 0% 100%',
    surface: '0 0% 98%',
    radius: '0.5rem',
    buttonStyle: 'default',
  },
  {
    id: 'dark-gym',
    name: 'Dark Gym',
    description: 'Bold, dark, orange accents',
    primary: '24 95% 53%',
    secondary: '221 83% 53%',
    background: '220 13% 10%',
    surface: '220 13% 15%',
    radius: '0.25rem',
    buttonStyle: 'square',
  },
  {
    id: 'wellness',
    name: 'Wellness',
    description: 'Soft, warm, green accents',
    primary: '142 40% 45%',
    secondary: '38 50% 50%',
    background: '40 20% 98%',
    surface: '40 20% 94%',
    radius: '1rem',
    buttonStyle: 'rounded',
  },
  {
    id: 'urban',
    name: 'Urban',
    description: 'High contrast, neon accents',
    primary: '200 100% 50%',
    secondary: '280 100% 60%',
    background: '220 20% 8%',
    surface: '220 20% 12%',
    radius: '0.25rem',
    buttonStyle: 'default',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional, navy & gold',
    primary: '220 60% 30%',
    secondary: '42 80% 55%',
    background: '0 0% 100%',
    surface: '220 10% 96%',
    radius: '0.375rem',
    buttonStyle: 'default',
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Colorful, energetic, pink',
    primary: '330 80% 55%',
    secondary: '260 80% 60%',
    background: '0 0% 100%',
    surface: '330 10% 97%',
    radius: '0.75rem',
    buttonStyle: 'rounded',
  },
];

interface WizardState {
  // Step 1: Basics
  portalSubdomain: string;
  subdomainAvailable: boolean | null;
  subdomainChecking: boolean;
  // Step 2: Branding
  selectedPreset: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  // Step 3: Features
  featuresEnabled: Record<string, boolean>;
  // Step 4: Registration
  allowSelfRegistration: boolean;
  requireApproval: boolean;
  welcomeMessage: string;
  // Step 5: Domain (optional)
  useCustomDomain: boolean;
  customDomain: string;
}

const STEPS = [
  { id: 'basics', title: 'Portal Basics', icon: Globe, description: 'Choose your subdomain' },
  { id: 'branding', title: 'Branding', icon: Palette, description: 'Colors, logo, and theme' },
  { id: 'features', title: 'Features', icon: ToggleLeft, description: 'Enable member features' },
  { id: 'registration', title: 'Registration', icon: Building, description: 'Member signup settings' },
  { id: 'review', title: 'Review & Launch', icon: Rocket, description: 'Review and go live' },
];

const FEATURE_LIST = [
  { key: 'classes', label: 'Class Booking', description: 'Members can browse and book classes', starter: true },
  { key: 'check_in', label: 'Check-In Pass', description: 'QR code and digital member card', starter: true },
  { key: 'billing_self_service', label: 'Billing Self-Service', description: 'Members manage their subscription', starter: true },
  { key: 'workout_history', label: 'Workout History', description: 'Track check-ins, streaks, statistics', starter: false },
  { key: 'fitness_tracking', label: 'Fitness Tracking', description: 'Fitness assessments and progress', starter: false },
  { key: 'loyalty', label: 'Loyalty Points', description: 'Points, rewards, and tier system', starter: false },
  { key: 'referrals', label: 'Referral Program', description: 'Member referral tracking and rewards', starter: false },
  { key: 'push_notifications', label: 'Push Notifications', description: 'Browser push notifications', starter: false },
  { key: 'personal_training', label: 'Personal Training', description: 'Book PT sessions and programs', starter: false },
  { key: 'retail', label: 'Pro Shop', description: 'Browse and purchase merchandise', starter: false },
  { key: 'spa', label: 'Spa & Services', description: 'Book spa and wellness services', starter: false },
  { key: 'courts', label: 'Court Booking', description: 'Reserve courts and facilities', starter: false },
  { key: 'childcare', label: 'Childcare', description: 'Reserve childcare slots', starter: false },
];

export function WhiteLabelSetupWizard() {
  const { organization } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  const [state, setState] = useState<WizardState>({
    portalSubdomain: organization?.slug || '',
    subdomainAvailable: null,
    subdomainChecking: false,
    selectedPreset: 'modern',
    primaryColor: '#3b82f6',
    secondaryColor: '#f97316',
    logoUrl: organization?.logo_url || '',
    featuresEnabled: {
      classes: true,
      check_in: true,
      billing_self_service: true,
      loyalty: false,
      referrals: false,
      fitness_tracking: false,
      push_notifications: false,
      workout_history: false,
      personal_training: false,
      retail: false,
      spa: false,
      courts: false,
      childcare: false,
      community: false,
      custom_pages: false,
      api_access: false,
    },
    allowSelfRegistration: true,
    requireApproval: false,
    welcomeMessage: `Welcome to ${organization?.name || 'our gym'}! We're excited to have you as a member.`,
    useCustomDomain: false,
    customDomain: '',
  });

  const update = (partial: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...partial }));
  };

  // Check subdomain availability with debounce
  const checkSubdomain = useCallback(async (slug: string) => {
    if (!slug || slug.length < 3) {
      update({ subdomainAvailable: null, subdomainChecking: false });
      return;
    }

    update({ subdomainChecking: true });
    const available = await checkSubdomainAvailability(slug);
    update({ subdomainAvailable: available, subdomainChecking: false });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (state.portalSubdomain) {
        checkSubdomain(state.portalSubdomain);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [state.portalSubdomain, checkSubdomain]);

  const handlePresetSelect = (presetId: string) => {
    const preset = PRESET_THEMES.find(p => p.id === presetId);
    if (preset) {
      update({
        selectedPreset: presetId,
        primaryColor: hslToHex(preset.primary),
        secondaryColor: hslToHex(preset.secondary),
      });
    }
  };

  const handleSave = async () => {
    if (!organization) return;
    setSaving(true);

    try {
      const selectedPreset = PRESET_THEMES.find(p => p.id === state.selectedPreset);

      // 1. Upsert portal configuration
      const { error: configError } = await supabase
        .from('portal_configurations')
        .upsert({
          organization_id: organization.id,
          portal_enabled: true,
          portal_tier: 'starter',
          portal_subdomain: state.portalSubdomain.toLowerCase(),
          subdomain_verified: true,
          allow_self_registration: state.allowSelfRegistration,
          require_approval: state.requireApproval,
          welcome_message: state.welcomeMessage,
          welcome_enabled: true,
          setup_completed: true,
          setup_completed_at: new Date().toISOString(),
          setup_step: STEPS.length,
          portal_custom_domain: state.useCustomDomain ? state.customDomain : null,
        }, { onConflict: 'organization_id' });

      if (configError) throw configError;

      // 2. Upsert portal theme
      const { error: themeError } = await supabase
        .from('portal_themes')
        .upsert({
          organization_id: organization.id,
          color_primary: selectedPreset?.primary || hexToHsl(state.primaryColor),
          color_secondary: selectedPreset?.secondary || hexToHsl(state.secondaryColor),
          color_background: selectedPreset?.background || '0 0% 100%',
          color_surface: selectedPreset?.surface || '0 0% 98%',
          border_radius: selectedPreset?.radius || '0.5rem',
          button_style: selectedPreset?.buttonStyle || 'default',
          logo_url: state.logoUrl || organization.logo_url || null,
          show_powered_by: true,
          features_enabled: state.featuresEnabled,
          pwa_name: organization.name,
          pwa_short_name: organization.name?.substring(0, 12),
        }, { onConflict: 'organization_id' });

      if (themeError) throw themeError;

      // 3. Update organization with branding colors if changed
      await supabase
        .from('organizations')
        .update({
          primary_color: selectedPreset?.primary || hexToHsl(state.primaryColor),
          secondary_color: selectedPreset?.secondary || hexToHsl(state.secondaryColor),
          logo_url: state.logoUrl || organization.logo_url,
        })
        .eq('id', organization.id);

      setSetupComplete(true);
      toast({
        title: 'Portal Launched!',
        description: `Your member portal is live at ${state.portalSubdomain}.repclub.app`,
      });
    } catch (error: any) {
      toast({
        title: 'Setup Failed',
        description: error.message || 'Failed to save portal configuration.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const canProceed = () => {
    switch (currentStep) {
      case 0: return state.portalSubdomain.length >= 3 && state.subdomainAvailable !== false;
      case 1: return true;
      case 2: return true;
      case 3: return true;
      case 4: return true;
      default: return true;
    }
  };

  if (setupComplete) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center space-y-6 py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">Your Member Portal is Live!</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Members can now access your branded portal. Share the link with your members to get started.
          </p>

          <div className="bg-muted rounded-lg p-4 inline-block">
            <code className="text-lg font-mono">
              https://{state.portalSubdomain}.repclub.app
            </code>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => window.open(`https://${state.portalSubdomain}.repclub.app`, '_blank')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Visit Portal
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(`https://${state.portalSubdomain}.repclub.app`);
                toast({ title: 'Copied!', description: 'Portal URL copied to clipboard.' });
              }}
            >
              Copy Link
            </Button>
          </div>

          <Separator />

          <div className="text-left max-w-md mx-auto space-y-3">
            <h3 className="font-semibold">Next Steps:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                Share the portal link with your members
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                Customize your theme further in Organization Settings
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                Set up membership plans for member self-enrollment
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                Upgrade to Professional for loyalty, referrals, and advanced theming
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Set Up Your Member Portal</h1>
        <p className="text-muted-foreground">
          Get your branded member portal up and running in under 5 minutes
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <button
                key={step.id}
                onClick={() => index <= currentStep && setCurrentStep(index)}
                className={cn(
                  "flex flex-col items-center gap-1 text-xs transition-colors",
                  isCompleted && "text-primary cursor-pointer",
                  isCurrent && "text-primary font-medium",
                  !isCompleted && !isCurrent && "text-muted-foreground"
                )}
                disabled={index > currentStep}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                  isCompleted && "bg-primary border-primary text-white",
                  isCurrent && "border-primary text-primary",
                  !isCompleted && !isCurrent && "border-muted-foreground/30"
                )}>
                  {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className="hidden sm:block">{step.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basics */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="subdomain">Portal Subdomain</Label>
                <div className="flex items-center gap-0">
                  <Input
                    id="subdomain"
                    value={state.portalSubdomain}
                    onChange={(e) => update({
                      portalSubdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      subdomainAvailable: null,
                    })}
                    placeholder="your-gym"
                    className="rounded-r-none"
                  />
                  <div className="px-3 py-2 border border-l-0 rounded-r-md bg-muted text-muted-foreground text-sm whitespace-nowrap">
                    .repclub.app
                  </div>
                </div>

                {/* Availability indicator */}
                {state.subdomainChecking && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking availability...
                  </p>
                )}
                {state.subdomainAvailable === true && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {state.portalSubdomain}.repclub.app is available!
                  </p>
                )}
                {state.subdomainAvailable === false && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    This subdomain is not available. Try another.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  This is the URL your members will use to access their portal.
                  Use lowercase letters, numbers, and hyphens only.
                </p>
              </div>

              {/* Preview URL */}
              {state.portalSubdomain && state.subdomainAvailable !== false && (
                <div className="bg-muted rounded-lg p-4 space-y-1">
                  <p className="text-sm font-medium">Your members will access the portal at:</p>
                  <code className="text-primary font-mono">
                    https://{state.portalSubdomain}.repclub.app
                  </code>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Branding */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-3 block">Choose a Theme</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PRESET_THEMES.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset.id)}
                      className={cn(
                        "rounded-lg border-2 p-3 text-left transition-all hover:shadow-md",
                        state.selectedPreset === preset.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {/* Color preview */}
                      <div className="flex gap-1 mb-2">
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: `hsl(${preset.primary})` }}
                        />
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: `hsl(${preset.secondary})` }}
                        />
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: `hsl(${preset.background})` }}
                        />
                      </div>
                      <p className="text-sm font-medium">{preset.name}</p>
                      <p className="text-xs text-muted-foreground">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base font-semibold block">Custom Colors</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="primaryColor"
                        value={state.primaryColor}
                        onChange={(e) => update({ primaryColor: e.target.value, selectedPreset: 'custom' })}
                        className="w-10 h-10 rounded cursor-pointer border"
                      />
                      <Input
                        value={state.primaryColor}
                        onChange={(e) => update({ primaryColor: e.target.value, selectedPreset: 'custom' })}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="secondaryColor"
                        value={state.secondaryColor}
                        onChange={(e) => update({ secondaryColor: e.target.value, selectedPreset: 'custom' })}
                        className="w-10 h-10 rounded cursor-pointer border"
                      />
                      <Input
                        value={state.secondaryColor}
                        onChange={(e) => update({ secondaryColor: e.target.value, selectedPreset: 'custom' })}
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL (optional)</Label>
                <Input
                  id="logoUrl"
                  value={state.logoUrl}
                  onChange={(e) => update({ logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  Upload your logo to a file hosting service and paste the URL here.
                  Recommended: PNG or SVG, at least 200px wide.
                </p>
                {state.logoUrl && (
                  <div className="mt-2 p-4 border rounded-lg flex items-center justify-center bg-muted">
                    <img src={state.logoUrl} alt="Logo preview" className="max-h-16 w-auto" />
                  </div>
                )}
              </div>

              {/* Live preview mini */}
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preview</p>
                <div
                  className="rounded-lg border overflow-hidden"
                  style={{ backgroundColor: `hsl(${PRESET_THEMES.find(p => p.id === state.selectedPreset)?.background || '0 0% 100%'})` }}
                >
                  <div
                    className="h-12 flex items-center px-4"
                    style={{ backgroundColor: `hsl(${PRESET_THEMES.find(p => p.id === state.selectedPreset)?.primary || '221 83% 53%'})` }}
                  >
                    <span className="text-white font-semibold text-sm">
                      {organization?.name || 'Your Gym'}
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-muted-foreground/20" />
                    <div className="h-3 w-1/2 rounded bg-muted-foreground/10" />
                    <button
                      className="mt-2 px-4 py-1.5 rounded text-white text-xs font-medium"
                      style={{ backgroundColor: `hsl(${PRESET_THEMES.find(p => p.id === state.selectedPreset)?.secondary || '24 95% 53%'})` }}
                    >
                      Book Class
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Features */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose which features your members will have access to in the portal.
                You can change these at any time.
              </p>
              {FEATURE_LIST.map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center justify-between py-3 border-b last:border-b-0"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{feature.label}</span>
                      {feature.starter && (
                        <Badge variant="outline" className="text-[10px] h-5">Core</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                  <Switch
                    checked={state.featuresEnabled[feature.key]}
                    onCheckedChange={(checked) =>
                      update({
                        featuresEnabled: {
                          ...state.featuresEnabled,
                          [feature.key]: checked,
                        },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Registration */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Allow Member Self-Registration</Label>
                  <p className="text-xs text-muted-foreground">
                    Let new members sign up directly through the portal
                  </p>
                </div>
                <Switch
                  checked={state.allowSelfRegistration}
                  onCheckedChange={(checked) => update({ allowSelfRegistration: checked })}
                />
              </div>

              {state.allowSelfRegistration && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Require Admin Approval</Label>
                    <p className="text-xs text-muted-foreground">
                      New signups need your approval before they can access the portal
                    </p>
                  </div>
                  <Switch
                    checked={state.requireApproval}
                    onCheckedChange={(checked) => update({ requireApproval: checked })}
                  />
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <textarea
                  id="welcomeMessage"
                  value={state.welcomeMessage}
                  onChange={(e) => update({ welcomeMessage: e.target.value })}
                  placeholder="Welcome to our gym!"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background min-h-[100px] resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  This message is shown to new members when they first visit the portal.
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Review & Launch */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-muted rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Portal Configuration Summary</h3>

                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Portal URL</span>
                    <code className="text-primary">{state.portalSubdomain}.repclub.app</code>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Theme</span>
                    <span className="capitalize">
                      {PRESET_THEMES.find(p => p.id === state.selectedPreset)?.name || 'Custom'}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Features Enabled</span>
                    <span>
                      {Object.values(state.featuresEnabled).filter(Boolean).length} of {FEATURE_LIST.length}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Self-Registration</span>
                    <span>{state.allowSelfRegistration ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  {state.allowSelfRegistration && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Approval Required</span>
                        <span>{state.requireApproval ? 'Yes' : 'No'}</span>
                      </div>
                    </>
                  )}
                  {state.logoUrl && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Logo</span>
                        <img src={state.logoUrl} alt="Logo" className="h-8 w-auto" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm">Ready to Launch</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Clicking "Launch Portal" will activate your member portal. Your members
                  will be able to sign up and access features immediately. You can update
                  all settings at any time from Organization Settings.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!canProceed()}
            className="gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            disabled={saving || !canProceed()}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                Launch Portal
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// Utility: Convert HSL string to approximate hex (for color picker)
function hslToHex(hsl: string): string {
  const parts = hsl.split(' ').map(parseFloat);
  if (parts.length < 3) return '#3b82f6';

  const h = parts[0] / 360;
  const s = parts[1] / 100;
  const l = parts[2] / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Utility: Convert hex color to HSL string
function hexToHsl(hex: string): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
