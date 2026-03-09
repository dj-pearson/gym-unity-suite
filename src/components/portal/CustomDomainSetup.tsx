import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { supabase, edgeFunctions } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Globe, CheckCircle, XCircle, Loader2, Copy, ExternalLink,
  AlertTriangle, ArrowRight, Shield, Server, RefreshCw, Info
} from 'lucide-react';

interface CustomDomainSetupProps {
  organizationId: string;
  currentDomain?: string | null;
  isVerified?: boolean;
  verificationToken?: string | null;
  onDomainConfigured?: () => void;
}

type SetupStep = 'enter' | 'dns' | 'verify' | 'complete';

interface DnsVerificationResult {
  txtVerified: boolean;
  cnameVerified: boolean;
  txtRecords: string[];
  cnameRecords: string[];
}

export function CustomDomainSetup({
  organizationId,
  currentDomain,
  isVerified,
  verificationToken: existingToken,
  onDomainConfigured,
}: CustomDomainSetupProps) {
  const { organization } = useAuth();
  const [step, setStep] = useState<SetupStep>(
    isVerified ? 'complete' : currentDomain ? 'dns' : 'enter'
  );
  const [domain, setDomain] = useState(currentDomain || '');
  const [verificationToken, setVerificationToken] = useState(existingToken || '');
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verificationResult, setVerificationResult] = useState<DnsVerificationResult | null>(null);

  // Step 1: Enter and save custom domain
  const handleSaveDomain = async () => {
    if (!domain.trim()) return;

    // Basic domain validation
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      toast({
        title: 'Invalid Domain',
        description: 'Please enter a valid domain name (e.g., members.yourgym.com)',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Generate a verification token
      const token = `repclub-verify-${crypto.randomUUID().split('-')[0]}`;

      // Save to organizations table
      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          custom_domain: domain.toLowerCase(),
          custom_domain_verified: false,
          domain_verification_token: token,
        })
        .eq('id', organizationId);

      if (orgError) throw orgError;

      // Also save to portal_configurations
      const { error: portalError } = await supabase
        .from('portal_configurations')
        .update({
          portal_custom_domain: domain.toLowerCase(),
          portal_domain_verified: false,
          portal_domain_verification_token: token,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId);

      if (portalError) {
        console.warn('Portal config update failed (may not exist yet):', portalError);
      }

      setVerificationToken(token);
      setStep('dns');

      toast({
        title: 'Domain Saved',
        description: 'Now configure your DNS records to verify ownership.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save domain.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Step 2: Verify DNS records
  const handleVerifyDomain = async () => {
    setVerifying(true);
    setVerificationResult(null);

    try {
      const { data, error } = await edgeFunctions.invoke('verify-custom-domain', {
        body: {
          organizationId,
          domain: domain.toLowerCase(),
        },
      });

      if (error) throw error;

      if (data?.verified) {
        setVerificationResult({
          txtVerified: data.details?.txtVerified || false,
          cnameVerified: data.details?.cnameVerified || false,
          txtRecords: data.details?.txtRecords || [],
          cnameRecords: data.details?.cnameRecords || [],
        });

        // Also update portal_configurations
        await supabase
          .from('portal_configurations')
          .update({
            portal_domain_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', organizationId);

        setStep('complete');
        toast({
          title: 'Domain Verified!',
          description: `${domain} is now connected to your member portal.`,
        });
        onDomainConfigured?.();
      } else {
        setVerificationResult(data?.details || null);
        toast({
          title: 'Verification Failed',
          description: 'DNS records not found yet. It may take up to 48 hours for DNS changes to propagate.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Verification Error',
        description: error.message || 'Failed to verify domain.',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  // Remove custom domain
  const handleRemoveDomain = async () => {
    setSaving(true);
    try {
      await supabase
        .from('organizations')
        .update({
          custom_domain: null,
          custom_domain_verified: false,
          domain_verification_token: null,
        })
        .eq('id', organizationId);

      await supabase
        .from('portal_configurations')
        .update({
          portal_custom_domain: null,
          portal_domain_verified: false,
          portal_domain_verification_token: null,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId);

      setDomain('');
      setVerificationToken('');
      setVerificationResult(null);
      setStep('enter');

      toast({ title: 'Domain Removed', description: 'Custom domain has been disconnected.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${label} copied to clipboard.` });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Custom Domain
            </CardTitle>
            <CardDescription>
              Connect your own domain for a fully white-labeled member portal
            </CardDescription>
          </div>
          {step === 'complete' && (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Step: Enter Domain */}
        {step === 'enter' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-domain">Domain Name</Label>
              <Input
                id="custom-domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value.toLowerCase().replace(/\s/g, ''))}
                placeholder="members.yourgym.com"
              />
              <p className="text-xs text-muted-foreground">
                Enter the domain you want to use for your member portal.
                We recommend using a subdomain like <code>members.yourgym.com</code> or <code>portal.yourgym.com</code>.
              </p>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You'll need access to your domain's DNS settings to complete the setup.
                This is typically managed through your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.).
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleSaveDomain}
              disabled={!domain.trim() || saving}
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Continue to DNS Setup
            </Button>
          </div>
        )}

        {/* Step: DNS Configuration */}
        {step === 'dns' && (
          <div className="space-y-6">
            <Alert>
              <Server className="h-4 w-4" />
              <AlertDescription>
                Configure the following DNS records with your domain registrar to connect <strong>{domain}</strong> to your member portal.
              </AlertDescription>
            </Alert>

            {/* Option A: CNAME Record */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Badge variant="outline">Option A</Badge>
                CNAME Record (Recommended)
              </h3>
              <div className="bg-muted rounded-lg p-4 space-y-3 font-mono text-sm">
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <span className="text-muted-foreground">Type:</span>
                  <span>CNAME</span>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <span className="text-muted-foreground">Name:</span>
                  <div className="flex items-center gap-2">
                    <span>{domain.split('.')[0]}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(domain.split('.')[0], 'Name')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <span className="text-muted-foreground">Value:</span>
                  <div className="flex items-center gap-2">
                    <span>portal.repclub.app</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard('portal.repclub.app', 'CNAME value')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <span className="text-muted-foreground">TTL:</span>
                  <span>Auto (or 3600)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground uppercase">and</span>
              <Separator className="flex-1" />
            </div>

            {/* TXT Verification Record */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                TXT Verification Record (Required)
              </h3>
              <div className="bg-muted rounded-lg p-4 space-y-3 font-mono text-sm">
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <span className="text-muted-foreground">Type:</span>
                  <span>TXT</span>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <span className="text-muted-foreground">Name:</span>
                  <div className="flex items-center gap-2">
                    <span>{domain.split('.')[0]}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(domain.split('.')[0], 'Name')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <span className="text-muted-foreground">Value:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="break-all">{verificationToken}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 flex-shrink-0"
                      onClick={() => copyToClipboard(verificationToken, 'Verification token')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                DNS changes can take up to 48 hours to propagate, but typically happen within 5-30 minutes.
                You can safely close this page and come back to verify later.
              </AlertDescription>
            </Alert>

            {/* Verification status */}
            {verificationResult && !verificationResult.txtVerified && !verificationResult.cnameVerified && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p>DNS records not found yet. Please double-check your settings:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {verificationResult.txtRecords.length === 0 && (
                      <li>No TXT records found for {domain}</li>
                    )}
                    {verificationResult.txtRecords.length > 0 && (
                      <li>TXT records found but none match: {verificationResult.txtRecords.join(', ')}</li>
                    )}
                    {verificationResult.cnameRecords.length === 0 && (
                      <li>No CNAME record found for {domain}</li>
                    )}
                    {verificationResult.cnameRecords.length > 0 && (
                      <li>CNAME points to: {verificationResult.cnameRecords.join(', ')} (should be portal.repclub.app)</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-3">
              <Button
                onClick={handleVerifyDomain}
                disabled={verifying}
                className="gap-2"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Verify DNS Records
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStep('enter');
                  setVerificationResult(null);
                }}
              >
                Change Domain
              </Button>
            </div>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800 dark:text-green-400">Domain Connected</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your member portal is accessible at:
              </p>
              <div className="bg-white dark:bg-background rounded p-3">
                <code className="text-primary font-mono text-lg">https://{domain}</code>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>Members can now access the portal at your custom domain. The portal will display your full branding with no Rep Club references.</p>
              <p>SSL certificate is automatically provisioned via Cloudflare.</p>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.open(`https://${domain}`, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Visit Portal
              </Button>
              <Button
                variant="ghost"
                onClick={handleRemoveDomain}
                disabled={saving}
                className="text-destructive hover:text-destructive"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remove Domain'}
              </Button>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
