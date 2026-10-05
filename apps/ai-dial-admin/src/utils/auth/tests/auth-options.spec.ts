import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../auth-providers', () => ({ authProviders: [] }));

import { requestRegistry } from '@/src/utils/api/request-registry';
import { authOptions } from '../auth-options';
import { NextClient } from '../nextauth-client';

const HOUR = 60 * 60 * 1000;

const refreshedToken = (sessionKey: string) => ({
  sessionKey,
  refreshToken: `refresh-${sessionKey}`,
  accessTokenExpires: Date.now() + HOUR,
});

describe('authOptions.events.signOut', () => {
  beforeEach(() => {
    (globalThis as any)._refreshStates = new Map();
  });

  test('clears only the signing-out session and cancels pending requests', async () => {
    const cancelAll = vi.spyOn(requestRegistry, 'cancelAll');
    const states = (globalThis as any)._refreshStates as Map<string, unknown>;
    await NextClient.refreshOnce(
      { sessionKey: 'user-a', accessTokenExpires: 0 } as any,
      async () => refreshedToken('user-a') as any,
    );
    await NextClient.refreshOnce(
      { sessionKey: 'user-b', accessTokenExpires: 0 } as any,
      async () => refreshedToken('user-b') as any,
    );

    await authOptions.events!.signOut!({ token: { sessionKey: 'user-a' } } as any);

    expect(cancelAll).toHaveBeenCalled();
    expect(states.has('user-a')).toBe(false);
    expect(states.has('user-b')).toBe(true);
  });
});
