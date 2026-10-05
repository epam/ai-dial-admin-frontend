import { describe, expect, test } from 'vitest';

import { UserRole } from '@/src/models/user-info';
import { resolveIsFullAdmin } from '@/src/utils/auth/full-admin';

describe('resolveIsFullAdmin', () => {
  test('counts every caller as a full admin without the admin backend', () => {
    expect(resolveIsFullAdmin(false, true, [])).toBe(true);
  });

  test('counts every caller as a full admin with auth off', () => {
    expect(resolveIsFullAdmin(true, false, undefined)).toBe(true);
  });

  test('requires the FULL_ADMIN role when both are on', () => {
    expect(resolveIsFullAdmin(true, true, [UserRole.FULL_ADMIN])).toBe(true);
    expect(resolveIsFullAdmin(true, true, [UserRole.READ_ONLY_ADMIN])).toBe(false);
    expect(resolveIsFullAdmin(true, true, undefined)).toBe(false);
  });
});
