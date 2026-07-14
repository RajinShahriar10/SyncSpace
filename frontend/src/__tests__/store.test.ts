import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore, useUIStore, useWorkspaceSelectionStore } from '@/store';

vi.mock('@/lib/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  googleLogin: vi.fn(),
  getCurrentUser: vi.fn(),
  storeTokens: vi.fn(),
  clearTokens: vi.fn(),
  getStoredAccessToken: vi.fn(),
  getStoredRefreshToken: vi.fn(),
  revokeToken: vi.fn(),
}));

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      sidebarOpen: true,
      mobileMenuOpen: false,
      theme: 'dark',
    });
  });

  it('has default state', () => {
    const state = useUIStore.getState();
    expect(state.sidebarOpen).toBe(true);
    expect(state.mobileMenuOpen).toBe(false);
    expect(state.theme).toBe('dark');
  });

  it('toggles sidebar', () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it('sets sidebar open', () => {
    useUIStore.getState().setSidebarOpen(false);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it('toggles mobile menu', () => {
    useUIStore.getState().toggleMobileMenu();
    expect(useUIStore.getState().mobileMenuOpen).toBe(true);
    useUIStore.getState().toggleMobileMenu();
    expect(useUIStore.getState().mobileMenuOpen).toBe(false);
  });

  it('sets mobile menu open', () => {
    useUIStore.getState().setMobileMenuOpen(true);
    expect(useUIStore.getState().mobileMenuOpen).toBe(true);
  });

  it('sets theme', () => {
    useUIStore.getState().setTheme('light');
    expect(useUIStore.getState().theme).toBe('light');
  });
});

describe('useWorkspaceSelectionStore', () => {
  beforeEach(() => {
    useWorkspaceSelectionStore.setState({ currentWorkspaceId: null });
  });

  it('has null workspace by default', () => {
    expect(useWorkspaceSelectionStore.getState().currentWorkspaceId).toBeNull();
  });

  it('sets workspace id', () => {
    const id = 'test-workspace-id';
    useWorkspaceSelectionStore.getState().setCurrentWorkspaceId(id);
    expect(useWorkspaceSelectionStore.getState().currentWorkspaceId).toBe(id);
  });

  it('clears workspace id', () => {
    useWorkspaceSelectionStore.getState().setCurrentWorkspaceId('ws-1');
    useWorkspaceSelectionStore.getState().setCurrentWorkspaceId(null);
    expect(useWorkspaceSelectionStore.getState().currentWorkspaceId).toBeNull();
  });
});

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('has default state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('sets user', () => {
    const user = { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', status: 'Active' as const, createdAt: new Date().toISOString() };
    useAuthStore.getState().setUser(user);
    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('sets null user clears auth', () => {
    const user = { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', status: 'Active' as const, createdAt: new Date().toISOString() };
    useAuthStore.getState().setUser(user);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('sets loading', () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });

  it('sets error', () => {
    useAuthStore.getState().setError('Something went wrong');
    expect(useAuthStore.getState().error).toBe('Something went wrong');
  });

  it('clears error', () => {
    useAuthStore.getState().setError('Error');
    useAuthStore.getState().setError(null);
    expect(useAuthStore.getState().error).toBeNull();
  });
});
