import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Camera,
  CameraOff,
  SwitchCamera,
  Loader2,
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CameraScannerProps {
  /** Callback when a code is successfully scanned */
  onScan: (code: string) => void;
  /** Callback when scanner encounters an error */
  onError?: (error: string) => void;
  /** Callback when scanner is closed */
  onClose?: () => void;
  /** Whether to show the close button */
  showCloseButton?: boolean;
  /** Whether to auto-start the camera on mount */
  autoStart?: boolean;
  /** Preferred camera facing mode */
  preferredCamera?: 'environment' | 'user';
  /** Valid code patterns (regex) */
  validPatterns?: RegExp[];
  /** Scanner configuration */
  config?: {
    fps?: number;
    qrbox?: { width: number; height: number };
    aspectRatio?: number;
  };
  /** CSS class for the container */
  className?: string;
  /** Height of the scanner viewport */
  height?: number;
}

type ScannerStatus = 'idle' | 'starting' | 'scanning' | 'paused' | 'error' | 'success';

export function CameraScanner({
  onScan,
  onError,
  onClose,
  showCloseButton = true,
  autoStart = true,
  preferredCamera = 'environment',
  validPatterns = [/^\d{12}$/, /^[A-Z0-9]{8,16}$/i],
  config = {},
  className,
  height = 300,
}: CameraScannerProps) {
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerElementId = useRef(`qr-scanner-${Math.random().toString(36).substr(2, 9)}`);

  const {
    fps = 10,
    qrbox = { width: 250, height: 250 },
    aspectRatio = 1.0,
  } = config;

  const validateCode = useCallback((code: string): boolean => {
    if (validPatterns.length === 0) return true;
    return validPatterns.some(pattern => pattern.test(code));
  }, [validPatterns]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await scannerRef.current.stop();
        }
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (!containerRef.current) return;

    setStatus('starting');
    setErrorMessage(null);

    try {
      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      if (devices.length === 0) {
        throw new Error('No cameras found on this device');
      }

      setAvailableCameras(devices);

      // Find preferred camera
      let cameraId = devices[0].id;
      const preferredIndex = devices.findIndex(d =>
        preferredCamera === 'environment'
          ? d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')
          : d.label.toLowerCase().includes('front') || d.label.toLowerCase().includes('user')
      );

      if (preferredIndex !== -1) {
        cameraId = devices[preferredIndex].id;
        setCurrentCameraIndex(preferredIndex);
      }

      // Create scanner instance if not exists
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerElementId.current);
      }

      // Start scanning
      await scannerRef.current.start(
        cameraId,
        {
          fps,
          qrbox,
          aspectRatio,
        },
        (decodedText) => {
          // Validate the scanned code
          if (validateCode(decodedText)) {
            setLastScannedCode(decodedText);
            setStatus('success');

            // Brief pause to show success state
            setTimeout(() => {
              onScan(decodedText);
            }, 500);
          }
        },
        () => {
          // Ignore scan failures (happens continuously when no code in view)
        }
      );

      setStatus('scanning');
    } catch (error: any) {
      console.error('Scanner error:', error);
      const message = error.message || 'Failed to start camera';
      setErrorMessage(message);
      setStatus('error');
      onError?.(message);
    }
  }, [fps, qrbox, aspectRatio, preferredCamera, validateCode, onScan, onError]);

  const switchCamera = useCallback(async () => {
    if (availableCameras.length <= 1) return;

    await stopScanner();

    const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
    setCurrentCameraIndex(nextIndex);

    setStatus('starting');

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerElementId.current);
      }

      await scannerRef.current.start(
        availableCameras[nextIndex].id,
        { fps, qrbox, aspectRatio },
        (decodedText) => {
          if (validateCode(decodedText)) {
            setLastScannedCode(decodedText);
            setStatus('success');
            setTimeout(() => onScan(decodedText), 500);
          }
        },
        () => {}
      );

      setStatus('scanning');
    } catch (error: any) {
      setErrorMessage(error.message);
      setStatus('error');
    }
  }, [availableCameras, currentCameraIndex, fps, qrbox, aspectRatio, validateCode, onScan, stopScanner]);

  const handleClose = useCallback(async () => {
    await stopScanner();
    onClose?.();
  }, [stopScanner, onClose]);

  // Auto-start on mount
  useEffect(() => {
    if (autoStart) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [autoStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <Card className={cn('overflow-hidden', className)} ref={containerRef}>
      <CardContent className="p-0 relative">
        {/* Scanner viewport */}
        <div
          id={scannerElementId.current}
          style={{ height: `${height}px` }}
          className="w-full bg-black"
        />

        {/* Status overlay */}
        {status === 'starting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">Starting camera...</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500/80">
            <div className="text-center text-white">
              <CheckCircle className="w-12 h-12 mx-auto mb-2" />
              <p className="font-semibold">Code Scanned!</p>
              <p className="text-sm font-mono">{lastScannedCode}</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
            <Alert variant="destructive" className="max-w-sm">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage || 'Camera error'}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {status === 'scanning' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => stopScanner().then(() => setStatus('paused'))}
                >
                  <CameraOff className="w-4 h-4 mr-1" />
                  Pause
                </Button>
              )}

              {status === 'paused' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={startScanner}
                >
                  <Camera className="w-4 h-4 mr-1" />
                  Resume
                </Button>
              )}

              {status === 'error' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={startScanner}
                >
                  <Camera className="w-4 h-4 mr-1" />
                  Retry
                </Button>
              )}

              {availableCameras.length > 1 && status === 'scanning' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={switchCamera}
                >
                  <SwitchCamera className="w-4 h-4 mr-1" />
                  Switch
                </Button>
              )}
            </div>

            {showCloseButton && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClose}
              >
                <X className="w-4 h-4 mr-1" />
                Close
              </Button>
            )}
          </div>
        </div>

        {/* Scanning indicator */}
        {status === 'scanning' && (
          <div className="absolute top-3 left-3">
            <div className="flex items-center gap-2 bg-black/50 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-xs">Scanning...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CameraScanner;
