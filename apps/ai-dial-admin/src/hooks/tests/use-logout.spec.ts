import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useLogout } from '../use-logout';

describe('useLogout', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('should return session value', () => {
    vi.mock('next-auth/react', () => ({
      useSession: () => ({ data: { user: 'test' } }),
      signOut: vi.fn(),
      signIn: vi.fn(),
    }));
    const { result } = renderHook(() => useLogout());
    expect(result.current.session).toEqual({ user: 'test' });
  });
});
