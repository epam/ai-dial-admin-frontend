import { describe, test, expect } from 'vitest';
import { getIsEnableAuthToggle } from '../get-auth-toggle';

describe('getIsEnableAuthToggle', () => {
  test('returns true if NEXTAUTH_URL is set', () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    expect(getIsEnableAuthToggle()).toBe(true);
  });

  test('returns false if NEXTAUTH_URL is empty string', () => {
    process.env.NEXTAUTH_URL = '';
    expect(getIsEnableAuthToggle()).toBe(false);
  });

  test('returns false if NEXTAUTH_URL is undefined', () => {
    delete process.env.NEXTAUTH_URL;
    expect(getIsEnableAuthToggle()).toBe(false);
  });
});
