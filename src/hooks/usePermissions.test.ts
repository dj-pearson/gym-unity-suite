import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions, PERMISSIONS, UserRole } from './usePermissions';

// Mock the useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';

const mockUseAuth = vi.mocked(useAuth);

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PERMISSIONS constant', () => {
    it('should have owner role in most permissions', () => {
      // Owner is in most permissions, except BOOK_CLASSES which is for members/trainers
      const permissionsWithOwner = Object.entries(PERMISSIONS).filter(
        ([key]) => key !== 'BOOK_CLASSES'
      );
      permissionsWithOwner.forEach(([_, permission]) => {
        expect(permission.roles).toContain('owner');
      });
    });

    it('should have BOOK_CLASSES for member, staff, trainer only', () => {
      expect(PERMISSIONS.BOOK_CLASSES.roles).toEqual(['member', 'staff', 'trainer']);
    });

    it('should have VIEW_DASHBOARD accessible by all roles', () => {
      const expectedRoles: UserRole[] = ['owner', 'manager', 'staff', 'trainer', 'member'];
      expect(PERMISSIONS.VIEW_DASHBOARD.roles).toEqual(expectedRoles);
    });

    it('should restrict DELETE_MEMBERS to owner and manager only', () => {
      expect(PERMISSIONS.DELETE_MEMBERS.roles).toEqual(['owner', 'manager']);
    });

    it('should restrict MANAGE_SYSTEM to owner only', () => {
      expect(PERMISSIONS.MANAGE_SYSTEM.roles).toEqual(['owner']);
    });
  });

  describe('hasPermission', () => {
    it('should return false when profile is null', () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        user: null,
        organization: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasPermission(PERMISSIONS.VIEW_MEMBERS)).toBe(false);
    });

    it('should return true when user has required permission', () => {
      mockUseAuth.mockReturnValue({
        profile: { id: '1', organization_id: 'org1', email: 'test@test.com', role: 'owner' },
        user: null,
        organization: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasPermission(PERMISSIONS.VIEW_MEMBERS)).toBe(true);
    });

    it('should return false when user lacks required permission', () => {
      mockUseAuth.mockReturnValue({
        profile: { id: '1', organization_id: 'org1', email: 'test@test.com', role: 'member' },
        user: null,
        organization: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasPermission(PERMISSIONS.VIEW_MEMBERS)).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the exact role', () => {
      mockUseAuth.mockReturnValue({
        profile: { id: '1', organization_id: 'org1', email: 'test@test.com', role: 'manager' },
        user: null,
        organization: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasRole('manager')).toBe(true);
    });

    it('should return false when user has different role', () => {
      mockUseAuth.mockReturnValue({
        profile: { id: '1', organization_id: 'org1', email: 'test@test.com', role: 'staff' },
        user: null,
        organization: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasRole('manager')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has one of the specified roles', () => {
      mockUseAuth.mockReturnValue({
        profile: { id: '1', organization_id: 'org1', email: 'test@test.com', role: 'manager' },
        user: null,
        organization: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasAnyRole(['owner', 'manager'])).toBe(true);
    });

    it('should return false when user has none of the specified roles', () => {
      mockUseAuth.mockReturnValue({
        profile: { id: '1', organization_id: 'org1', email: 'test@test.com', role: 'member' },
        user: null,
        organization: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasAnyRole(['owner', 'manager'])).toBe(false);
    });

    it('should return false when profile is null', () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        user: null,
        organization: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasAnyRole(['owner', 'manager'])).toBe(false);
    });
  });

  describe('role helper functions', () => {
    it('isAdmin should return true for owner', () => {
      mockUseAuth.mockReturnValue({
        profile: { id: '1', organization_id: 'org1', email: 'test@test.com', role: 'owner' },
        user: null,
        organization: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.isAdmin()).toBe(true);
    });

    it('isAdmin should return true for manager', () => {
      mockUseAuth.mockReturnValue({
        profile: { id: '1', organization_id: 'org1', email: 'test@test.com', role: 'manager' },
        user: null,
        organization: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.isAdmin()).toBe(true);
    });

    it('isAdmin should return false for staff', () => {
      mockUseAuth.mockReturnValue({
        profile: { id: '1', organization_id: 'org1', email: 'test@test.com', role: 'staff' },
        user: null,
        organization: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.isAdmin()).toBe(false);
    });

    it('isOwner should return true only for owner', () => {
      mockUseAuth.mockReturnValue({
        profile: { id: '1', organization_id: 'org1', email: 'test@test.com', role: 'owner' },
        user: null,
        organization: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.isOwner()).toBe(true);
    });

    it('isStaff should return true for owner, manager, and staff', () => {
      const staffRoles: UserRole[] = ['owner', 'manager', 'staff'];

      staffRoles.forEach((role) => {
        mockUseAuth.mockReturnValue({
          profile: { id: '1', organization_id: 'org1', email: 'test@test.com', role },
          user: null,
          organization: null,
          session: null,
          loading: false,
          signIn: vi.fn(),
          signUp: vi.fn(),
          signOut: vi.fn(),
          refreshProfile: vi.fn(),
        });

        const { result } = renderHook(() => usePermissions());
        expect(result.current.isStaff()).toBe(true);
      });
    });

    it('isMember should return true only for member', () => {
      mockUseAuth.mockReturnValue({
        profile: { id: '1', organization_id: 'org1', email: 'test@test.com', role: 'member' },
        user: null,
        organization: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.isMember()).toBe(true);
    });
  });

  describe('userRole property', () => {
    it('should return the user role from profile', () => {
      mockUseAuth.mockReturnValue({
        profile: { id: '1', organization_id: 'org1', email: 'test@test.com', role: 'trainer' },
        user: null,
        organization: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.userRole).toBe('trainer');
    });

    it('should return undefined when profile is null', () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        user: null,
        organization: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.userRole).toBeUndefined();
    });
  });
});
