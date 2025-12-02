import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Web NFC API Types
 * Note: Web NFC is currently only supported in Chrome on Android
 */
interface NDEFMessage {
  records: NDEFRecord[];
}

interface NDEFRecord {
  recordType: string;
  mediaType?: string;
  id?: string;
  data?: DataView;
  encoding?: string;
  lang?: string;
  toRecords?: () => NDEFRecord[];
}

interface NDEFReadingEvent extends Event {
  serialNumber: string;
  message: NDEFMessage;
}

interface NDEFReader {
  scan: (options?: { signal?: AbortSignal }) => Promise<void>;
  write: (message: string | NDEFMessage) => Promise<void>;
  addEventListener: (
    type: 'reading' | 'readingerror',
    listener: (event: NDEFReadingEvent | Event) => void
  ) => void;
  removeEventListener: (
    type: 'reading' | 'readingerror',
    listener: (event: NDEFReadingEvent | Event) => void
  ) => void;
}

declare global {
  interface Window {
    NDEFReader?: new () => NDEFReader;
  }
}

export type NfcStatus = 'unsupported' | 'idle' | 'scanning' | 'success' | 'error';

export interface NfcScanResult {
  /** The NFC tag serial number (UID) */
  serialNumber: string;
  /** Text content from NDEF records */
  textContent?: string;
  /** URL content from NDEF records */
  urlContent?: string;
  /** Raw NDEF message */
  message?: NDEFMessage;
}

export interface UseNfcReaderConfig {
  /** Callback when an NFC tag is read */
  onRead?: (result: NfcScanResult) => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
  /** Whether to start scanning automatically */
  autoStart?: boolean;
}

export interface UseNfcReaderResult {
  /** Current NFC reader status */
  status: NfcStatus;
  /** Whether NFC is supported in this browser */
  isSupported: boolean;
  /** Whether currently scanning */
  isScanning: boolean;
  /** Last read result */
  lastRead: NfcScanResult | null;
  /** Last error message */
  error: string | null;
  /** Start scanning for NFC tags */
  startScan: () => Promise<void>;
  /** Stop scanning */
  stopScan: () => void;
  /** Clear last read result and error */
  clear: () => void;
}

/**
 * Hook for reading NFC tags using the Web NFC API
 *
 * Note: Web NFC is only supported in Chrome on Android (requires HTTPS).
 * For iOS, NFC reading requires native apps or Apple Wallet.
 *
 * @example
 * ```tsx
 * const { isSupported, isScanning, startScan, lastRead } = useNfcReader({
 *   onRead: (result) => {
 *     console.log('NFC Tag UID:', result.serialNumber);
 *     lookupMemberByNfc(result.serialNumber);
 *   },
 * });
 *
 * if (!isSupported) {
 *   return <div>NFC not supported on this device</div>;
 * }
 *
 * return (
 *   <Button onClick={startScan} disabled={isScanning}>
 *     {isScanning ? 'Scanning...' : 'Tap NFC Card'}
 *   </Button>
 * );
 * ```
 */
export function useNfcReader(config: UseNfcReaderConfig = {}): UseNfcReaderResult {
  const { onRead, onError, autoStart = false } = config;

  const [status, setStatus] = useState<NfcStatus>('idle');
  const [lastRead, setLastRead] = useState<NfcScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readerRef = useRef<NDEFReader | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if NFC is supported
  const isSupported = typeof window !== 'undefined' && 'NDEFReader' in window;

  // Parse NDEF records to extract text/URL content
  const parseNdefRecords = useCallback((message: NDEFMessage): { text?: string; url?: string } => {
    let text: string | undefined;
    let url: string | undefined;

    for (const record of message.records) {
      if (record.recordType === 'text' && record.data) {
        const decoder = new TextDecoder(record.encoding || 'utf-8');
        text = decoder.decode(record.data);
      } else if (record.recordType === 'url' && record.data) {
        const decoder = new TextDecoder();
        url = decoder.decode(record.data);
      }
    }

    return { text, url };
  }, []);

  // Handle NFC reading
  const handleReading = useCallback((event: NDEFReadingEvent) => {
    const { text, url } = parseNdefRecords(event.message);

    const result: NfcScanResult = {
      serialNumber: event.serialNumber,
      textContent: text,
      urlContent: url,
      message: event.message,
    };

    setLastRead(result);
    setStatus('success');
    setError(null);
    onRead?.(result);

    // Reset to scanning after brief success indicator
    setTimeout(() => {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        setStatus('scanning');
      }
    }, 1500);
  }, [parseNdefRecords, onRead]);

  // Handle reading errors
  const handleReadingError = useCallback((event: Event) => {
    const errorMessage = 'NFC reading failed. Please try again.';
    setError(errorMessage);
    setStatus('error');
    onError?.(errorMessage);

    // Reset to scanning after brief error indicator
    setTimeout(() => {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        setStatus('scanning');
        setError(null);
      }
    }, 2000);
  }, [onError]);

  // Start scanning
  const startScan = useCallback(async () => {
    if (!isSupported) {
      const msg = 'NFC is not supported on this device/browser';
      setError(msg);
      setStatus('unsupported');
      onError?.(msg);
      return;
    }

    // Stop any existing scan
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      setStatus('scanning');
      setError(null);

      // Create new reader and abort controller
      const NDEFReaderClass = window.NDEFReader!;
      readerRef.current = new NDEFReaderClass();
      abortControllerRef.current = new AbortController();

      // Add event listeners
      readerRef.current.addEventListener('reading', handleReading as EventListener);
      readerRef.current.addEventListener('readingerror', handleReadingError);

      // Start scanning
      await readerRef.current.scan({ signal: abortControllerRef.current.signal });

    } catch (err: any) {
      let errorMessage = 'Failed to start NFC scan';

      if (err.name === 'NotAllowedError') {
        errorMessage = 'NFC permission denied. Please allow NFC access in your browser settings.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'NFC is not supported on this device.';
        setStatus('unsupported');
      } else if (err.name === 'AbortError') {
        // Scan was aborted, not an error
        return;
      } else {
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
      setStatus('error');
      onError?.(errorMessage);
    }
  }, [isSupported, handleReading, handleReadingError, onError]);

  // Stop scanning
  const stopScan = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (readerRef.current) {
      readerRef.current.removeEventListener('reading', handleReading as EventListener);
      readerRef.current.removeEventListener('readingerror', handleReadingError);
      readerRef.current = null;
    }

    setStatus('idle');
  }, [handleReading, handleReadingError]);

  // Clear state
  const clear = useCallback(() => {
    setLastRead(null);
    setError(null);
    if (status !== 'scanning') {
      setStatus('idle');
    }
  }, [status]);

  // Check support on mount
  useEffect(() => {
    if (!isSupported) {
      setStatus('unsupported');
    } else if (autoStart) {
      startScan();
    }

    return () => {
      stopScan();
    };
  }, []);

  return {
    status,
    isSupported,
    isScanning: status === 'scanning',
    lastRead,
    error,
    startScan,
    stopScan,
    clear,
  };
}

/**
 * Check if Web NFC is available
 */
export function isNfcSupported(): boolean {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
}

/**
 * Get NFC support status message
 */
export function getNfcSupportMessage(): string {
  if (typeof window === 'undefined') {
    return 'NFC status unknown (server-side rendering)';
  }

  if ('NDEFReader' in window) {
    return 'NFC is supported on this device';
  }

  // Check if running on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    return 'NFC reading requires a native app on iOS. Consider using Apple Wallet for contactless check-in.';
  }

  // Check if running on Android but not Chrome
  const isAndroid = /Android/.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent);
  if (isAndroid && !isChrome) {
    return 'NFC is only supported in Chrome on Android. Please open this page in Chrome.';
  }

  // Check if HTTPS
  if (window.location.protocol !== 'https:') {
    return 'NFC requires a secure connection (HTTPS). Please access this page via HTTPS.';
  }

  return 'NFC is not supported on this device/browser.';
}

export default useNfcReader;
