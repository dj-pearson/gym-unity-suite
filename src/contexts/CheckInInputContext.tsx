import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useBarcodeScanner, type BarcodeScannerConfig } from '@/hooks/useBarcodeScanner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Unified Check-In Input Provider
 *
 * This context provides a single interface for multiple check-in input methods:
 * - USB/Bluetooth barcode scanner (keyboard emulation)
 * - Camera QR/barcode scanning
 * - Manual search and selection
 * - NFC reader (future)
 * - RFID key fob (future)
 *
 * All input methods normalize to a member lookup, then trigger the check-in flow.
 */

export type CheckInInputMethod = 'manual' | 'usb_scanner' | 'camera' | 'nfc' | 'rfid';

export interface MemberLookupResult {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  barcode: string | null;
  phone?: string;
  status?: string;
  avatar_url?: string;
  membership_status?: string;
  membership_type?: string;
}

export interface CheckInInputState {
  /** Currently identified member (if any) */
  member: MemberLookupResult | null;
  /** Whether a lookup is in progress */
  isLookingUp: boolean;
  /** Last error message */
  error: string | null;
  /** Input method that triggered the last lookup */
  lastInputMethod: CheckInInputMethod | null;
  /** Whether the USB scanner detected a scan in progress */
  isScannerActive: boolean;
  /** Current scanner buffer (for visual feedback) */
  scannerBuffer: string;
  /** Whether camera scanner is open */
  isCameraOpen: boolean;
}

export interface CheckInInputActions {
  /** Look up a member by barcode/card number */
  lookupByBarcode: (barcode: string, method?: CheckInInputMethod) => Promise<MemberLookupResult | null>;
  /** Look up a member by NFC UID */
  lookupByNfcUid: (uid: string) => Promise<MemberLookupResult | null>;
  /** Look up a member by member ID (UUID) */
  lookupByMemberId: (memberId: string) => Promise<MemberLookupResult | null>;
  /** Set the current member (from manual selection) */
  setMember: (member: MemberLookupResult | null) => void;
  /** Clear current member and error state */
  clear: () => void;
  /** Open the camera scanner */
  openCamera: () => void;
  /** Close the camera scanner */
  closeCamera: () => void;
  /** Toggle USB scanner enabled state */
  setScannerEnabled: (enabled: boolean) => void;
}

export interface CheckInInputContextValue extends CheckInInputState, CheckInInputActions {}

const CheckInInputContext = createContext<CheckInInputContextValue | null>(null);

export interface CheckInInputProviderProps {
  children: React.ReactNode;
  /** Whether to enable USB barcode scanner detection */
  enableUsbScanner?: boolean;
  /** Callback when a member is identified via any input method */
  onMemberIdentified?: (member: MemberLookupResult, method: CheckInInputMethod) => void;
  /** Callback when member lookup fails */
  onMemberNotFound?: (identifier: string, method: CheckInInputMethod) => void;
  /** Valid barcode patterns */
  validBarcodePatterns?: RegExp[];
}

export function CheckInInputProvider({
  children,
  enableUsbScanner = true,
  onMemberIdentified,
  onMemberNotFound,
  validBarcodePatterns = [/^\d{12}$/, /^[A-Z0-9]{8,16}$/i],
}: CheckInInputProviderProps) {
  const { organization } = useAuth();
  const { toast } = useToast();

  const [member, setMemberState] = useState<MemberLookupResult | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInputMethod, setLastInputMethod] = useState<CheckInInputMethod | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scannerEnabled, setScannerEnabled] = useState(enableUsbScanner);

  // USB Barcode Scanner Hook
  const {
    barcode: scannedBarcode,
    isScanning: isScannerActive,
    buffer: scannerBuffer,
    clear: clearScanner,
  } = useBarcodeScanner({
    enabled: scannerEnabled,
    validPatterns: validBarcodePatterns,
    onScan: (barcode) => {
      // Automatically look up member when barcode is scanned
      lookupByBarcode(barcode, 'usb_scanner');
    },
    onError: (error) => {
      console.error('Scanner error:', error);
    },
  });

  // Member lookup by barcode
  const lookupByBarcode = useCallback(async (
    barcode: string,
    method: CheckInInputMethod = 'manual'
  ): Promise<MemberLookupResult | null> => {
    if (!organization?.id) {
      setError('Organization not found');
      return null;
    }

    setIsLookingUp(true);
    setError(null);
    setLastInputMethod(method);

    try {
      // Search by barcode in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          barcode,
          phone,
          avatar_url
        `)
        .eq('organization_id', organization.id)
        .eq('barcode', barcode.trim())
        .single();

      if (profileError || !profileData) {
        // Try searching in member_cards table
        const { data: cardData, error: cardError } = await supabase
          .from('member_cards')
          .select(`
            member_id,
            profiles!member_cards_member_id_fkey (
              id,
              first_name,
              last_name,
              email,
              barcode,
              phone,
              avatar_url
            )
          `)
          .or(`barcode.eq.${barcode.trim()},card_number.eq.${barcode.trim()}`)
          .eq('status', 'active')
          .single();

        if (cardError || !cardData?.profiles) {
          const errorMsg = `Member not found with barcode: ${barcode}`;
          setError(errorMsg);
          onMemberNotFound?.(barcode, method);
          toast({
            title: 'Member Not Found',
            description: 'No member found with this barcode. Please try again or search manually.',
            variant: 'destructive',
          });
          return null;
        }

        // Found via member_cards
        const memberData = cardData.profiles as unknown as MemberLookupResult;
        setMemberState(memberData);
        onMemberIdentified?.(memberData, method);

        toast({
          title: 'Member Found',
          description: `${memberData.first_name} ${memberData.last_name}`,
        });

        return memberData;
      }

      // Found via profiles.barcode
      const memberData: MemberLookupResult = {
        id: profileData.id,
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: profileData.email || '',
        barcode: profileData.barcode,
        phone: profileData.phone,
        avatar_url: profileData.avatar_url,
      };

      setMemberState(memberData);
      onMemberIdentified?.(memberData, method);

      toast({
        title: 'Member Found',
        description: `${memberData.first_name} ${memberData.last_name}`,
      });

      return memberData;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to look up member';
      setError(errorMsg);
      console.error('Member lookup error:', err);
      return null;
    } finally {
      setIsLookingUp(false);
    }
  }, [organization?.id, onMemberIdentified, onMemberNotFound, toast]);

  // Member lookup by NFC UID
  const lookupByNfcUid = useCallback(async (uid: string): Promise<MemberLookupResult | null> => {
    if (!organization?.id) {
      setError('Organization not found');
      return null;
    }

    setIsLookingUp(true);
    setError(null);
    setLastInputMethod('nfc');

    try {
      const { data, error: lookupError } = await supabase
        .from('member_cards')
        .select(`
          member_id,
          profiles!member_cards_member_id_fkey (
            id,
            first_name,
            last_name,
            email,
            barcode,
            phone,
            avatar_url
          )
        `)
        .eq('nfc_uid', uid.trim())
        .eq('nfc_enabled', true)
        .eq('status', 'active')
        .single();

      if (lookupError || !data?.profiles) {
        const errorMsg = 'Member not found with this NFC card';
        setError(errorMsg);
        onMemberNotFound?.(uid, 'nfc');
        toast({
          title: 'Card Not Recognized',
          description: 'This NFC card is not registered. Please use another method.',
          variant: 'destructive',
        });
        return null;
      }

      const memberData = data.profiles as unknown as MemberLookupResult;
      setMemberState(memberData);
      onMemberIdentified?.(memberData, 'nfc');

      toast({
        title: 'Member Found',
        description: `${memberData.first_name} ${memberData.last_name}`,
      });

      return memberData;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to look up member';
      setError(errorMsg);
      console.error('NFC lookup error:', err);
      return null;
    } finally {
      setIsLookingUp(false);
    }
  }, [organization?.id, onMemberIdentified, onMemberNotFound, toast]);

  // Member lookup by ID (for manual selection)
  const lookupByMemberId = useCallback(async (memberId: string): Promise<MemberLookupResult | null> => {
    if (!organization?.id) {
      setError('Organization not found');
      return null;
    }

    setIsLookingUp(true);
    setError(null);
    setLastInputMethod('manual');

    try {
      const { data, error: lookupError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          barcode,
          phone,
          avatar_url
        `)
        .eq('organization_id', organization.id)
        .eq('id', memberId)
        .single();

      if (lookupError || !data) {
        setError('Member not found');
        return null;
      }

      const memberData: MemberLookupResult = {
        id: data.id,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        barcode: data.barcode,
        phone: data.phone,
        avatar_url: data.avatar_url,
      };

      setMemberState(memberData);
      onMemberIdentified?.(memberData, 'manual');

      return memberData;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to look up member';
      setError(errorMsg);
      console.error('Member ID lookup error:', err);
      return null;
    } finally {
      setIsLookingUp(false);
    }
  }, [organization?.id, onMemberIdentified]);

  // Set member directly (from manual selection)
  const setMember = useCallback((memberData: MemberLookupResult | null) => {
    setMemberState(memberData);
    setError(null);
    if (memberData) {
      setLastInputMethod('manual');
      onMemberIdentified?.(memberData, 'manual');
    }
  }, [onMemberIdentified]);

  // Clear state
  const clear = useCallback(() => {
    setMemberState(null);
    setError(null);
    setLastInputMethod(null);
    clearScanner();
  }, [clearScanner]);

  // Camera controls
  const openCamera = useCallback(() => {
    setIsCameraOpen(true);
  }, []);

  const closeCamera = useCallback(() => {
    setIsCameraOpen(false);
  }, []);

  const value: CheckInInputContextValue = {
    // State
    member,
    isLookingUp,
    error,
    lastInputMethod,
    isScannerActive,
    scannerBuffer,
    isCameraOpen,
    // Actions
    lookupByBarcode,
    lookupByNfcUid,
    lookupByMemberId,
    setMember,
    clear,
    openCamera,
    closeCamera,
    setScannerEnabled,
  };

  return (
    <CheckInInputContext.Provider value={value}>
      {children}
    </CheckInInputContext.Provider>
  );
}

/**
 * Hook to access check-in input context
 */
export function useCheckInInput() {
  const context = useContext(CheckInInputContext);
  if (!context) {
    throw new Error('useCheckInInput must be used within a CheckInInputProvider');
  }
  return context;
}

/**
 * Hook for components that just need the identified member
 */
export function useIdentifiedMember() {
  const { member, isLookingUp, error, clear } = useCheckInInput();
  return { member, isLookingUp, error, clear };
}

export default CheckInInputProvider;
