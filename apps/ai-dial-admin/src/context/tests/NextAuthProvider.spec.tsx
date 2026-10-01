import { render, screen } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { describe, expect, test, vi } from 'vitest';

import { SESSION_REFETCH_INTERVAL_SEC } from '@/src/constants/auth';
import { NextAuthProvider } from '../NextAuthProvider';

describe('NextAuthProvider', () => {
  test('re-validates the session on an interval and keeps focus refetch on', () => {
    render(
      <NextAuthProvider>
        <span>content</span>
      </NextAuthProvider>,
    );

    expect(screen.getByText('content')).toBeInTheDocument();
    const props = vi.mocked(SessionProvider).mock.calls[0][0];
    expect(props.refetchInterval).toBe(SESSION_REFETCH_INTERVAL_SEC);
    expect(props.refetchOnWindowFocus).not.toBe(false);
  });
});
