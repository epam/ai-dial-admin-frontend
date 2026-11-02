import { afterEach, describe, expect, test } from 'vitest';

import { getAppName } from '@/src/utils/env/get-app-name';

describe('getAppName', () => {
  afterEach(() => {
    delete process.env.APP_NAME;
  });

  test('returns APP_NAME when it is set', () => {
    process.env.APP_NAME = 'DIAL Admin';
    expect(getAppName()).toBe('DIAL Admin');
  });

  test('falls back to the built-in name when APP_NAME is empty', () => {
    process.env.APP_NAME = '';
    expect(getAppName()).toBe('AI Dial Admin');
  });

  test('falls back to the built-in name when APP_NAME is undefined', () => {
    expect(getAppName()).toBe('AI Dial Admin');
  });
});
