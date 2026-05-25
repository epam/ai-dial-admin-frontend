import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useLogout } from '../use-logout';
import * as requestRegistryModule from '@/src/utils/api/request-registry';
import * as nextAuthReact from 'next-auth/react';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
  signIn: vi.fn(),
}));

describe('useLogout', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('should return session value', () => {
    vi.mocked(nextAuthReact.useSession).mockReturnValue({ data: { user: 'test' } } as any);
    const { result } = renderHook(() => useLogout());
    expect(result.current.session).toEqual({ user: 'test' });
  });

  test('should call cancelAll before signOut when session exists', () => {
    const cancelAllSpy = vi.spyOn(requestRegistryModule.requestRegistry, 'cancelAll');
    const mockSignOut = vi.mocked(nextAuthReact.signOut);
    vi.mocked(nextAuthReact.useSession).mockReturnValue({ data: { user: 'test' } } as any);

    const { result } = renderHook(() => useLogout());

    result.current.handleLogout();

    expect(cancelAllSpy).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledWith({ redirect: true, callbackUrl: '/' });

    // Verify cancelAll was called before signOut
    const cancelAllCallOrder = cancelAllSpy.mock.invocationCallOrder[0];
    const signOutCallOrder = mockSignOut.mock.invocationCallOrder[0];
    expect(cancelAllCallOrder).toBeLessThan(signOutCallOrder);
  });

  test('should use Auth0 federated logout URL when provider is auth0', () => {
    const cancelAllSpy = vi.spyOn(requestRegistryModule.requestRegistry, 'cancelAll');
    const mockSignOut = vi.mocked(nextAuthReact.signOut);
    vi.mocked(nextAuthReact.useSession).mockReturnValue({
      data: { user: 'test', providerId: 'auth0' },
    } as any);

    const { result } = renderHook(() => useLogout());

    result.current.handleLogout();

    expect(cancelAllSpy).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledWith({
      redirect: true,
      callbackUrl: '/api/auth/logout?provider=auth0',
    });
  });

  test('should call signIn when no session exists', () => {
    const mockSignIn = vi.mocked(nextAuthReact.signIn);
    const mockSignOut = vi.mocked(nextAuthReact.signOut);
    vi.mocked(nextAuthReact.useSession).mockReturnValue({ data: null } as any);

    const { result } = renderHook(() => useLogout());

    result.current.handleLogout();

    expect(mockSignIn).toHaveBeenCalledWith('azure-ad', { redirect: true });
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
