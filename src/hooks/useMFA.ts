/**
 * useMFA Hook
 * Provides MFA setup and verification functionality
 *
 * Security: MFA secrets are encrypted at rest using AES-GCM
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  generateSecret,
  generateOTPAuthURI,
  generateBackupCodes,
  verifyTOTP,
  hashBackupCode,
  verifyBackupCode,
  MFASetupData,
  MFAVerificationResult,
} from '@/lib/totp';
import {
  encryptSecret,
  ensureDecrypted,
} from '@/lib/security/encryption';

const ISSUER = 'Gym Unity Suite';

interface MFAStatus {
  enabled: boolean;
  setupAt?: string;
  lastUsed?: string;
  backupCodesRemaining?: number;
}

interface UseMFAReturn {
  // Status
  isLoading: boolean;
  error: string | null;
  mfaStatus: MFAStatus | null;

  // Setup
  initiateSetup: () => Promise<MFASetupData | null>;
  completeSetup: (code: string, setupData: MFASetupData) => Promise<boolean>;
  cancelSetup: () => void;

  // Verification
  verifyCode: (code: string) => Promise<MFAVerificationResult>;
  verifyBackupCode: (code: string) => Promise<MFAVerificationResult>;

  // Management
  disableMFA: (code: string) => Promise<boolean>;
  regenerateBackupCodes: (code: string) => Promise<string[] | null>;
  checkMFARequired: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
}

export function useMFA(): UseMFAReturn {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
  const [pendingSecret, setPendingSecret] = useState<string | null>(null);

  /**
   * Refresh MFA status from database
   */
  const refreshStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('user_mfa')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data) {
        setMfaStatus({
          enabled: data.enabled,
          setupAt: data.setup_at,
          lastUsed: data.last_used,
          backupCodesRemaining: data.backup_codes?.filter((c: string) => c !== null).length || 0,
        });
      } else {
        setMfaStatus({ enabled: false });
      }
    } catch (err) {
      console.error('Error fetching MFA status:', err);
      setError('Failed to fetch MFA status');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * Initiate MFA setup - generates secret and QR code
   */
  const initiateSetup = useCallback(async (): Promise<MFASetupData | null> => {
    if (!user?.email) {
      setError('User email not available');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Generate new secret
      const secret = generateSecret();
      setPendingSecret(secret);

      // Generate QR code URI
      const qrCodeUri = generateOTPAuthURI(secret, {
        issuer: ISSUER,
        accountName: user.email,
      });

      // Generate backup codes
      const backupCodes = generateBackupCodes(10);

      return {
        secret,
        qrCodeUri,
        backupCodes,
      };
    } catch (err) {
      console.error('Error initiating MFA setup:', err);
      setError('Failed to initiate MFA setup');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.email]);

  /**
   * Complete MFA setup - verify code and save to database
   */
  const completeSetup = useCallback(
    async (code: string, setupData: MFASetupData): Promise<boolean> => {
      if (!user?.id || !pendingSecret) {
        setError('Setup not initiated');
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Verify the code first
        const verification = await verifyTOTP(code, pendingSecret);
        if (!verification.valid) {
          setError('Invalid verification code. Please try again.');
          return false;
        }

        // Hash backup codes for storage
        const hashedBackupCodes = await Promise.all(
          setupData.backupCodes.map((code) => hashBackupCode(code))
        );

        // Encrypt the TOTP secret before storing
        const encryptedSecret = await encryptSecret(pendingSecret);

        // Save to database with encrypted secret
        const { error: upsertError } = await supabase.from('user_mfa').upsert({
          user_id: user.id,
          secret_encrypted: encryptedSecret,
          enabled: true,
          setup_at: new Date().toISOString(),
          backup_codes: hashedBackupCodes,
          updated_at: new Date().toISOString(),
        });

        if (upsertError) throw upsertError;

        // Clear pending secret
        setPendingSecret(null);

        // Refresh status
        await refreshStatus();

        return true;
      } catch (err) {
        console.error('Error completing MFA setup:', err);
        setError('Failed to complete MFA setup');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, pendingSecret, refreshStatus]
  );

  /**
   * Cancel setup process
   */
  const cancelSetup = useCallback(() => {
    setPendingSecret(null);
    setError(null);
  }, []);

  /**
   * Verify TOTP code
   */
  const verifyCode = useCallback(
    async (code: string): Promise<MFAVerificationResult> => {
      if (!user?.id) {
        return { success: false, method: null, error: 'User not authenticated' };
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch user's MFA secret
        const { data: mfaData, error: fetchError } = await supabase
          .from('user_mfa')
          .select('secret_encrypted')
          .eq('user_id', user.id)
          .eq('enabled', true)
          .single();

        if (fetchError || !mfaData?.secret_encrypted) {
          return { success: false, method: null, error: 'MFA not enabled' };
        }

        // Decrypt the secret (handles both encrypted and legacy plaintext)
        const decryptedSecret = await ensureDecrypted(mfaData.secret_encrypted);

        // Verify the code
        const verification = await verifyTOTP(code, decryptedSecret);

        if (verification.valid) {
          // Update last used timestamp
          await supabase
            .from('user_mfa')
            .update({ last_used: new Date().toISOString() })
            .eq('user_id', user.id);

          return { success: true, method: 'totp' };
        }

        return { success: false, method: null, error: 'Invalid code' };
      } catch (err) {
        console.error('Error verifying MFA code:', err);
        return { success: false, method: null, error: 'Verification failed' };
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id]
  );

  /**
   * Verify backup code
   */
  const verifyBackupCodeFn = useCallback(
    async (code: string): Promise<MFAVerificationResult> => {
      if (!user?.id) {
        return { success: false, method: null, error: 'User not authenticated' };
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch user's backup codes
        const { data: mfaData, error: fetchError } = await supabase
          .from('user_mfa')
          .select('backup_codes')
          .eq('user_id', user.id)
          .eq('enabled', true)
          .single();

        if (fetchError || !mfaData?.backup_codes) {
          return { success: false, method: null, error: 'MFA not enabled' };
        }

        // Verify the backup code
        const verification = await verifyBackupCode(
          code,
          mfaData.backup_codes.filter((c: string) => c !== null)
        );

        if (verification.valid && verification.usedIndex !== null) {
          // Mark the backup code as used (set to null)
          const updatedCodes = [...mfaData.backup_codes];
          // Find the actual index in the full array
          let actualIndex = 0;
          let nonNullCount = 0;
          for (let i = 0; i < updatedCodes.length; i++) {
            if (updatedCodes[i] !== null) {
              if (nonNullCount === verification.usedIndex) {
                actualIndex = i;
                break;
              }
              nonNullCount++;
            }
          }
          updatedCodes[actualIndex] = null;

          await supabase
            .from('user_mfa')
            .update({
              backup_codes: updatedCodes,
              last_used: new Date().toISOString(),
            })
            .eq('user_id', user.id);

          return { success: true, method: 'backup' };
        }

        return { success: false, method: null, error: 'Invalid backup code' };
      } catch (err) {
        console.error('Error verifying backup code:', err);
        return { success: false, method: null, error: 'Verification failed' };
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id]
  );

  /**
   * Disable MFA (requires verification)
   */
  const disableMFA = useCallback(
    async (code: string): Promise<boolean> => {
      if (!user?.id) {
        setError('User not authenticated');
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Verify the code first
        const verification = await verifyCode(code);
        if (!verification.success) {
          setError('Invalid verification code');
          return false;
        }

        // Disable MFA
        const { error: updateError } = await supabase
          .from('user_mfa')
          .update({
            enabled: false,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        await refreshStatus();
        return true;
      } catch (err) {
        console.error('Error disabling MFA:', err);
        setError('Failed to disable MFA');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, verifyCode, refreshStatus]
  );

  /**
   * Regenerate backup codes
   */
  const regenerateBackupCodes = useCallback(
    async (code: string): Promise<string[] | null> => {
      if (!user?.id) {
        setError('User not authenticated');
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Verify the code first
        const verification = await verifyCode(code);
        if (!verification.success) {
          setError('Invalid verification code');
          return null;
        }

        // Generate new backup codes
        const newBackupCodes = generateBackupCodes(10);
        const hashedCodes = await Promise.all(
          newBackupCodes.map((code) => hashBackupCode(code))
        );

        // Update database
        const { error: updateError } = await supabase
          .from('user_mfa')
          .update({
            backup_codes: hashedCodes,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        await refreshStatus();
        return newBackupCodes;
      } catch (err) {
        console.error('Error regenerating backup codes:', err);
        setError('Failed to regenerate backup codes');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, verifyCode, refreshStatus]
  );

  /**
   * Check if MFA is required for current user
   */
  const checkMFARequired = useCallback(async (): Promise<boolean> => {
    if (!profile?.role) return false;

    // MFA is required for admin, manager, and owner roles
    const requireMFARoles = ['owner', 'manager'];
    return requireMFARoles.includes(profile.role);
  }, [profile?.role]);

  return {
    isLoading,
    error,
    mfaStatus,
    initiateSetup,
    completeSetup,
    cancelSetup,
    verifyCode,
    verifyBackupCode: verifyBackupCodeFn,
    disableMFA,
    regenerateBackupCodes,
    checkMFARequired,
    refreshStatus,
  };
}

export default useMFA;
