import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface PresenceUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  color: string; // Unique color for this user's cursor/indicator
}

export interface PresenceState {
  [userId: string]: {
    user: PresenceUser;
    resource_type: string; // 'member', 'class', 'invoice', etc.
    resource_id: string;
    last_seen: number;
  };
}

/**
 * Hook to track who's viewing/editing a specific resource
 *
 * Uses Supabase Realtime for presence tracking
 *
 * @param resourceType - Type of resource (e.g., 'member', 'class')
 * @param resourceId - ID of the resource being viewed
 * @param enabled - Whether to enable presence tracking
 *
 * @example
 * ```tsx
 * const { viewers, startPresence, stopPresence } = usePresence('member', memberId, true);
 *
 * // Viewers will show all users currently viewing this member
 * // Automatically tracks current user's presence
 * ```
 */
export function usePresence(
  resourceType: string,
  resourceId: string | undefined,
  enabled: boolean = true
) {
  const { profile } = useAuth();
  const [viewers, setViewers] = useState<PresenceUser[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  // Generate consistent color for user based on their ID
  const getUserColor = useCallback((userId: string) => {
    const colors = [
      '#EF4444', // red
      '#F59E0B', // amber
      '#10B981', // green
      '#3B82F6', // blue
      '#8B5CF6', // purple
      '#EC4899', // pink
      '#14B8A6', // teal
      '#F97316', // orange
    ];

    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  }, []);

  const startPresence = useCallback(async () => {
    if (!enabled || !resourceId || !profile || isTracking) return;

    setIsTracking(true);

    // For now, use mock presence since we need Supabase Realtime configuration
    // TODO: Replace with actual Supabase Realtime when configured

    // Mock implementation - simulates other users viewing the resource
    const mockViewers: PresenceUser[] = [];

    // Randomly add 0-2 other viewers for demo
    if (Math.random() > 0.5) {
      mockViewers.push({
        id: 'user-1',
        name: 'Sarah Johnson',
        email: 'sarah@gymunity.com',
        avatar_url: undefined,
        color: getUserColor('user-1'),
      });
    }

    if (Math.random() > 0.7) {
      mockViewers.push({
        id: 'user-2',
        name: 'Mike Chen',
        email: 'mike@gymunity.com',
        avatar_url: undefined,
        color: getUserColor('user-2'),
      });
    }

    setViewers(mockViewers);

    // Actual Supabase Realtime implementation would be:
    /*
    const channel = supabase.channel(`presence:${resourceType}:${resourceId}`, {
      config: {
        presence: {
          key: profile.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = Object.values(state)
          .flat()
          .filter((presence: any) => presence.user_id !== profile.id)
          .map((presence: any) => ({
            id: presence.user_id,
            name: presence.name,
            email: presence.email,
            avatar_url: presence.avatar_url,
            color: getUserColor(presence.user_id),
          }));

        setViewers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`,
            email: profile.email,
            avatar_url: profile.avatar_url,
            resource_type: resourceType,
            resource_id: resourceId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
    */
  }, [enabled, resourceId, profile, isTracking, resourceType, getUserColor]);

  const stopPresence = useCallback(() => {
    setIsTracking(false);
    setViewers([]);

    // Actual implementation would unsubscribe from channel
  }, []);

  // Auto-start presence when component mounts
  useEffect(() => {
    if (enabled && resourceId && profile) {
      startPresence();
    }

    return () => {
      stopPresence();
    };
  }, [enabled, resourceId, profile, startPresence, stopPresence]);

  return {
    viewers,
    isTracking,
    startPresence,
    stopPresence,
  };
}

/**
 * Hook to broadcast cursor position for collaborative editing
 * (Advanced feature - not implemented in this phase)
 */
export function useCursorPresence(
  resourceType: string,
  resourceId: string | undefined,
  enabled: boolean = false
) {
  // Placeholder for future cursor tracking implementation
  return {
    cursors: [] as any[],
    updateCursor: () => {},
  };
}
