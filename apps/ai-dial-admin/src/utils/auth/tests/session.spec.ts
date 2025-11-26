import { describe, test, expect } from 'vitest';
import { isClientSessionValid, isServerSessionValid } from '../session';

describe('Session utils', () => {
  test('returns false for null session', () => {
    expect(isClientSessionValid(null)).toBe(false);
    expect(isServerSessionValid(null)).toBe(false);
  });

  test('returns false for session with RefreshAccessTokenError', () => {
    expect(isClientSessionValid({ error: 'RefreshAccessTokenError' } as any)).toBe(false);
    expect(isServerSessionValid({ error: 'RefreshAccessTokenError' } as any)).toBe(false);
  });

  test('returns false for session with NoClientForProvider', () => {
    expect(isClientSessionValid({ error: 'NoClientForProvider' } as any)).toBe(false);
    expect(isServerSessionValid({ error: 'NoClientForProvider' } as any)).toBe(false);
  });

  test('returns true for valid session', () => {
    expect(isClientSessionValid({ user: { name: 'user' } } as any)).toBe(true);
    expect(isServerSessionValid({ user: { name: 'user' } } as any)).toBe(true);
  });
});
