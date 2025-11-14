import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface Member {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  parent_member_id?: string;
  relationship_type?: string;
  family_notes?: string;
  membership?: {
    status: string;
    plan: {
      name: string;
      price: number;
    };
  };
}

/**
 * Fetch members for an organization using React Query
 * Provides automatic caching, refetching, and error handling
 */
export function useMembers(organizationId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: queryKeys.members.list(organizationId || ''),
    queryFn: async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone,
          avatar_url,
          created_at,
          parent_member_id,
          relationship_type,
          family_notes,
          memberships (
            status,
            membership_plans (
              name,
              price
            )
          )
        `)
        .eq('organization_id', organizationId)
        .eq('role', 'member')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error fetching members",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      // Transform the data to match our interface
      const transformedMembers: Member[] = data.map(member => ({
        ...member,
        membership: member.memberships?.[0] ? {
          status: member.memberships[0].status,
          plan: member.memberships[0].membership_plans
        } : undefined
      }));

      return transformedMembers;
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for member mutations (create, update, delete)
 */
export function useMemberMutations(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateMembers = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.members.list(organizationId || ''),
    });
  };

  // Add more mutations as needed (create, update, delete)
  // Example:
  // const createMember = useMutation({...})
  // const updateMember = useMutation({...})
  // const deleteMember = useMutation({...})

  return {
    invalidateMembers,
    // Export mutations here when implemented
  };
}
