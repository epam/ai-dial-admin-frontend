import { afterEach, describe, expect, test, vi } from 'vitest';

import { getIsAnalyticsEnabled } from '@/src/utils/env/get-analytics-toggle';

describe('getIsAnalyticsEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('reads a truthy ANALYTICS_ENABLED as enabled', () => {
    vi.stubEnv('ANALYTICS_ENABLED', 'true');
    expect(getIsAnalyticsEnabled()).toBe(true);
  });

  test('reads an absent or false ANALYTICS_ENABLED as disabled', () => {
    vi.stubEnv('ANALYTICS_ENABLED', 'false');
    expect(getIsAnalyticsEnabled()).toBe(false);
  });
});
