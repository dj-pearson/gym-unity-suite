import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Nfc,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  X,
} from 'lucide-react';
import { useNfcReader, getNfcSupportMessage, type NfcScanResult } from '@/hooks/useNfcReader';
import { cn } from '@/lib/utils';

export interface NfcScannerProps {
  /** Callback when an NFC tag is read */
  onScan: (serialNumber: string, result: NfcScanResult) => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
  /** Callback when scanner is closed */
  onClose?: () => void;
  /** Whether to show the close button */
  showCloseButton?: boolean;
  /** Whether to auto-start scanning */
  autoStart?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * NFC Scanner Component
 *
 * Provides a UI for scanning NFC tags/cards for member check-in.
 * Uses the Web NFC API (Chrome on Android only).
 *
 * For iOS devices, shows instructions for Apple Wallet integration.
 */
export function NfcScanner({
  onScan,
  onError,
  onClose,
  showCloseButton = true,
  autoStart = true,
  className,
}: NfcScannerProps) {
  const {
    status,
    isSupported,
    isScanning,
    lastRead,
    error,
    startScan,
    stopScan,
    clear,
  } = useNfcReader({
    autoStart,
    onRead: (result) => {
      onScan(result.serialNumber, result);
    },
    onError,
  });

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScan();
    };
  }, [stopScan]);

  const handleClose = () => {
    stopScan();
    onClose?.();
  };

  // Check if iOS (no Web NFC support)
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Unsupported device
  if (!isSupported) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-6 space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Nfc className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">NFC Not Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {getNfcSupportMessage()}
            </p>
          </div>

          {isIOS && (
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                <strong>iOS Users:</strong> Use the "Add to Apple Wallet" feature to create
                a contactless pass, or use the QR code scanner instead.
              </AlertDescription>
            </Alert>
          )}

          {showCloseButton && (
            <Button variant="outline" onClick={handleClose} className="w-full">
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-0">
        {/* Scanner Display */}
        <div
          className={cn(
            'relative aspect-square flex flex-col items-center justify-center p-8',
            status === 'scanning' && 'bg-gradient-to-b from-primary/5 to-primary/10',
            status === 'success' && 'bg-green-50 dark:bg-green-950/20',
            status === 'error' && 'bg-red-50 dark:bg-red-950/20'
          )}
        >
          {/* NFC Animation */}
          <div className="relative mb-6">
            <div
              className={cn(
                'w-32 h-32 rounded-full flex items-center justify-center',
                status === 'scanning' && 'bg-primary/10 animate-pulse',
                status === 'success' && 'bg-green-500',
                status === 'error' && 'bg-red-500',
                status === 'idle' && 'bg-muted'
              )}
            >
              {status === 'scanning' && (
                <>
                  {/* Ripple effect */}
                  <div className="absolute w-32 h-32 rounded-full border-2 border-primary/30 animate-ping" />
                  <div className="absolute w-40 h-40 rounded-full border border-primary/20 animate-ping animation-delay-200" />
                  <Nfc className="w-12 h-12 text-primary" />
                </>
              )}
              {status === 'success' && (
                <CheckCircle className="w-12 h-12 text-white" />
              )}
              {status === 'error' && (
                <AlertTriangle className="w-12 h-12 text-white" />
              )}
              {status === 'idle' && (
                <Nfc className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center">
            {status === 'idle' && (
              <>
                <h3 className="text-lg font-semibold mb-2">Ready to Scan</h3>
                <p className="text-sm text-muted-foreground">
                  Tap the button below to start scanning
                </p>
              </>
            )}

            {status === 'scanning' && (
              <>
                <h3 className="text-lg font-semibold mb-2 text-primary">
                  Waiting for NFC Card
                </h3>
                <p className="text-sm text-muted-foreground">
                  Hold member card near the device
                </p>
                <Badge variant="secondary" className="mt-3">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Scanning...
                </Badge>
              </>
            )}

            {status === 'success' && lastRead && (
              <>
                <h3 className="text-lg font-semibold mb-2 text-green-700 dark:text-green-400">
                  Card Detected!
                </h3>
                <p className="text-sm font-mono bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded">
                  {lastRead.serialNumber}
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <h3 className="text-lg font-semibold mb-2 text-red-700 dark:text-red-400">
                  Scan Failed
                </h3>
                <p className="text-sm text-muted-foreground">
                  {error || 'Please try again'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-t bg-muted/30 space-y-3">
          {status === 'idle' && (
            <Button onClick={startScan} className="w-full" size="lg">
              <Nfc className="w-4 h-4 mr-2" />
              Start NFC Scan
            </Button>
          )}

          {status === 'scanning' && (
            <Button
              onClick={stopScan}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <X className="w-4 h-4 mr-2" />
              Stop Scanning
            </Button>
          )}

          {(status === 'success' || status === 'error') && (
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={startScan} variant="outline" size="lg">
                <Nfc className="w-4 h-4 mr-2" />
                Scan Again
              </Button>
              {showCloseButton && (
                <Button onClick={handleClose} variant="outline" size="lg">
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
              )}
            </div>
          )}

          {!showCloseButton && status !== 'idle' && (
            <p className="text-xs text-center text-muted-foreground">
              Hold the member's NFC card or Apple Wallet pass near the device
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default NfcScanner;
