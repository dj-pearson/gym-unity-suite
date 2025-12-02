import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  QrCode,
  Maximize2,
  Minimize2,
  Sun,
  RotateCcw,
  Wallet,
  Smartphone,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemberCheckInPassProps {
  /** Show in compact mode (for embedding) */
  compact?: boolean;
  /** Callback when fullscreen is toggled */
  onFullscreenChange?: (isFullscreen: boolean) => void;
  /** Custom class name */
  className?: string;
}

/**
 * Mobile-optimized member check-in pass display
 *
 * Features:
 * - Large, scannable QR code
 * - Member barcode number
 * - Fullscreen mode for easy scanning
 * - Brightness boost option
 * - Add to Apple/Google Wallet button (future)
 */
export function MemberCheckInPass({
  compact = false,
  onFullscreenChange,
  className,
}: MemberCheckInPassProps) {
  const { profile, organization } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBrightMode, setIsBrightMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

  // Simulate a successful scan animation (for demo)
  const simulateSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
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
            onClick={() => {
              // Future: Add to wallet functionality
              alert('Apple/Google Wallet integration coming soon!');
            }}
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
  );
}

export default MemberCheckInPass;
