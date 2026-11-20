import { describe, expect, test } from 'vitest';

import {
  getBaseUrlError,
  getPluginName,
  getPluginReference,
  isPluginUrl,
} from '@/src/components/BaseControls/BaseUrlControl/utils';
import { ErrorI18nKey } from '@/src/constants/i18n';

const t = (key: string) => key;

describe('isPluginUrl', () => {
  test('recognizes only the exact prefix', () => {
    expect(isPluginUrl('dial-plugin://test')).toBe(true);
    expect(isPluginUrl('DIAL-plugin://test')).toBe(false);
    expect(isPluginUrl(undefined)).toBe(false);
  });
});

describe('getPluginName', () => {
  test('extracts the name without parsing it as a URL', () => {
    expect(getPluginName('dial-plugin://my_plugin/v2/a')).toBe('my_plugin');
    expect(getPluginName('dial-plugin:///v2')).toBe('');
    expect(getPluginName('https://example.com')).toBeUndefined();
  });
});

describe('getPluginReference', () => {
  test('prefixes a bare plugin name', () => {
    expect(getPluginReference('my_plugin')).toBe('dial-plugin://my_plugin');
  });
});

describe('getBaseUrlError', () => {
  test('validates required, HTTP and plugin values independently of option existence', () => {
    expect(getBaseUrlError(undefined, t, true)?.text).toBe(ErrorI18nKey.RequiredField);
    expect(getBaseUrlError(undefined, t)).toBeNull();
    expect(getBaseUrlError('https://example.com', t, true)).toBeNull();
    expect(getBaseUrlError('not-a-url', t)?.text).toBe(ErrorI18nKey.UrlField);
    expect(getBaseUrlError('dial-plugin://missing/v2', t)).toBeNull();
    expect(getBaseUrlError('dial-plugin:///v2', t)?.text).toBe(ErrorI18nKey.PluginUrl);
    expect(getBaseUrlError('dial-plugin://  /v2', t)?.text).toBe(ErrorI18nKey.PluginUrl);
  });
});
