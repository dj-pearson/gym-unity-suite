import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, edgeFunctions } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  QrCode,
  Maximize2,
  Minimize2,
  Sun,
  RotateCcw,
  Wallet,
  Smartphone,
  CheckCircle,
  Apple,
  Loader2,
  Download,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MemberCheckInPassProps {
  /** Show in compact mode (for embedding) */
  compact?: boolean;
  /** Callback when fullscreen is toggled */
  onFullscreenChange?: (isFullscreen: boolean) => void;
  /** Custom class name */
  className?: string;
}

// Detect device type for wallet buttons
const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent);

/**
 * Mobile-optimized member check-in pass display
 *
 * Features:
 * - Large, scannable QR code
 * - Member barcode number
 * - Fullscreen mode for easy scanning
 * - Brightness boost option
 * - Add to Apple/Google Wallet buttons
 */
export function MemberCheckInPass({
  compact = false,
  onFullscreenChange,
  className,
}: MemberCheckInPassProps) {
  const { profile, organization } = useAuth();
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBrightMode, setIsBrightMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [isAddingToWallet, setIsAddingToWallet] = useState<'apple' | 'google' | null>(null);

  // Generate QR code from barcode
  const generateQRCode = useCallback(async () => {
    if (!profile?.barcode) return;

    try {
      setIsGenerating(true);
      const qrDataUrl = await QRCode.toDataURL(profile.barcode, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H', // High error correction for better scanning
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [profile?.barcode]);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        onFullscreenChange?.(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        onFullscreenChange?.(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, [onFullscreenChange]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      onFullscreenChange?.(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onFullscreenChange]);

  // Generate QR on mount and when barcode changes
  useEffect(() => {
    generateQRCode();
  }, [generateQRCode]);

  // Add to Apple Wallet
  const addToAppleWallet = async () => {
    setIsAddingToWallet('apple');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Please log in to add to wallet');
      }

      const response = await edgeFunctions.invoke('generate-wallet-pass', {
        body: { walletType: 'apple' },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate pass');
      }

      // The response is a .pkpass file - trigger download
      const blob = new Blob([response.data], { type: 'application/vnd.apple.pkpass' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${organization?.name?.replace(/[^a-z0-9]/gi, '_') || 'gym'}_membership.pkpass`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Pass Downloaded',
        description: 'Open the downloaded file to add it to Apple Wallet',
      });
      setShowWalletDialog(false);
    } catch (error: any) {
      console.error('Apple Wallet error:', error);
      toast({
        title: 'Failed to Generate Pass',
        description: error.message || 'Please try again or contact support',
        variant: 'destructive',
      });
    } finally {
      setIsAddingToWallet(null);
    }
  };

  // Add to Google Wallet
  const addToGoogleWallet = async () => {
    setIsAddingToWallet('google');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Please log in to add to wallet');
      }

      const response = await edgeFunctions.invoke('generate-wallet-pass', {
        body: { walletType: 'google' },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate pass');
      }

      // Open the Google Wallet save URL
      if (response.data.saveUrl) {
        window.open(response.data.saveUrl, '_blank');
        toast({
          title: 'Opening Google Wallet',
          description: 'Follow the prompts to save your pass',
        });
        setShowWalletDialog(false);
      }
    } catch (error: any) {
      console.error('Google Wallet error:', error);
      toast({
        title: 'Failed to Generate Pass',
        description: error.message || 'Please try again or contact support',
        variant: 'destructive',
      });
    } finally {
      setIsAddingToWallet(null);
    }
  };

  if (!profile?.barcode) {
    return (
      <Card className={cn('text-center', className)}>
        <CardContent className="py-8">
          <QrCode className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            No member ID available. Please contact staff.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Fullscreen display
  if (isFullscreen) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex flex-col items-center justify-center p-6',
          isBrightMode ? 'bg-white' : 'bg-background'
        )}
        onClick={toggleFullscreen}
      >
        {/* Success overlay */}
        {showSuccess && (
          <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center z-10">
            <div className="text-center text-white">
              <CheckCircle className="w-24 h-24 mx-auto mb-4" />
              <p className="text-2xl font-bold">Checked In!</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className={cn(
            'text-2xl font-bold',
            isBrightMode ? 'text-gray-900' : 'text-foreground'
          )}>
            {organization?.name || 'Gym'}
          </h2>
          <p className={cn(
            'text-lg',
            isBrightMode ? 'text-gray-600' : 'text-muted-foreground'
          )}>
            {profile.first_name} {profile.last_name}
          </p>
        </div>

        {/* QR Code */}
        <div className="bg-white p-4 rounded-2xl shadow-lg mb-6">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="Check-in QR Code"
              className="w-72 h-72 md:w-96 md:h-96"
            />
          ) : (
            <div className="w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
              <RotateCcw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Member ID */}
        <div className={cn(
          'text-center mb-6 bg-muted/50 px-6 py-3 rounded-full',
          isBrightMode && 'bg-gray-100'
        )}>
          <p className={cn(
            'text-xs uppercase tracking-wider mb-1',
            isBrightMode ? 'text-gray-500' : 'text-muted-foreground'
          )}>
            Member ID
          </p>
          <p className={cn(
            'text-3xl font-mono font-bold tracking-widest',
            isBrightMode ? 'text-gray-900' : 'text-foreground'
          )}>
            {profile.barcode}
          </p>
        </div>

        {/* Instructions */}
        <p className={cn(
          'text-sm text-center',
          isBrightMode ? 'text-gray-500' : 'text-muted-foreground'
        )}>
          Show this code to staff or hold up to scanner
        </p>

        {/* Controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setIsBrightMode(!isBrightMode);
            }}
            className={isBrightMode ? 'text-gray-700' : ''}
          >
            <Sun className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className={isBrightMode ? 'text-gray-700' : ''}
          >
            <Minimize2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Tap anywhere hint */}
        <p className={cn(
          'absolute bottom-4 text-xs',
          isBrightMode ? 'text-gray-400' : 'text-muted-foreground/50'
        )}>
          Tap anywhere to exit fullscreen
        </p>
      </div>
    );
  }

  // Compact mode
  if (compact) {
    return (
      <Card className={cn('cursor-pointer hover:shadow-lg transition-shadow', className)} onClick={toggleFullscreen}>
        <CardContent className="p-4 flex items-center gap-4">
          {/* QR Code thumbnail */}
          <div className="bg-white p-2 rounded-lg border">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16" />
            ) : (
              <div className="w-16 h-16 flex items-center justify-center">
                <QrCode className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <p className="font-medium">{profile.first_name} {profile.last_name}</p>
            <p className="text-sm font-mono text-muted-foreground">{profile.barcode}</p>
          </div>

          {/* Expand button */}
          <Maximize2 className="w-5 h-5 text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Standard display
  return (
    <>
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center">
            <Badge variant="secondary" className="mb-2">
              <Smartphone className="w-3 h-3 mr-1" />
              Digital Pass
            </Badge>
            <h3 className="text-lg font-semibold">
              {profile.first_name} {profile.last_name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {organization?.name}
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-xl border-2 border-dashed border-muted">
              {isGenerating ? (
                <div className="w-48 h-48 flex items-center justify-center">
                  <RotateCcw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Check-in QR Code"
                  className="w-48 h-48"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Member ID */}
          <div className="text-center bg-muted/50 py-3 rounded-lg">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Member ID
            </p>
            <p className="text-2xl font-mono font-bold tracking-widest">
              {profile.barcode}
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="default"
              onClick={toggleFullscreen}
              className="w-full"
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              Fullscreen
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowWalletDialog(true)}
              className="w-full"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Add to Wallet
            </Button>
          </div>

          {/* Instructions */}
          <p className="text-xs text-center text-muted-foreground">
            Show this QR code at the front desk or use fullscreen mode for scanning
          </p>
        </CardContent>
      </Card>

      {/* Wallet Dialog */}
      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Add to Wallet
            </DialogTitle>
            <DialogDescription>
              Save your membership pass to your phone's wallet for quick check-in
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {/* Apple Wallet */}
            <Button
              variant="outline"
              className="w-full h-14 justify-start gap-3"
              onClick={addToAppleWallet}
              disabled={isAddingToWallet !== null}
            >
              {isAddingToWallet === 'apple' ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                  <Apple className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="text-left">
                <p className="font-medium">Apple Wallet</p>
                <p className="text-xs text-muted-foreground">
                  {isIOS ? 'Recommended for your device' : 'For iPhone, iPad, Apple Watch'}
                </p>
              </div>
              {isAddingToWallet !== 'apple' && (
                <Download className="w-4 h-4 ml-auto text-muted-foreground" />
              )}
            </Button>

            {/* Google Wallet */}
            <Button
              variant="outline"
              className="w-full h-14 justify-start gap-3"
              onClick={addToGoogleWallet}
              disabled={isAddingToWallet !== null}
            >
              {isAddingToWallet === 'google' ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <div className="w-10 h-10 bg-white border rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
              )}
              <div className="text-left">
                <p className="font-medium">Google Wallet</p>
                <p className="text-xs text-muted-foreground">
                  {isAndroid ? 'Recommended for your device' : 'For Android phones and Wear OS'}
                </p>
              </div>
              {isAddingToWallet !== 'google' && (
                <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
              )}
            </Button>
          </div>

          <div className="text-xs text-center text-muted-foreground">
            Your pass includes your QR code and works with NFC for contactless check-in
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default MemberCheckInPass;
