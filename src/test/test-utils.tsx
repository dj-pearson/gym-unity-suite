import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { vi } from 'vitest';

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface WrapperProps {
  children: React.ReactNode;
  initialEntries?: string[];
}

// All providers wrapper for testing
const AllTheProviders = ({ children, initialEntries }: WrapperProps) => {
  const queryClient = createTestQueryClient();
  const Router = initialEntries ? MemoryRouter : BrowserRouter;
  const routerProps = initialEntries ? { initialEntries } : {};

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <Router {...routerProps}>{children}</Router>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

// Custom render that includes all providers
const customRender = (
  ui: ReactElement,
  { initialEntries, ...options }: CustomRenderOptions = {}
) =>
  render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders initialEntries={initialEntries}>{children}</AllTheProviders>
    ),
    ...options,
  });

// Re-export everything from testing library
export * from '@testing-library/react';
export { customRender as render };
export { createTestQueryClient };

// ========== Mock Utilities ==========

// Mock auth context values
export const createMockAuthContext = (overrides = {}) => ({
  user: null,
  profile: null,
  organization: null,
  session: null,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
  ...overrides,
});

// Mock profile
export const createMockProfile = (overrides = {}) => ({
  id: 'test-user-id',
  organization_id: 'test-org-id',
  email: 'test@example.com',
  role: 'owner' as const,
  first_name: 'Test',
  last_name: 'User',
  ...overrides,
});

// Mock organization
export const createMockOrganization = (overrides = {}) => ({
  id: 'test-org-id',
  name: 'Test Gym',
  slug: 'test-gym',
  primary_color: '#3b82f6',
  secondary_color: '#1e40af',
  ...overrides,
});

// Mock member
export const createMockMember = (overrides = {}) => ({
  id: 'test-member-id',
  organization_id: 'test-org-id',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  status: 'active',
  membership_status: 'active',
  created_at: new Date().toISOString(),
  ...overrides,
});

// Mock Supabase client
export const createMockSupabaseClient = () => ({
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
  })),
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
  functions: {
    invoke: vi.fn(),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
      getPublicUrl: vi.fn(),
    })),
  },
});

// ========== Helper Functions ==========

// Wait for async operations
export const waitForAsync = (ms = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Wait for loading to complete
export const waitForLoadingToFinish = async () => {
  // Wait for any loading spinners to disappear
  await waitForAsync(100);
};

// Simulate user typing
export const typeText = async (
  element: HTMLElement,
  text: string,
  userEvent: any
) => {
  await userEvent.clear(element);
  await userEvent.type(element, text);
};

// Get form validation error
export const getValidationError = (container: HTMLElement, fieldName: string) => {
  return container.querySelector(`[data-testid="${fieldName}-error"]`)?.textContent;
};

// Mock window.matchMedia
export const mockMatchMedia = (matches = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// Mock IntersectionObserver
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  window.IntersectionObserver = mockIntersectionObserver as any;
};

// Mock ResizeObserver
export const mockResizeObserver = () => {
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  window.ResizeObserver = mockResizeObserver as any;
};
