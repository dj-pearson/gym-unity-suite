import { useState } from 'react';
import { useMFA } from '@/hooks/useMFA';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Key, AlertTriangle, Loader2 } from 'lucide-react';

interface MFAVerificationProps {
  onVerified: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function MFAVerification({
  onVerified,
  onCancel,
  showCancel = true,
}: MFAVerificationProps) {
  const { isLoading, error, verifyCode, verifyBackupCode } = useMFA();
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'totp' | 'backup'>('totp');

  const handleVerifyTOTP = async () => {
    setLocalError(null);

    if (code.length !== 6) {
      setLocalError('Please enter a 6-digit code');
      return;
    }

    const result = await verifyCode(code);

    if (result.success) {
      onVerified();
    } else {
      setLocalError(result.error || 'Invalid code');
      setCode('');
    }
  };

  const handleVerifyBackup = async () => {
    setLocalError(null);

    if (!backupCode.trim()) {
      setLocalError('Please enter a backup code');
      return;
    }

    const result = await verifyBackupCode(backupCode);

    if (result.success) {
      onVerified();
    } else {
      setLocalError(result.error || 'Invalid backup code');
      setBackupCode('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (activeTab === 'totp') {
        handleVerifyTOTP();
      } else {
        handleVerifyBackup();
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the code from your authenticator app to continue
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {(error || localError) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Verification Failed</AlertTitle>
            <AlertDescription>{localError || error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'totp' | 'backup')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="totp">
              <Shield className="mr-2 h-4 w-4" />
              Authenticator
            </TabsTrigger>
            <TabsTrigger value="backup">
              <Key className="mr-2 h-4 w-4" />
              Backup Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="totp" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totp-code">Authentication Code</Label>
              <Input
                id="totp-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyPress={handleKeyPress}
                className="text-center text-2xl tracking-widest font-mono"
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleVerifyTOTP}
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backup-code">Backup Code</Label>
              <Input
                id="backup-code"
                type="text"
                placeholder="XXXX-XXXX"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="text-center text-lg tracking-wider font-mono"
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter one of your saved backup codes
              </p>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Each backup code can only be used once. After using all codes, you'll need to
                generate new ones.
              </AlertDescription>
            </Alert>

            <Button
              className="w-full"
              onClick={handleVerifyBackup}
              disabled={isLoading || !backupCode.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Use Backup Code'
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {showCancel && onCancel && (
          <Button variant="ghost" className="w-full" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default MFAVerification;
