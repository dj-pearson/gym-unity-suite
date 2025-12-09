import { useState, useEffect } from 'react';
import { useMFA } from '@/hooks/useMFA';
import { MFASetupData } from '@/lib/totp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  Smartphone,
  Key,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  Download,
  RefreshCw,
} from 'lucide-react';
import QRCode from 'qrcode';

interface MFASetupProps {
  onSetupComplete?: () => void;
  onCancel?: () => void;
  forceSetup?: boolean;
}

export function MFASetup({ onSetupComplete, onCancel, forceSetup = false }: MFASetupProps) {
  const {
    isLoading,
    error,
    initiateSetup,
    completeSetup,
    cancelSetup,
  } = useMFA();

  const [step, setStep] = useState<'intro' | 'qr' | 'backup' | 'verify'>('intro');
  const [setupData, setSetupData] = useState<MFASetupData | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [backupCodesDownloaded, setBackupCodesDownloaded] = useState(false);

  useEffect(() => {
    return () => {
      cancelSetup();
    };
  }, [cancelSetup]);

  const handleStartSetup = async () => {
    const data = await initiateSetup();
    if (data) {
      setSetupData(data);
      // Generate QR code
      try {
        const qrDataUrl = await QRCode.toDataURL(data.qrCodeUri, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrCodeDataUrl(qrDataUrl);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
      setStep('qr');
    }
  };

  const handleCopySecret = async () => {
    if (setupData?.secret) {
      await navigator.clipboard.writeText(setupData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleCopyBackupCodes = async () => {
    if (setupData?.backupCodes) {
      const codesText = setupData.backupCodes.join('\n');
      await navigator.clipboard.writeText(codesText);
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
    }
  };

  const handleDownloadBackupCodes = () => {
    if (setupData?.backupCodes) {
      const content = `Gym Unity Suite - Backup Codes
================================
Generated: ${new Date().toLocaleString()}

IMPORTANT: Store these codes in a safe place.
Each code can only be used once.

${setupData.backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

================================
If you lose access to your authenticator app,
use one of these codes to sign in.
`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gym-unity-backup-codes.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupCodesDownloaded(true);
    }
  };

  const handleVerifyAndComplete = async () => {
    if (!setupData || !verificationCode) return;

    const success = await completeSetup(verificationCode, setupData);
    if (success) {
      onSetupComplete?.();
    }
  };

  const handleCancel = () => {
    cancelSetup();
    setStep('intro');
    setSetupData(null);
    setVerificationCode('');
    onCancel?.();
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <CardTitle>Two-Factor Authentication</CardTitle>
        </div>
        <CardDescription>
          {step === 'intro' && 'Add an extra layer of security to your account'}
          {step === 'qr' && 'Scan the QR code with your authenticator app'}
          {step === 'backup' && 'Save your backup codes'}
          {step === 'verify' && 'Enter the code from your authenticator app'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'intro' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Install an authenticator app</p>
                  <p className="text-sm text-muted-foreground">
                    Use Google Authenticator, Authy, or any TOTP-compatible app
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Scan a QR code</p>
                  <p className="text-sm text-muted-foreground">
                    Link your authenticator app to your account
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Key className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Save backup codes</p>
                  <p className="text-sm text-muted-foreground">
                    Get recovery codes in case you lose your device
                  </p>
                </div>
              </div>
            </div>

            {forceSetup && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Required for your role</AlertTitle>
                <AlertDescription>
                  As an administrator, two-factor authentication is required for your account
                  security.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              {!forceSetup && (
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
              <Button onClick={handleStartSetup} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Set up 2FA'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'qr' && setupData && (
          <div className="space-y-6">
            <Tabs defaultValue="qr">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="qr">QR Code</TabsTrigger>
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              </TabsList>

              <TabsContent value="qr" className="space-y-4">
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-muted rounded">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  )}
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Scan this QR code with your authenticator app
                </p>
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <div>
                  <Label>Secret Key</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={setupData.secret}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopySecret}
                    >
                      {copiedSecret ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter this key manually in your authenticator app
                </p>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={() => setStep('backup')}>Continue</Button>
            </div>
          </div>
        )}

        {step === 'backup' && setupData && (
          <div className="space-y-6">
            <Alert>
              <Key className="h-4 w-4" />
              <AlertTitle>Save your backup codes</AlertTitle>
              <AlertDescription>
                These codes can be used to access your account if you lose your
                authenticator device. Each code can only be used once.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                {setupData.backupCodes.map((code, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-muted-foreground">{index + 1}.</span>
                    <span>{code}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopyBackupCodes}
                >
                  {copiedBackup ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy codes
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDownloadBackupCodes}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('qr')}>
                Back
              </Button>
              <Button
                onClick={() => setStep('verify')}
                disabled={!backupCodesDownloaded && !copiedBackup}
              >
                Continue
              </Button>
            </div>

            {!backupCodesDownloaded && !copiedBackup && (
              <p className="text-xs text-muted-foreground text-center">
                Please copy or download your backup codes before continuing
              </p>
            )}
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('backup')}>
                Back
              </Button>
              <Button
                onClick={handleVerifyAndComplete}
                disabled={isLoading || verificationCode.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Enable 2FA'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MFASetup;
