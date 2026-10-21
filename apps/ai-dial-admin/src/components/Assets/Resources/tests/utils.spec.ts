import { DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';
import * as openInNewTab from '@/src/utils/open-in-new-tab';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getResourceReadOnlyValues, setUrl } from '../utils';

vi.mock('@/src/utils/open-in-new-tab');

describe('getResourceReadOnlyValues', () => {
  test('should return the value and readonly flag when appRunner is provided and the snake_cased key maps to an app runner key', () => {
    const mockAppRunner: DialApplicationScheme = {
      'dial:applicationTypeRateEndpoint': 'Some value for rate endpoint',
    };

    const result = getResourceReadOnlyValues('rate_endpoint', mockAppRunner);

    expect(result.value).toBe('Some value for rate endpoint');
    expect(result.isReadonly).toBe(true);
  });

  test('should map the snake_cased assistant attachments key to its camelCased app runner key', () => {
    const mockAppRunner: DialApplicationScheme = {
      'dial:applicationTypeAssistantAttachmentsInRequestSupported': true,
    };

    const result = getResourceReadOnlyValues('assistant_attachments_in_request_supported', mockAppRunner);

    expect(result.value).toBe(true);
    expect(result.isReadonly).toBe(true);
  });

  test('should return empty value and readonly flag false when appRunner is undefined', () => {
    const result = getResourceReadOnlyValues('rate_endpoint');

    expect(result.value).toBeUndefined();
    expect(result.isReadonly).toBe(false);
  });

  test('should return empty value and readonly flag false when the key does not exist in the resource runner map', () => {
    const mockAppRunner: DialApplicationScheme = {
      'dial:applicationTypeRateEndpoint': 'Some value for rate endpoint',
    };

    const result = getResourceReadOnlyValues('non_existing_key', mockAppRunner);

    expect(result.value).toBeUndefined();
    expect(result.isReadonly).toBe(false);
  });

  test('should not map the camelCased key since resource features are snake_cased', () => {
    const mockAppRunner: DialApplicationScheme = {
      'dial:applicationTypeRateEndpoint': 'Some value for rate endpoint',
    };

    const result = getResourceReadOnlyValues('rateEndpoint', mockAppRunner);

    expect(result.value).toBeUndefined();
    expect(result.isReadonly).toBe(false);
  });

  test('should return readonly flag true but empty value when appRunner does not contain the value for the key', () => {
    const mockAppRunner: DialApplicationScheme = {
      'dial:applicationTypeRateEndpoint': undefined,
    };

    const result = getResourceReadOnlyValues('rate_endpoint', mockAppRunner);

    expect(result.value).toBeUndefined();
    expect(result.isReadonly).toBe(true);
  });
});

// Regression (Issue #4447): the stored redirect URL must use `?` when the entity's URN has no
// existing query string (a platform-bucket toolset — flat, no `?path=`), and `&` when it does (a
// public-bucket toolset's `?path=...`). Hardcoding `&` produced a malformed
// `{name}&code=...` OAuth callback URL for the platform bucket.
describe('setUrl', () => {
  let windowSpy: any;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    windowSpy?.mockRestore();
  });

  test('uses "?" when the entity URN has no existing query string (platform-bucket toolset)', () => {
    vi.mocked(openInNewTab.getUrnForEntity).mockReturnValue('/assets-toolsets/my-toolset');

    setUrl(ApplicationRoute.AssetsToolsets, { name: 'my-toolset', path: 'platform/my-toolset' });

    expect(localStorage.getItem('toolset-auth-redirect-url')).toBe('/assets-toolsets/my-toolset?');
  });

  test('uses "&" when the entity URN already carries a query string (public-bucket toolset)', () => {
    vi.mocked(openInNewTab.getUrnForEntity).mockReturnValue('/assets-toolsets/MyToolset?path=public%2FMyToolset__1.0');

    setUrl(ApplicationRoute.AssetsToolsets, {
      name: 'MyToolset',
      path: 'public/MyToolset__1.0',
      folderId: 'public/',
      version: '1.0',
    });

    expect(localStorage.getItem('toolset-auth-redirect-url')).toBe(
      '/assets-toolsets/MyToolset?path=public%2FMyToolset__1.0&',
    );
  });

  test('does not throw when window is undefined (SSR)', () => {
    windowSpy = vi.spyOn(global, 'window', 'get').mockReturnValue(undefined as any);

    expect(() => setUrl(ApplicationRoute.AssetsToolsets, { name: 'my-toolset' })).not.toThrow();
    expect(openInNewTab.getUrnForEntity).not.toHaveBeenCalled();
    expect(localStorage.getItem('toolset-auth-redirect-url')).toBeNull();
  });
});
