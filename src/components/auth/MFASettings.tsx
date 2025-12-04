import { useState, useEffect } from 'react';
import { useMFA } from '@/hooks/useMFA';
import { MFASetup } from './MFASetup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Key,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Trash2,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';

export function MFASettings() {
  const {
    isLoading,
    error,
    mfaStatus,
    refreshStatus,
    disableMFA,
    regenerateBackupCodes,
    checkMFARequired,
  } = useMFA();

  const [showSetup, setShowSetup] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [regenerateCode, setRegenerateCode] = useState('');
  const [newBackupCodes, setNewBackupCodes] = useState<string[] | null>(null);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);

  useEffect(() => {
    refreshStatus();
    checkMFARequired().then(setMfaRequired);
  }, [refreshStatus, checkMFARequired]);

  const handleDisable = async () => {
    const success = await disableMFA(disableCode);
    if (success) {
      setShowDisableDialog(false);
      setDisableCode('');
    }
  };

  const handleRegenerate = async () => {
    const codes = await regenerateBackupCodes(regenerateCode);
    if (codes) {
      setNewBackupCodes(codes);
      setRegenerateCode('');
    }
  };

  const handleCopyNewCodes = async () => {
    if (newBackupCodes) {
      await navigator.clipboard.writeText(newBackupCodes.join('\n'));
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  const handleDownloadNewCodes = () => {
    if (newBackupCodes) {
      const content = `Gym Unity Suite - Backup Codes
================================
Generated: ${new Date().toLocaleString()}

IMPORTANT: Store these codes in a safe place.
Each code can only be used once.

${newBackupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}
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
    }
  };

  if (showSetup) {
    return (
      <MFASetup
        onSetupComplete={() => {
          setShowSetup(false);
          refreshStatus();
        }}
        onCancel={() => setShowSetup(false)}
        forceSetup={mfaRequired}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mfaStatus?.enabled ? (
              <ShieldCheck className="h-6 w-6 text-green-500" />
            ) : (
              <ShieldOff className="h-6 w-6 text-muted-foreground" />
            )}
            <CardTitle>Two-Factor Authentication</CardTitle>
          </div>
          {mfaStatus?.enabled ? (
            <Badge variant="default" className="bg-green-500">
              Enabled
            </Badge>
          ) : (
            <Badge variant="secondary">Disabled</Badge>
          )}
        </div>
        <CardDescription>
          {mfaStatus?.enabled
            ? 'Your account is protected with two-factor authentication'
            : 'Add an extra layer of security to your account'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {mfaRequired && !mfaStatus?.enabled && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Required for your role</AlertTitle>
            <AlertDescription>
              As an administrator, two-factor authentication is required for your account.
            </AlertDescription>
          </Alert>
        )}

        {mfaStatus?.enabled ? (
          <div className="space-y-4">
            {/* Status Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Enabled on</p>
                <p className="font-medium">
                  {mfaStatus.setupAt
                    ? format(new Date(mfaStatus.setupAt), 'PPP')
                    : 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Last used</p>
                <p className="font-medium">
                  {mfaStatus.lastUsed
                    ? format(new Date(mfaStatus.lastUsed), 'PPP p')
                    : 'Never'}
                </p>
              </div>
            </div>

            {/* Backup Codes Status */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Backup Codes</p>
                    <p className="text-sm text-muted-foreground">
                      {mfaStatus.backupCodesRemaining} codes remaining
                    </p>
                  </div>
                </div>
                <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Regenerate Backup Codes</DialogTitle>
                      <DialogDescription>
                        This will invalidate all existing backup codes. Enter your authenticator
                        code to continue.
                      </DialogDescription>
                    </DialogHeader>

                    {newBackupCodes ? (
                      <div className="space-y-4">
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Save these codes now. You won't be able to see them again.
                          </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                          {newBackupCodes.map((code, index) => (
                            <div key={index}>
                              {index + 1}. {code}
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleCopyNewCodes}
                          >
                            {copiedCodes ? (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleDownloadNewCodes}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>

                        <DialogFooter>
                          <Button
                            onClick={() => {
                              setShowRegenerateDialog(false);
                              setNewBackupCodes(null);
                            }}
                          >
                            Done
                          </Button>
                        </DialogFooter>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>Authenticator Code</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            placeholder="000000"
                            value={regenerateCode}
                            onChange={(e) =>
                              setRegenerateCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                            }
                            className="text-center"
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setShowRegenerateDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleRegenerate}
                            disabled={isLoading || regenerateCode.length !== 6}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Regenerating...
                              </>
                            ) : (
                              'Regenerate Codes'
                            )}
                          </Button>
                        </DialogFooter>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </div>

              {mfaStatus.backupCodesRemaining !== undefined &&
                mfaStatus.backupCodesRemaining <= 3 && (
                  <Alert variant="destructive" className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      You're running low on backup codes. Consider regenerating them.
                    </AlertDescription>
                  </Alert>
                )}
            </div>

            {/* Disable MFA */}
            {!mfaRequired && (
              <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Disable Two-Factor Authentication
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                    <DialogDescription>
                      This will remove the extra security layer from your account. Enter your
                      authenticator code to confirm.
                    </DialogDescription>
                  </DialogHeader>

                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Disabling 2FA will make your account less secure. Are you sure you want to
                      continue?
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label>Authenticator Code</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000"
                      value={disableCode}
                      onChange={(e) =>
                        setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      className="text-center"
                    />
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDisable}
                      disabled={isLoading || disableCode.length !== 6}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Disabling...
                        </>
                      ) : (
                        'Disable 2FA'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        ) : (
          <Button onClick={() => setShowSetup(true)} className="w-full">
            <Shield className="mr-2 h-4 w-4" />
            Set Up Two-Factor Authentication
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default MFASettings;
