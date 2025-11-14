import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  addPendingCheckIn,
  getPendingCheckIns,
  removePendingCheckIn,
  type PendingCheckIn,
} from '@/lib/db';

export interface CheckInData {
  member_id: string;
  organization_id: string;
  notes?: string;
  location?: string;
  metadata?: Record<string, any>;
}

/**
 * Hook for handling member check-ins with offline support
 *
 * When online: Immediately syncs to Supabase
 * When offline: Stores in IndexedDB and syncs via Service Worker background sync
 *
 * @example
 * ```tsx
 * const { checkIn, isCheckingIn } = useCheckIn();
 *
 * const handleCheckIn = async () => {
 *   await checkIn({
 *     member_id: 'abc-123',
 *     organization_id: 'org-456',
 *     notes: 'Regular check-in',
 *     location: 'Main Gym',
 *   });
 * };
 * ```
 */
export function useCheckIn() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const checkInMutation = useMutation({
    mutationFn: async (data: CheckInData) => {
      const checkInData = {
        ...data,
        checked_in_at: new Date().toISOString(),
      };

      // Check if online
      if (!navigator.onLine) {
        // Store in IndexedDB for background sync
        const pendingId = await addPendingCheckIn(checkInData);

        // Request background sync
        if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
          try {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('sync-check-ins');
          } catch (error) {
            console.error('Background sync registration failed:', error);
          }
        }

        return { success: true, pendingId, offline: true };
      }

      // Online - sync immediately to Supabase
      const { data: checkIn, error } = await supabase
        .from('check_ins')
        .insert([checkInData])
        .select()
        .single();

      if (error) throw error;

      return { success: true, checkIn, offline: false };
    },
    onSuccess: (result) => {
      if (result.offline) {
        toast({
          title: 'Check-in queued',
          description:
            'You\'re offline. This check-in will sync automatically when you\'re back online.',
        });
      } else {
        toast({
          title: 'Check-in successful',
          description: 'Member has been checked in.',
        });
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['check-ins'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (error: any) => {
      console.error('Check-in error:', error);
      toast({
        title: 'Check-in failed',
        description: error.message || 'Could not complete check-in. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    checkIn: checkInMutation.mutate,
    checkInAsync: checkInMutation.mutateAsync,
    isCheckingIn: checkInMutation.isPending,
    error: checkInMutation.error,
  };
}

/**
 * Hook to get pending check-ins from IndexedDB
 *
 * Useful for displaying queued offline check-ins to the user
 */
export function usePendingCheckIns() {
  const { toast } = useToast();

  const query = useMutation({
    mutationFn: async () => {
      const pending = await getPendingCheckIns();
      return pending;
    },
  });

  return {
    getPending: query.mutate,
    getPendingAsync: query.mutateAsync,
    isLoading: query.isPending,
    error: query.error,
  };
}

/**
 * Hook to manually trigger sync of pending check-ins
 *
 * Useful for showing a "Sync Now" button to users
 */
export function useSyncPendingCheckIns() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: async () => {
      // Get all pending check-ins
      const pending = await getPendingCheckIns();

      if (pending.length === 0) {
        return { synced: 0, failed: 0 };
      }

      // Try to sync each one
      const results = await Promise.allSettled(
        pending.map(async (checkIn) => {
          try {
            // Remove the IndexedDB-specific fields
            const { id, created_at, retries, ...checkInData } = checkIn;

            // Insert to Supabase
            const { error } = await supabase
              .from('check_ins')
              .insert([checkInData]);

            if (error) throw error;

            // Remove from IndexedDB on success
            await removePendingCheckIn(checkIn.id);

            return { success: true, id: checkIn.id };
          } catch (error) {
            console.error('Failed to sync check-in:', checkIn.id, error);
            return { success: false, id: checkIn.id, error };
          }
        })
      );

      const synced = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success
      ).length;
      const failed = results.length - synced;

      return { synced, failed };
    },
    onSuccess: ({ synced, failed }) => {
      if (synced > 0) {
        toast({
          title: 'Check-ins synced',
          description: `Successfully synced ${synced} check-in${synced !== 1 ? 's' : ''}${
            failed > 0 ? `. ${failed} failed.` : '.'
          }`,
        });

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['check-ins'] });
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
      } else if (failed > 0) {
        toast({
          title: 'Sync failed',
          description: 'Could not sync pending check-ins. Please try again.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Sync error',
        description: error.message || 'An error occurred while syncing.',
        variant: 'destructive',
      });
    },
  });

  return {
    sync: syncMutation.mutate,
    syncAsync: syncMutation.mutateAsync,
    isSyncing: syncMutation.isPending,
    error: syncMutation.error,
  };
}

/**
 * Get check-in statistics
 */
export interface CheckInStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export function useCheckInStats(organizationId: string | undefined) {
  return useMutation({
    mutationFn: async (): Promise<CheckInStats> => {
      if (!organizationId) {
        return { total: 0, today: 0, thisWeek: 0, thisMonth: 0 };
      }

      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const startOfWeek = new Date(
        now.setDate(now.getDate() - now.getDay())
      ).toISOString();
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).toISOString();

      const [totalResult, todayResult, weekResult, monthResult] =
        await Promise.all([
          supabase
            .from('check_ins')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId),

          supabase
            .from('check_ins')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .gte('checked_in_at', startOfDay),

          supabase
            .from('check_ins')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .gte('checked_in_at', startOfWeek),

          supabase
            .from('check_ins')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .gte('checked_in_at', startOfMonth),
        ]);

      return {
        total: totalResult.count || 0,
        today: todayResult.count || 0,
        thisWeek: weekResult.count || 0,
        thisMonth: monthResult.count || 0,
      };
    },
  });
}
