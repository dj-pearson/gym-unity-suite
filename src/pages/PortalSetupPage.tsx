import React from 'react';
import { WhiteLabelSetupWizard } from '@/components/portal/WhiteLabelSetupWizard';
import { useAuth } from '@/contexts/AuthContext';
import { usePortalConfig } from '@/hooks/usePortalConfig';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Settings, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PortalSetupPage() {
  const { organization } = useAuth();
  const { config, isLoading } = usePortalConfig(organization?.id);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // If portal is already set up, show status page
  if (config?.setup_completed) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 p-6">
        <Card>
          <CardContent className="text-center space-y-4 py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <h2 className="text-2xl font-bold">Member Portal Active</h2>
            <p className="text-muted-foreground">
              Your member portal is live and accessible to your members.
            </p>

            <div className="bg-muted rounded-lg p-4 inline-block">
              <code className="text-lg font-mono text-primary">
                https://{config.portal_subdomain}.repclub.app
              </code>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                onClick={() => window.open(`https://${config.portal_subdomain}.repclub.app`, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Visit Portal
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/settings')}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Edit Settings
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 text-center">
              <div>
                <p className="text-2xl font-bold">{config.portal_active_members}</p>
                <p className="text-xs text-muted-foreground">Active Members</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{config.portal_visits_total}</p>
                <p className="text-xs text-muted-foreground">Total Visits</p>
              </div>
              <div>
                <p className="text-2xl font-bold capitalize">{config.portal_tier}</p>
                <p className="text-xs text-muted-foreground">Current Tier</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show setup wizard for first-time setup
  return (
    <div className="p-6">
      <WhiteLabelSetupWizard />
    </div>
  );
}
