import { afterEach, describe, expect, test, vi } from 'vitest';

import { getIsPoliciesEnabled } from '@/src/utils/env/get-policies-toggle';

describe('getIsPoliciesEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('reads an unset variable as disabled', () => {
    vi.stubEnv('POLICIES_ENABLED', undefined);

    expect(getIsPoliciesEnabled()).toBe(false);
  });

  test.each(['false', '', 'TRUE', '1', 'yes'])('reads %j as disabled', (value) => {
    vi.stubEnv('POLICIES_ENABLED', value);

    expect(getIsPoliciesEnabled()).toBe(false);
  });

  test('reads true as enabled', () => {
    vi.stubEnv('POLICIES_ENABLED', 'true');

    expect(getIsPoliciesEnabled()).toBe(true);
  });
});
