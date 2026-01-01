import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useCheckIn, usePendingCheckIns, useSyncPendingCheckIns, CheckInData } from './useCheckIn';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock useToast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock IndexedDB functions
vi.mock('@/lib/db', () => ({
  addPendingCheckIn: vi.fn(),
  getPendingCheckIns: vi.fn(),
  removePendingCheckIn: vi.fn(),
}));

import { supabase } from '@/integrations/supabase/client';
import { addPendingCheckIn, getPendingCheckIns, removePendingCheckIn } from '@/lib/db';

const mockSupabase = vi.mocked(supabase);
const mockAddPendingCheckIn = vi.mocked(addPendingCheckIn);
const mockGetPendingCheckIns = vi.mocked(getPendingCheckIns);
const mockRemovePendingCheckIn = vi.mocked(removePendingCheckIn);

// Create a wrapper with QueryClientProvider for testing hooks
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCheckIn', () => {
  // Save original navigator.onLine
  const originalOnline = navigator.onLine;

  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockClear();
    // Reset navigator.onLine to true
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnline,
      writable: true,
    });
  });

  describe('online check-in', () => {
    it('should successfully check in a member when online', async () => {
      const mockCheckIn = {
        id: 'checkin-123',
        member_id: 'member-1',
        organization_id: 'org-1',
        location_id: 'loc-1',
        checked_in_at: '2024-01-01T10:00:00Z',
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockCheckIn,
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      } as any);

      const { result } = renderHook(() => useCheckIn(), {
        wrapper: createWrapper(),
      });

      const checkInData: CheckInData = {
        member_id: 'member-1',
        organization_id: 'org-1',
        location_id: 'loc-1',
        notes: 'Regular check-in',
      };

      await act(async () => {
        await result.current.checkInAsync(checkInData);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('check_ins');
      expect(mockInsert).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Check-in successful',
        })
      );
    });

    it('should handle check-in errors', async () => {
      const mockError = { message: 'Database error' };

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      } as any);

      const { result } = renderHook(() => useCheckIn(), {
        wrapper: createWrapper(),
      });

      const checkInData: CheckInData = {
        member_id: 'member-1',
        organization_id: 'org-1',
        location_id: 'loc-1',
      };

      await act(async () => {
        try {
          await result.current.checkInAsync(checkInData);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Check-in failed',
          variant: 'destructive',
        })
      );
    });
  });

  describe('offline check-in', () => {
    it('should queue check-in when offline', async () => {
      // Simulate offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      mockAddPendingCheckIn.mockResolvedValue(1);

      // Mock service worker
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({
            sync: {
              register: vi.fn().mockResolvedValue(undefined),
            },
          }),
        },
        writable: true,
      });

      const { result } = renderHook(() => useCheckIn(), {
        wrapper: createWrapper(),
      });

      const checkInData: CheckInData = {
        member_id: 'member-1',
        organization_id: 'org-1',
        location_id: 'loc-1',
      };

      await act(async () => {
        await result.current.checkInAsync(checkInData);
      });

      expect(mockAddPendingCheckIn).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Check-in queued',
        })
      );
    });
  });

  describe('hook state', () => {
    it('should expose isCheckingIn state', () => {
      const { result } = renderHook(() => useCheckIn(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isCheckingIn).toBe(false);
      expect(typeof result.current.checkIn).toBe('function');
      expect(typeof result.current.checkInAsync).toBe('function');
    });

    it('should have error as null initially', () => {
      const { result } = renderHook(() => useCheckIn(), {
        wrapper: createWrapper(),
      });

      expect(result.current.error).toBeNull();
    });
  });
});

describe('usePendingCheckIns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch pending check-ins from IndexedDB', async () => {
    const mockPending = [
      {
        id: 1,
        member_id: 'member-1',
        organization_id: 'org-1',
        location_id: 'loc-1',
        checked_in_at: '2024-01-01T10:00:00Z',
        created_at: Date.now(),
        retries: 0,
      },
    ];

    mockGetPendingCheckIns.mockResolvedValue(mockPending);

    const { result } = renderHook(() => usePendingCheckIns(), {
      wrapper: createWrapper(),
    });

    let pendingResult: typeof mockPending | undefined;
    await act(async () => {
      pendingResult = await result.current.getPendingAsync();
    });

    expect(mockGetPendingCheckIns).toHaveBeenCalled();
    expect(pendingResult).toEqual(mockPending);
  });

  it('should expose loading state', () => {
    const { result } = renderHook(() => usePendingCheckIns(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.getPending).toBe('function');
    expect(typeof result.current.getPendingAsync).toBe('function');
  });
});

describe('useSyncPendingCheckIns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockClear();
  });

  it('should sync pending check-ins successfully', async () => {
    const mockPending = [
      {
        id: 1,
        member_id: 'member-1',
        organization_id: 'org-1',
        location: 'Main Gym',
        checked_in_at: '2024-01-01T10:00:00Z',
        created_at: Date.now(),
        retries: 0,
      },
    ];

    mockGetPendingCheckIns.mockResolvedValue(mockPending);
    mockRemovePendingCheckIn.mockResolvedValue(undefined);

    const mockInsert = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      insert: mockInsert,
    } as any);

    const { result } = renderHook(() => useSyncPendingCheckIns(), {
      wrapper: createWrapper(),
    });

    let syncResult: { synced: number; failed: number } | undefined;
    await act(async () => {
      syncResult = await result.current.syncAsync();
    });

    expect(syncResult?.synced).toBe(1);
    expect(syncResult?.failed).toBe(0);
    expect(mockRemovePendingCheckIn).toHaveBeenCalledWith(1);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Check-ins synced',
      })
    );
  });

  it('should handle no pending check-ins', async () => {
    mockGetPendingCheckIns.mockResolvedValue([]);

    const { result } = renderHook(() => useSyncPendingCheckIns(), {
      wrapper: createWrapper(),
    });

    let syncResult: { synced: number; failed: number } | undefined;
    await act(async () => {
      syncResult = await result.current.syncAsync();
    });

    expect(syncResult?.synced).toBe(0);
    expect(syncResult?.failed).toBe(0);
    // Should not show toast when nothing to sync
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('should handle sync failures', async () => {
    const mockPending = [
      {
        id: 1,
        member_id: 'member-1',
        organization_id: 'org-1',
        location: 'Main Gym',
        checked_in_at: '2024-01-01T10:00:00Z',
        created_at: Date.now(),
        retries: 0,
      },
    ];

    mockGetPendingCheckIns.mockResolvedValue(mockPending);

    const mockInsert = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Network error' },
    });

    mockSupabase.from.mockReturnValue({
      insert: mockInsert,
    } as any);

    const { result } = renderHook(() => useSyncPendingCheckIns(), {
      wrapper: createWrapper(),
    });

    let syncResult: { synced: number; failed: number } | undefined;
    await act(async () => {
      syncResult = await result.current.syncAsync();
    });

    expect(syncResult?.synced).toBe(0);
    expect(syncResult?.failed).toBe(1);
    // Should not remove from IndexedDB on failure
    expect(mockRemovePendingCheckIn).not.toHaveBeenCalled();
  });

  it('should expose syncing state', () => {
    const { result } = renderHook(() => useSyncPendingCheckIns(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isSyncing).toBe(false);
    expect(typeof result.current.sync).toBe('function');
    expect(typeof result.current.syncAsync).toBe('function');
  });
});

describe('CheckInData interface', () => {
  it('should accept valid check-in data', () => {
    const validCheckIn: CheckInData = {
      member_id: 'member-123',
      organization_id: 'org-456',
      location_id: 'loc-789',
      notes: 'Morning workout',
      location: 'Main Gym',
      metadata: {
        source: 'mobile-app',
        version: '1.0.0',
      },
    };

    expect(validCheckIn.member_id).toBeDefined();
    expect(validCheckIn.organization_id).toBeDefined();
    expect(validCheckIn.location_id).toBeDefined();
  });

  it('should allow optional fields', () => {
    const minimalCheckIn: CheckInData = {
      member_id: 'member-123',
      organization_id: 'org-456',
      location_id: 'loc-789',
    };

    expect(minimalCheckIn.notes).toBeUndefined();
    expect(minimalCheckIn.metadata).toBeUndefined();
  });
});
