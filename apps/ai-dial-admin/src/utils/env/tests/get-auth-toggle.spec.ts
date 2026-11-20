import { describe, test, expect, vi } from 'vitest';
import { getIsEnableAuthToggle } from '../get-auth-toggle';

describe('getIsEnableAuthToggle', () => {
  test('returns true if NEXTAUTH_URL is set', () => {
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');
    expect(getIsEnableAuthToggle()).toBe(true);
  });

  test('returns false if NEXTAUTH_URL is empty string', () => {
    vi.stubEnv('NEXTAUTH_URL', '');
    expect(getIsEnableAuthToggle()).toBe(false);
  });

  test('returns false if NEXTAUTH_URL is undefined', () => {
    vi.stubEnv('NEXTAUTH_URL', undefined);
    expect(getIsEnableAuthToggle()).toBe(false);
  });
});
