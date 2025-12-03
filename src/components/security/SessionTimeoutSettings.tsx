import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Clock,
  Timer,
  Save,
  RotateCcw,
  Shield,
  AlertTriangle,
  Info,
  Users,
  UserCog,
  User,
  GraduationCap,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/hooks/usePermissions';

export interface RoleTimeoutConfig {
  role: UserRole;
  timeoutMinutes: number;
  warningMinutes: number;
  enabled: boolean;
}

export interface SessionTimeoutConfig {
  enabled: boolean;
  roleTimeouts: RoleTimeoutConfig[];
  showWarningDialog: boolean;
  extendOnActivity: boolean;
  logoutOnClose: boolean;
}

const ROLE_LABELS: Record<UserRole, { label: string; description: string; icon: React.ComponentType<{ className?: string }> }> = {
  owner: {
    label: 'Owner',
    description: 'Full system access, longer session recommended',
    icon: Shield
  },
  manager: {
    label: 'Manager',
    description: 'Location and staff management access',
    icon: UserCog
  },
  staff: {
    label: 'Staff',
    description: 'Day-to-day operations access',
    icon: Users
  },
  trainer: {
    label: 'Trainer',
    description: 'Class and training management access',
    icon: GraduationCap
  },
  member: {
    label: 'Member',
    description: 'Self-service portal access',
    icon: UserCheck
  }
};

const DEFAULT_CONFIG: SessionTimeoutConfig = {
  enabled: true,
  roleTimeouts: [
    { role: 'owner', timeoutMinutes: 480, warningMinutes: 5, enabled: true },
    { role: 'manager', timeoutMinutes: 240, warningMinutes: 5, enabled: true },
    { role: 'staff', timeoutMinutes: 120, warningMinutes: 5, enabled: true },
    { role: 'trainer', timeoutMinutes: 180, warningMinutes: 5, enabled: true },
    { role: 'member', timeoutMinutes: 60, warningMinutes: 2, enabled: true },
  ],
  showWarningDialog: true,
  extendOnActivity: true,
  logoutOnClose: false,
};

const STORAGE_KEY = 'gym-unity-session-timeout-config';

export function getSessionTimeoutConfig(): SessionTimeoutConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading session timeout config:', error);
  }
  return DEFAULT_CONFIG;
}

export function saveSessionTimeoutConfig(config: SessionTimeoutConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving session timeout config:', error);
  }
}

export function getTimeoutForRole(role: UserRole): { timeoutMs: number; warningMs: number; enabled: boolean } {
  const config = getSessionTimeoutConfig();

  if (!config.enabled) {
    return { timeoutMs: 0, warningMs: 0, enabled: false };
  }

  const roleConfig = config.roleTimeouts.find(rt => rt.role === role);

  if (!roleConfig || !roleConfig.enabled) {
    return { timeoutMs: 0, warningMs: 0, enabled: false };
  }

  return {
    timeoutMs: roleConfig.timeoutMinutes * 60 * 1000,
    warningMs: roleConfig.warningMinutes * 60 * 1000,
    enabled: true
  };
}

interface SessionTimeoutSettingsProps {
  className?: string;
}

export default function SessionTimeoutSettings({ className }: SessionTimeoutSettingsProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<SessionTimeoutConfig>(DEFAULT_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load configuration on mount
  useEffect(() => {
    setConfig(getSessionTimeoutConfig());
  }, []);

  const updateConfig = (updates: Partial<SessionTimeoutConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateRoleTimeout = (role: UserRole, updates: Partial<RoleTimeoutConfig>) => {
    setConfig(prev => ({
      ...prev,
      roleTimeouts: prev.roleTimeouts.map(rt =>
        rt.role === role ? { ...rt, ...updates } : rt
      )
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);

    // Validate configuration
    const invalidTimeout = config.roleTimeouts.find(
      rt => rt.enabled && (rt.timeoutMinutes < 1 || rt.warningMinutes >= rt.timeoutMinutes)
    );

    if (invalidTimeout) {
      toast({
        title: 'Invalid Configuration',
        description: `${ROLE_LABELS[invalidTimeout.role].label}: Warning time must be less than timeout time.`,
        variant: 'destructive'
      });
      setIsSaving(false);
      return;
    }

    try {
      // Simulate async save (for future backend integration)
      await new Promise(resolve => setTimeout(resolve, 500));

      saveSessionTimeoutConfig(config);
      setHasChanges(false);

      toast({
        title: 'Settings Saved',
        description: 'Session timeout configuration has been updated. Changes will apply to new sessions.',
      });

      // Dispatch custom event to notify active session timeout hooks
      window.dispatchEvent(new CustomEvent('session-timeout-config-changed', { detail: config }));
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setHasChanges(true);
    toast({
      title: 'Settings Reset',
      description: 'Configuration reset to defaults. Click Save to apply.',
    });
  };

  const formatTimeout = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Timer className="w-6 h-6" />
            Session Timeout Settings
          </h2>
          <p className="text-muted-foreground">
            Configure automatic session timeouts by user role for enhanced security
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Click "Save Settings" to apply them.
          </AlertDescription>
        </Alert>
      )}

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Global Session Settings
          </CardTitle>
          <CardDescription>
            Configure global session timeout behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Session Timeouts */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label className="text-base font-medium">
                  Enable Session Timeouts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically log out inactive users after the configured time
                </p>
              </div>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => updateConfig({ enabled })}
            />
          </div>

          <Separator />

          {/* Show Warning Dialog */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <Label className="text-base font-medium">
                  Show Warning Before Logout
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display a warning dialog before the session expires
                </p>
              </div>
            </div>
            <Switch
              checked={config.showWarningDialog}
              onCheckedChange={(showWarningDialog) => updateConfig({ showWarningDialog })}
              disabled={!config.enabled}
            />
          </div>

          <Separator />

          {/* Extend on Activity */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">
                Extend Session on Activity
              </Label>
              <p className="text-sm text-muted-foreground">
                Reset the timeout timer when user interacts with the application
              </p>
            </div>
            <Switch
              checked={config.extendOnActivity}
              onCheckedChange={(extendOnActivity) => updateConfig({ extendOnActivity })}
              disabled={!config.enabled}
            />
          </div>

          <Separator />

          {/* Logout on Browser Close */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">
                Logout on Browser Close
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically log out when the browser window is closed
              </p>
            </div>
            <Switch
              checked={config.logoutOnClose}
              onCheckedChange={(logoutOnClose) => updateConfig({ logoutOnClose })}
              disabled={!config.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Role-based Timeout Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Role-Based Session Timeouts
          </CardTitle>
          <CardDescription>
            Configure different timeout durations for each user role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!config.enabled && (
            <Alert variant="default" className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Enable session timeouts in Global Settings to configure role-based timeouts.
              </AlertDescription>
            </Alert>
          )}

          {config.roleTimeouts.map((roleTimeout, index) => {
            const roleInfo = ROLE_LABELS[roleTimeout.role];
            const RoleIcon = roleInfo.icon;

            return (
              <div key={roleTimeout.role}>
                {index > 0 && <Separator className="my-4" />}
                <div className={cn(
                  'p-4 rounded-lg border',
                  !config.enabled && 'opacity-50'
                )}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <RoleIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-medium">
                            {roleInfo.label}
                          </Label>
                          {profile?.role === roleTimeout.role && (
                            <Badge variant="outline" className="text-xs">
                              Your Role
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {roleInfo.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={roleTimeout.enabled}
                      onCheckedChange={(enabled) => updateRoleTimeout(roleTimeout.role, { enabled })}
                      disabled={!config.enabled}
                    />
                  </div>

                  <div className={cn(
                    'grid grid-cols-2 gap-4',
                    (!config.enabled || !roleTimeout.enabled) && 'opacity-50 pointer-events-none'
                  )}>
                    <div className="space-y-2">
                      <Label htmlFor={`${roleTimeout.role}-timeout`}>
                        Session Timeout
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`${roleTimeout.role}-timeout`}
                          type="number"
                          min={1}
                          max={1440}
                          value={roleTimeout.timeoutMinutes}
                          onChange={(e) => updateRoleTimeout(
                            roleTimeout.role,
                            { timeoutMinutes: parseInt(e.target.value) || 60 }
                          )}
                          className="w-24"
                          disabled={!config.enabled || !roleTimeout.enabled}
                        />
                        <span className="text-sm text-muted-foreground">
                          minutes ({formatTimeout(roleTimeout.timeoutMinutes)})
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${roleTimeout.role}-warning`}>
                        Warning Before Logout
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`${roleTimeout.role}-warning`}
                          type="number"
                          min={1}
                          max={30}
                          value={roleTimeout.warningMinutes}
                          onChange={(e) => updateRoleTimeout(
                            roleTimeout.role,
                            { warningMinutes: parseInt(e.target.value) || 5 }
                          )}
                          className="w-24"
                          disabled={!config.enabled || !roleTimeout.enabled}
                        />
                        <span className="text-sm text-muted-foreground">
                          minutes before timeout
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="w-5 h-5 text-blue-500" />
            Session Timeout Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>
                <strong>Shorter timeouts</strong> for roles with access to sensitive data (billing, member info)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>
                <strong>Longer timeouts</strong> for administrative roles to prevent workflow interruption
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>
                <strong>Warning dialogs</strong> allow users to extend their session without losing work
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>
                <strong>PCI DSS compliance</strong> recommends 15-minute timeouts for payment processing terminals
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>
                <strong>HIPAA compliance</strong> recommends automatic logout after periods of inactivity
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
