import { afterEach, describe, expect, test, vi } from 'vitest';

import { getAppName } from '@/src/utils/env/get-app-name';

describe('getAppName', () => {
  afterEach(() => {
    vi.stubEnv('APP_NAME', undefined);
  });

  test('returns APP_NAME when it is set', () => {
    vi.stubEnv('APP_NAME', 'DIAL Admin');
    expect(getAppName()).toBe('DIAL Admin');
  });

  test('falls back to the built-in name when APP_NAME is empty', () => {
    vi.stubEnv('APP_NAME', '');
    expect(getAppName()).toBe('AI DIAL Admin');
  });

  test('falls back to the built-in name when APP_NAME is undefined', () => {
    expect(getAppName()).toBe('AI DIAL Admin');
  });
});
