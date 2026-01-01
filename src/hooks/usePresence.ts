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

    // Use Supabase Realtime for actual presence tracking
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

    // Store channel reference for cleanup
    (window as any).__presenceChannel = channel;
  }, [enabled, resourceId, profile, isTracking, resourceType, getUserColor]);

  const stopPresence = useCallback(() => {
    setIsTracking(false);
    setViewers([]);

    // Unsubscribe from the Supabase Realtime channel
    const channel = (window as any).__presenceChannel;
    if (channel) {
      channel.unsubscribe();
      delete (window as any).__presenceChannel;
    }
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
