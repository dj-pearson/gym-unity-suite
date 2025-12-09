import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PERMISSIONS } from '@/hooks/usePermissions';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the permissions hook
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: vi.fn(),
  PERMISSIONS: {
    VIEW_MEMBERS: { roles: ['owner', 'manager', 'staff'] },
    VIEW_DASHBOARD: { roles: ['owner', 'manager', 'staff', 'trainer', 'member'] },
    MANAGE_SYSTEM: { roles: ['owner'] },
  },
}));

import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

const mockUseAuth = vi.mocked(useAuth);
const mockUsePermissions = vi.mocked(usePermissions);

const renderWithRouter = (component: React.ReactNode, initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {component}
    </MemoryRouter>
  );
};

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner while authenticating', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
        organization: null,
        session: null,
        loading: true,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(() => true),
        hasRole: vi.fn(() => true),
        hasAnyRole: vi.fn(() => true),
        isAdmin: vi.fn(() => false),
        isOwner: vi.fn(() => false),
        isStaff: vi.fn(() => false),
        isMember: vi.fn(() => false),
        userRole: undefined,
        PERMISSIONS,
      });

      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Should show loading indicator
      expect(screen.getByRole('status') || document.querySelector('.animate-spin')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated User', () => {
    it('should redirect to auth page when not logged in', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
        organization: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(() => false),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        isAdmin: vi.fn(() => false),
        isOwner: vi.fn(() => false),
        isStaff: vi.fn(() => false),
        isMember: vi.fn(() => false),
        userRole: undefined,
        PERMISSIONS,
      });

      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Should not show protected content
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated User with Permission', () => {
    it('should render children when user has required permission', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@test.com' } as any,
        profile: {
          id: '1',
          organization_id: 'org1',
          email: 'test@test.com',
          role: 'owner',
        },
        organization: null,
        session: {} as any,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(() => true),
        hasRole: vi.fn(() => true),
        hasAnyRole: vi.fn(() => true),
        isAdmin: vi.fn(() => true),
        isOwner: vi.fn(() => true),
        isStaff: vi.fn(() => true),
        isMember: vi.fn(() => false),
        userRole: 'owner',
        PERMISSIONS,
      });

      renderWithRouter(
        <ProtectedRoute permission={PERMISSIONS.VIEW_MEMBERS}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Authenticated User without Permission', () => {
    it('should show access denied when user lacks permission', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@test.com' } as any,
        profile: {
          id: '1',
          organization_id: 'org1',
          email: 'test@test.com',
          role: 'member',
        },
        organization: null,
        session: {} as any,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(() => false),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        isAdmin: vi.fn(() => false),
        isOwner: vi.fn(() => false),
        isStaff: vi.fn(() => false),
        isMember: vi.fn(() => true),
        userRole: 'member',
        PERMISSIONS,
      });

      renderWithRouter(
        <ProtectedRoute permission={PERMISSIONS.MANAGE_SYSTEM} showFallback={true}>
          <div>Admin Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should show current role in access denied message', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@test.com' } as any,
        profile: {
          id: '1',
          organization_id: 'org1',
          email: 'test@test.com',
          role: 'member',
        },
        organization: null,
        session: {} as any,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(() => false),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        isAdmin: vi.fn(() => false),
        isOwner: vi.fn(() => false),
        isStaff: vi.fn(() => false),
        isMember: vi.fn(() => true),
        userRole: 'member',
        PERMISSIONS,
      });

      renderWithRouter(
        <ProtectedRoute permission={PERMISSIONS.MANAGE_SYSTEM}>
          <div>Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText(/member/i)).toBeInTheDocument();
    });
  });

  describe('Role-based Access', () => {
    it('should allow access when user has required role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@test.com' } as any,
        profile: {
          id: '1',
          organization_id: 'org1',
          email: 'test@test.com',
          role: 'manager',
        },
        organization: null,
        session: {} as any,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(() => true),
        hasRole: vi.fn((role) => role === 'manager'),
        hasAnyRole: vi.fn((roles) => roles.includes('manager')),
        isAdmin: vi.fn(() => true),
        isOwner: vi.fn(() => false),
        isStaff: vi.fn(() => true),
        isMember: vi.fn(() => false),
        userRole: 'manager',
        PERMISSIONS,
      });

      renderWithRouter(
        <ProtectedRoute roles={['owner', 'manager']}>
          <div>Manager Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Manager Content')).toBeInTheDocument();
    });

    it('should deny access when user does not have required role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@test.com' } as any,
        profile: {
          id: '1',
          organization_id: 'org1',
          email: 'test@test.com',
          role: 'staff',
        },
        organization: null,
        session: {} as any,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(() => true),
        hasRole: vi.fn((role) => role === 'staff'),
        hasAnyRole: vi.fn((roles) => roles.includes('staff')),
        isAdmin: vi.fn(() => false),
        isOwner: vi.fn(() => false),
        isStaff: vi.fn(() => true),
        isMember: vi.fn(() => false),
        userRole: 'staff',
        PERMISSIONS,
      });

      renderWithRouter(
        <ProtectedRoute roles={['owner', 'manager']}>
          <div>Admin Only</div>
        </ProtectedRoute>
      );

      expect(screen.queryByText('Admin Only')).not.toBeInTheDocument();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('Profile Loading', () => {
    it('should show loading state while profile is being fetched', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@test.com' } as any,
        profile: null, // Profile not loaded yet
        organization: null,
        session: {} as any,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(() => false),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        isAdmin: vi.fn(() => false),
        isOwner: vi.fn(() => false),
        isStaff: vi.fn(() => false),
        isMember: vi.fn(() => false),
        userRole: undefined,
        PERMISSIONS,
      });

      renderWithRouter(
        <ProtectedRoute>
          <div>Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText(/profile loading/i)).toBeInTheDocument();
    });
  });
});
