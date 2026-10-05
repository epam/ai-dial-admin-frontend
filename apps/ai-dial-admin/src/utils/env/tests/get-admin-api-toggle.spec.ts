import { afterEach, describe, expect, test, vi } from 'vitest';

import { getIsAdminApiEnabled } from '@/src/utils/env/get-admin-api-toggle';

describe('getIsAdminApiEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('reads a configured admin backend as enabled', () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', 'http://admin');
    expect(getIsAdminApiEnabled()).toBe(true);
  });

  test('reads an absent admin backend as disabled', () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', undefined);
    expect(getIsAdminApiEnabled()).toBe(false);
  });
});
