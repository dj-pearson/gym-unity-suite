import { useState, useEffect, useCallback, useRef } from 'react';

export interface BarcodeScannerConfig {
  /** Minimum characters for a valid barcode (default: 4) */
  minLength?: number;
  /** Maximum time between keystrokes in ms (default: 50) */
  maxKeystrokeDelay?: number;
  /** Whether to prevent default behavior when barcode is detected (default: true) */
  preventDefault?: boolean;
  /** Whether the scanner is currently enabled (default: true) */
  enabled?: boolean;
  /** Specific element to listen on (default: document) */
  targetElement?: HTMLElement | null;
  /** Valid barcode patterns - regex to validate scanned input */
  validPatterns?: RegExp[];
  /** Callback when a barcode is scanned */
  onScan?: (barcode: string) => void;
  /** Callback for scan errors */
  onError?: (error: string) => void;
}

export interface BarcodeScannerResult {
  /** The last scanned barcode */
  barcode: string | null;
  /** Whether a scan is currently in progress */
  isScanning: boolean;
  /** Clear the last scanned barcode */
  clear: () => void;
  /** Manually process a barcode (useful for testing) */
  simulateScan: (barcode: string) => void;
  /** Current buffer of characters being typed */
  buffer: string;
}

/**
 * Hook to detect USB/Bluetooth barcode scanner input
 *
 * USB barcode scanners typically emulate keyboard input, typing characters
 * very rapidly (faster than human typing) and ending with Enter.
 *
 * This hook detects this pattern by:
 * 1. Monitoring keystroke timing
 * 2. Buffering rapid sequential keystrokes
 * 3. Triggering on Enter if the buffer matches barcode criteria
 *
 * @example
 * ```tsx
 * const { barcode, isScanning } = useBarcodeScanner({
 *   onScan: (code) => {
 *     console.log('Scanned:', code);
 *     lookupMember(code);
 *   },
 *   minLength: 8,
 * });
 * ```
 */
export function useBarcodeScanner(config: BarcodeScannerConfig = {}): BarcodeScannerResult {
  const {
    minLength = 4,
    maxKeystrokeDelay = 50,
    preventDefault = true,
    enabled = true,
    targetElement = null,
    validPatterns = [/^\d{12}$/, /^[A-Z0-9]{8,16}$/i], // Default: 12-digit or 8-16 alphanumeric
    onScan,
    onError,
  } = config;

  const [barcode, setBarcode] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [buffer, setBuffer] = useState('');

  // Use refs for values that shouldn't trigger re-renders
  const bufferRef = useRef('');
  const lastKeystrokeTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clear = useCallback(() => {
    setBarcode(null);
    setBuffer('');
    bufferRef.current = '';
  }, []);

  const validateBarcode = useCallback((code: string): boolean => {
    if (code.length < minLength) {
      return false;
    }

    // If no patterns specified, accept any string of sufficient length
    if (validPatterns.length === 0) {
      return true;
    }

    // Check if code matches any valid pattern
    return validPatterns.some(pattern => pattern.test(code));
  }, [minLength, validPatterns]);

  const processBarcode = useCallback((code: string) => {
    const trimmedCode = code.trim();

    if (!validateBarcode(trimmedCode)) {
      onError?.(`Invalid barcode format: ${trimmedCode}`);
      return;
    }

    setBarcode(trimmedCode);
    onScan?.(trimmedCode);
  }, [validateBarcode, onScan, onError]);

  const simulateScan = useCallback((code: string) => {
    processBarcode(code);
  }, [processBarcode]);

  const resetBuffer = useCallback(() => {
    bufferRef.current = '';
    setBuffer('');
    setIsScanning(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const now = Date.now();
      const timeSinceLastKeystroke = now - lastKeystrokeTimeRef.current;

      // Check if we're in an input field (don't capture barcode when typing in forms)
      const activeElement = document.activeElement;
      const isInputField = activeElement instanceof HTMLInputElement ||
                          activeElement instanceof HTMLTextAreaElement ||
                          activeElement?.getAttribute('contenteditable') === 'true';

      // Allow barcode scanning even in input fields if it's rapid (scanner speed)
      // but only if the input is not focused or if typing is scanner-speed
      const isScannerSpeed = timeSinceLastKeystroke < maxKeystrokeDelay;

      // If we're in an input field and not scanning at scanner speed, let normal typing happen
      if (isInputField && !isScannerSpeed && bufferRef.current.length === 0) {
        return;
      }

      // Clear timeout if exists
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // If too much time has passed, reset the buffer
      if (timeSinceLastKeystroke > maxKeystrokeDelay && bufferRef.current.length > 0) {
        resetBuffer();
      }

      lastKeystrokeTimeRef.current = now;

      // Handle Enter key - process the buffer
      if (event.key === 'Enter') {
        if (bufferRef.current.length >= minLength) {
          if (preventDefault) {
            event.preventDefault();
            event.stopPropagation();
          }
          processBarcode(bufferRef.current);
        }
        resetBuffer();
        return;
      }

      // Only add printable characters to buffer
      if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
        // Start scanning indicator
        if (bufferRef.current.length === 0) {
          setIsScanning(true);
        }

        bufferRef.current += event.key;
        setBuffer(bufferRef.current);

        // If we're at scanner speed and in an input, prevent normal input
        if (isInputField && isScannerSpeed && bufferRef.current.length > 2) {
          event.preventDefault();
          event.stopPropagation();
        }

        // Set timeout to reset buffer if no more keystrokes
        timeoutRef.current = setTimeout(() => {
          // If buffer has content but no Enter was pressed, it might be a
          // scanner that doesn't send Enter - check if it looks like a barcode
          if (bufferRef.current.length >= minLength && validateBarcode(bufferRef.current)) {
            processBarcode(bufferRef.current);
          }
          resetBuffer();
        }, maxKeystrokeDelay * 3);
      }
    };

    const target = targetElement || document;
    target.addEventListener('keydown', handleKeyDown as EventListener, { capture: true });

    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener, { capture: true });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    enabled,
    minLength,
    maxKeystrokeDelay,
    preventDefault,
    targetElement,
    processBarcode,
    resetBuffer,
    validateBarcode,
  ]);

  return {
    barcode,
    isScanning,
    clear,
    simulateScan,
    buffer,
  };
}

/**
 * Hook to detect barcode scanner with automatic member lookup
 *
 * Combines barcode scanning with member lookup functionality
 */
export interface MemberLookupResult {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  barcode: string;
  phone?: string;
  status?: string;
}

export interface UseMemberBarcodeScannerConfig extends BarcodeScannerConfig {
  /** Callback when member is found */
  onMemberFound?: (member: MemberLookupResult) => void;
  /** Callback when member is not found */
  onMemberNotFound?: (barcode: string) => void;
  /** Organization ID for scoping the lookup */
  organizationId?: string;
}
