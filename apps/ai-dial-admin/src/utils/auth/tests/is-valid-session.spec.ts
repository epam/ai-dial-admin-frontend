import { describe, test, expect, vi } from 'vitest';
import { getIsInvalidSession } from '../is-valid-session';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));
import { getServerSession } from 'next-auth';

describe('getIsInvalidSession', () => {
  test('returns false if isEnableAuth is false', async () => {
    const result = await getIsInvalidSession(false, { accessTokenExpires: Date.now() + 10000 } as any);
    expect(result).toBe(false);
  });

  test('returns true if session is null', async () => {
    (getServerSession as any).mockResolvedValue(null);
    const result = await getIsInvalidSession(true, { accessTokenExpires: Date.now() + 10000 } as any);
    expect(result).toBe(true);
  });

  test('returns true if session.error exists', async () => {
    (getServerSession as any).mockResolvedValue({ error: 'err' });
    const result = await getIsInvalidSession(true, { accessTokenExpires: Date.now() + 10000 } as any);
    expect(result).toBe(true);
  });

  test('returns true if token is null', async () => {
    (getServerSession as any).mockResolvedValue({});
    const result = await getIsInvalidSession(true, null);
    expect(result).toBe(true);
  });

  test('returns true if token is expired', async () => {
    (getServerSession as any).mockResolvedValue({});
    const result = await getIsInvalidSession(true, { accessTokenExpires: Date.now() - 10000 } as any);
    expect(result).toBe(true);
  });

  test('returns false if session and token are valid', async () => {
    (getServerSession as any).mockResolvedValue({});
    const result = await getIsInvalidSession(true, { accessTokenExpires: Date.now() + 10000 } as any);
    expect(result).toBe(false);
  });
});
