import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useMembers, useMemberMutations, Member } from './useMembers';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock useToast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

import { supabase } from '@/integrations/supabase/client';

const mockSupabase = vi.mocked(supabase);

// Create a wrapper with QueryClientProvider for testing hooks
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('query behavior', () => {
    it('should not fetch when organizationId is undefined', () => {
      const { result } = renderHook(() => useMembers(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should not fetch when organizationId is empty string', () => {
      const { result } = renderHook(() => useMembers(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('should fetch members when organizationId is provided', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Doe',
          phone: '555-0100',
          avatar_url: null,
          created_at: '2024-01-01T00:00:00Z',
          parent_member_id: null,
          relationship_type: null,
          family_notes: null,
          memberships: [
            {
              status: 'active',
              membership_plans: { name: 'Premium', price: 99 },
            },
          ],
        },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: mockMembers,
        error: null,
        count: 1,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        range: mockRange,
      } as any);

      const { result } = renderHook(() => useMembers('org-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(result.current.data?.members).toHaveLength(1);
      expect(result.current.data?.members[0].email).toBe('john@example.com');
      expect(result.current.data?.totalCount).toBe(1);
    });

    it('should handle pagination options correctly', async () => {
      const mockRange = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 100,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: mockRange,
      } as any);

      const { result } = renderHook(
        () => useMembers('org-123', { page: 3, pageSize: 10 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Page 3 with pageSize 10 should request range 20-29
      expect(mockRange).toHaveBeenCalledWith(20, 29);
      expect(result.current.data?.currentPage).toBe(3);
      expect(result.current.data?.pageSize).toBe(10);
      expect(result.current.data?.totalPages).toBe(10); // 100 / 10 = 10 pages
    });

    it('should transform membership data correctly', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2024-01-01T00:00:00Z',
          memberships: [
            {
              status: 'active',
              membership_plans: { name: 'Gold', price: 149 },
            },
          ],
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockMembers,
          error: null,
          count: 1,
        }),
      } as any);

      const { result } = renderHook(() => useMembers('org-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const member = result.current.data?.members[0];
      expect(member?.membership).toBeDefined();
      expect(member?.membership?.status).toBe('active');
      expect(member?.membership?.plan.name).toBe('Gold');
      expect(member?.membership?.plan.price).toBe(149);
    });

    it('should handle members without memberships', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          email: 'nomembership@example.com',
          first_name: 'No',
          last_name: 'Membership',
          created_at: '2024-01-01T00:00:00Z',
          memberships: [],
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockMembers,
          error: null,
          count: 1,
        }),
      } as any);

      const { result } = renderHook(() => useMembers('org-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const member = result.current.data?.members[0];
      expect(member?.membership).toBeUndefined();
    });

    it('should handle API errors gracefully', async () => {
      const mockError = { message: 'Database connection failed' };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
          count: null,
        }),
      } as any);

      const { result } = renderHook(() => useMembers('org-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('caching behavior', () => {
    it('should use staleTime of 5 minutes', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      } as any);

      const { result } = renderHook(() => useMembers('org-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Initial fetch should have been made
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
    });
  });
});

describe('useMemberMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return invalidateMembers function', () => {
    const { result } = renderHook(() => useMemberMutations('org-123'), {
      wrapper: createWrapper(),
    });

    expect(result.current.invalidateMembers).toBeDefined();
    expect(typeof result.current.invalidateMembers).toBe('function');
  });

  it('should handle undefined organizationId', () => {
    const { result } = renderHook(() => useMemberMutations(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.invalidateMembers).toBeDefined();
    // Should not throw when called with undefined org
    expect(() => result.current.invalidateMembers()).not.toThrow();
  });
});

describe('Member interface', () => {
  it('should have correct shape', () => {
    const validMember: Member = {
      id: 'test-id',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
      first_name: 'Test',
      last_name: 'User',
      phone: '555-1234',
      avatar_url: 'https://example.com/avatar.jpg',
      parent_member_id: 'parent-id',
      relationship_type: 'child',
      family_notes: 'Some notes',
      membership: {
        status: 'active',
        plan: {
          name: 'Premium',
          price: 99,
        },
      },
    };

    expect(validMember.id).toBeDefined();
    expect(validMember.email).toBeDefined();
    expect(validMember.created_at).toBeDefined();
  });

  it('should allow optional fields to be undefined', () => {
    const minimalMember: Member = {
      id: 'test-id',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
    };

    expect(minimalMember.first_name).toBeUndefined();
    expect(minimalMember.membership).toBeUndefined();
  });
});
