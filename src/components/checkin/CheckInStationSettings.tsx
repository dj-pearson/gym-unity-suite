import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Keyboard,
  Camera,
  Nfc,
  QrCode,
  Volume2,
  VolumeX,
  Bell,
  Monitor,
  Smartphone,
  Save,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isNfcSupported, getNfcSupportMessage } from '@/hooks/useNfcReader';
import { cn } from '@/lib/utils';

export interface CheckInStationConfig {
  // Input Methods
  enableUsbScanner: boolean;
  enableCameraScanner: boolean;
  enableNfcReader: boolean;
  enableManualSearch: boolean;

  // Scanner Settings
  scannerMinLength: number;
  scannerMaxKeystrokeDelay: number;
  validBarcodePattern: string;

  // Camera Settings
  preferredCamera: 'environment' | 'user';
  cameraScanFps: number;

  // Audio/Visual Feedback
  enableSoundEffects: boolean;
  enableSuccessAnimation: boolean;
  successSoundUrl?: string;
  errorSoundUrl?: string;

  // Auto Check-in
  autoCheckInOnScan: boolean;
  requireLocationSelection: boolean;

  // Display Settings
  showMemberPhoto: boolean;
  showMembershipStatus: boolean;
  showLastVisit: boolean;
  idleTimeoutSeconds: number;
}

const defaultConfig: CheckInStationConfig = {
  enableUsbScanner: true,
  enableCameraScanner: true,
  enableNfcReader: true,
  enableManualSearch: true,
  scannerMinLength: 8,
  scannerMaxKeystrokeDelay: 50,
  validBarcodePattern: '^\\d{12}$|^[A-Z0-9]{8,16}$',
  preferredCamera: 'environment',
  cameraScanFps: 10,
  enableSoundEffects: true,
  enableSuccessAnimation: true,
  autoCheckInOnScan: true,
  requireLocationSelection: true,
  showMemberPhoto: true,
  showMembershipStatus: true,
  showLastVisit: true,
  idleTimeoutSeconds: 30,
};

interface CheckInStationSettingsProps {
  /** Current configuration */
  config?: Partial<CheckInStationConfig>;
  /** Callback when configuration changes */
  onChange?: (config: CheckInStationConfig) => void;
  /** Callback when configuration is saved */
  onSave?: (config: CheckInStationConfig) => Promise<void>;
  /** Whether settings are being saved */
  isSaving?: boolean;
  /** Custom class name */
  className?: string;
}

export function CheckInStationSettings({
  config: initialConfig,
  onChange,
  onSave,
  isSaving = false,
  className,
}: CheckInStationSettingsProps) {
  const { organization } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<CheckInStationConfig>({
    ...defaultConfig,
    ...initialConfig,
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Check device capabilities
  const nfcSupported = isNfcSupported();
  const cameraSupported = typeof navigator !== 'undefined' && 'mediaDevices' in navigator;

  // Update config helper
  const updateConfig = <K extends keyof CheckInStationConfig>(
    key: K,
    value: CheckInStationConfig[K]
  ) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    setHasChanges(true);
    onChange?.(newConfig);
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setConfig(defaultConfig);
    setHasChanges(true);
    onChange?.(defaultConfig);
    toast({
      title: 'Settings Reset',
      description: 'All settings have been reset to defaults',
    });
  };

  // Save configuration
  const handleSave = async () => {
    try {
      await onSave?.(config);
      setHasChanges(false);
      toast({
        title: 'Settings Saved',
        description: 'Check-in station settings have been saved',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Check-In Station Settings
          </h2>
          <p className="text-muted-foreground">
            Configure how members check in at this location
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={resetToDefaults}
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

      {/* Input Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Check-In Methods
          </CardTitle>
          <CardDescription>
            Enable or disable different ways members can check in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* USB Scanner */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Keyboard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="usb-scanner" className="text-base font-medium">
                  USB Barcode Scanner
                </Label>
                <p className="text-sm text-muted-foreground">
                  Detect barcodes from USB/Bluetooth scanners
                </p>
              </div>
            </div>
            <Switch
              id="usb-scanner"
              checked={config.enableUsbScanner}
              onCheckedChange={(checked) => updateConfig('enableUsbScanner', checked)}
            />
          </div>

          <Separator />

          {/* Camera Scanner */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Camera className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="camera-scanner" className="text-base font-medium">
                  Camera Scanner
                </Label>
                <p className="text-sm text-muted-foreground">
                  Scan QR codes and barcodes using device camera
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!cameraSupported && (
                <Badge variant="secondary">Not Available</Badge>
              )}
              <Switch
                id="camera-scanner"
                checked={config.enableCameraScanner}
                onCheckedChange={(checked) => updateConfig('enableCameraScanner', checked)}
                disabled={!cameraSupported}
              />
            </div>
          </div>

          <Separator />

          {/* NFC Reader */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Nfc className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="nfc-reader" className="text-base font-medium">
                  NFC / Contactless
                </Label>
                <p className="text-sm text-muted-foreground">
                  Read NFC cards and Apple/Google Wallet passes
                </p>
                {!nfcSupported && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    {getNfcSupportMessage()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!nfcSupported && (
                <Badge variant="secondary">Limited</Badge>
              )}
              <Switch
                id="nfc-reader"
                checked={config.enableNfcReader}
                onCheckedChange={(checked) => updateConfig('enableNfcReader', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Manual Search */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="manual-search" className="text-base font-medium">
                  Manual Search
                </Label>
                <p className="text-sm text-muted-foreground">
                  Search and select members by name or email
                </p>
              </div>
            </div>
            <Switch
              id="manual-search"
              checked={config.enableManualSearch}
              onCheckedChange={(checked) => updateConfig('enableManualSearch', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Scanner Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Scanner Configuration
          </CardTitle>
          <CardDescription>
            Fine-tune barcode scanner detection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-length">Minimum Barcode Length</Label>
              <Input
                id="min-length"
                type="number"
                min={1}
                max={50}
                value={config.scannerMinLength}
                onChange={(e) => updateConfig('scannerMinLength', parseInt(e.target.value) || 8)}
              />
              <p className="text-xs text-muted-foreground">
                Minimum characters for a valid barcode
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="keystroke-delay">Max Keystroke Delay (ms)</Label>
              <Input
                id="keystroke-delay"
                type="number"
                min={10}
                max={200}
                value={config.scannerMaxKeystrokeDelay}
                onChange={(e) => updateConfig('scannerMaxKeystrokeDelay', parseInt(e.target.value) || 50)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum time between keystrokes (scanner speed)
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="barcode-pattern">Valid Barcode Pattern (Regex)</Label>
            <Input
              id="barcode-pattern"
              type="text"
              value={config.validBarcodePattern}
              onChange={(e) => updateConfig('validBarcodePattern', e.target.value)}
              placeholder="^\d{12}$"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Regular expression to validate scanned barcodes (leave empty to accept all)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Behavior Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Behavior & Feedback
          </CardTitle>
          <CardDescription>
            Configure check-in behavior and user feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto Check-in */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-checkin" className="text-base font-medium">
                Auto Check-In on Scan
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically check in member when barcode is scanned
              </p>
            </div>
            <Switch
              id="auto-checkin"
              checked={config.autoCheckInOnScan}
              onCheckedChange={(checked) => updateConfig('autoCheckInOnScan', checked)}
            />
          </div>

          <Separator />

          {/* Sound Effects */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {config.enableSoundEffects ? (
                <Volume2 className="w-5 h-5 text-primary" />
              ) : (
                <VolumeX className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="sound-effects" className="text-base font-medium">
                  Sound Effects
                </Label>
                <p className="text-sm text-muted-foreground">
                  Play sounds on successful/failed check-in
                </p>
              </div>
            </div>
            <Switch
              id="sound-effects"
              checked={config.enableSoundEffects}
              onCheckedChange={(checked) => updateConfig('enableSoundEffects', checked)}
            />
          </div>

          <Separator />

          {/* Success Animation */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="success-animation" className="text-base font-medium">
                Success Animation
              </Label>
              <p className="text-sm text-muted-foreground">
                Show visual confirmation on successful check-in
              </p>
            </div>
            <Switch
              id="success-animation"
              checked={config.enableSuccessAnimation}
              onCheckedChange={(checked) => updateConfig('enableSuccessAnimation', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Display Settings
          </CardTitle>
          <CardDescription>
            Configure what information is shown during check-in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Show Member Photo</Label>
              <p className="text-sm text-muted-foreground">
                Display member's profile photo on check-in
              </p>
            </div>
            <Switch
              checked={config.showMemberPhoto}
              onCheckedChange={(checked) => updateConfig('showMemberPhoto', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Show Membership Status</Label>
              <p className="text-sm text-muted-foreground">
                Display active/expired membership status
              </p>
            </div>
            <Switch
              checked={config.showMembershipStatus}
              onCheckedChange={(checked) => updateConfig('showMembershipStatus', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Show Last Visit</Label>
              <p className="text-sm text-muted-foreground">
                Display when the member last visited
              </p>
            </div>
            <Switch
              checked={config.showLastVisit}
              onCheckedChange={(checked) => updateConfig('showLastVisit', checked)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="idle-timeout">Idle Timeout (seconds)</Label>
            <Input
              id="idle-timeout"
              type="number"
              min={10}
              max={300}
              value={config.idleTimeoutSeconds}
              onChange={(e) => updateConfig('idleTimeoutSeconds', parseInt(e.target.value) || 30)}
            />
            <p className="text-xs text-muted-foreground">
              Reset display after this many seconds of inactivity
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CheckInStationSettings;
