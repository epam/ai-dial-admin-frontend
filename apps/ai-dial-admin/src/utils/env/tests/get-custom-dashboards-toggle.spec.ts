import { afterEach, describe, expect, test, vi } from 'vitest';

import { getIsCustomDashboardsEnabled } from '@/src/utils/env/get-custom-dashboards-toggle';

const stubFlags = (analytics?: string, usage?: string, custom?: string) => {
  vi.stubEnv('ANALYTICS_ENABLED', analytics);
  vi.stubEnv('ANALYTICS_USAGE_ENABLED', usage);
  vi.stubEnv('ANALYTICS_CUSTOM_DASHBOARDS_ENABLED', custom);
};

describe('getIsCustomDashboardsEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('reads custom dashboards as enabled while the analytics page is served', () => {
    stubFlags('true', 'true', 'true');
    expect(getIsCustomDashboardsEnabled()).toBe(true);
  });

  test('reads an unset flag as disabled', () => {
    stubFlags('true', 'true', undefined);
    expect(getIsCustomDashboardsEnabled()).toBe(false);
  });

  test('reads the flag as disabled when the usage page is not served', () => {
    stubFlags('true', 'false', 'true');
    expect(getIsCustomDashboardsEnabled()).toBe(false);
  });

  test('reads the flag as disabled when analytics is off', () => {
    stubFlags('false', 'true', 'true');
    expect(getIsCustomDashboardsEnabled()).toBe(false);
  });
});
