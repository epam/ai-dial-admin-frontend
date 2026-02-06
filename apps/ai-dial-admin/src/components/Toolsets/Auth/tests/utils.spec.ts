import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { Toolset, ToolsetAuthCredentialLevel } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import { setIsUser, getIsUser, setUrl, getUrl } from '../utils';
import * as openInNewTab from '@/src/utils/open-in-new-tab';
import * as types from '@/src/utils/types';

vi.mock('@/src/utils/open-in-new-tab');
vi.mock('@/src/utils/types');

describe('Toolsets Auth Utils', () => {
  let windowSpy: any;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (windowSpy) {
      windowSpy.mockRestore();
    }
  });

  describe('setIsUser', () => {
    test('should set localStorage to "true" when type is USER', () => {
      setIsUser(ToolsetAuthCredentialLevel.USER);

      expect(localStorage.getItem('toolset-auth-is-user')).toBe('true');
    });

    test('should set localStorage to "false" when type is APPLICATION', () => {
      setIsUser(ToolsetAuthCredentialLevel.APP);

      expect(localStorage.getItem('toolset-auth-is-user')).toBe('false');
    });

    test('should handle all ToolsetAuthCredentialLevel values', () => {
      const levels = Object.values(ToolsetAuthCredentialLevel);

      levels.forEach((level) => {
        localStorage.clear();
        setIsUser(level);
        const expected = level === ToolsetAuthCredentialLevel.USER ? 'true' : 'false';
        expect(localStorage.getItem('toolset-auth-is-user')).toBe(expected);
      });
    });

    test('should not throw when window is undefined (SSR)', () => {
      windowSpy = vi.spyOn(global, 'window', 'get').mockReturnValue(undefined as any);

      expect(() => setIsUser(ToolsetAuthCredentialLevel.USER)).not.toThrow();
      expect(localStorage.getItem('toolset-auth-is-user')).toBeNull();
    });

    test('should overwrite existing value', () => {
      localStorage.setItem('toolset-auth-is-user', 'true');

      setIsUser(ToolsetAuthCredentialLevel.APP);

      expect(localStorage.getItem('toolset-auth-is-user')).toBe('false');
    });
  });

  describe('getIsUser', () => {
    test('should return true when localStorage contains "true"', () => {
      localStorage.setItem('toolset-auth-is-user', 'true');
      vi.mocked(types.isValueTruthy).mockReturnValue(true);

      const result = getIsUser();

      expect(result).toBe(true);
      expect(types.isValueTruthy).toHaveBeenCalledWith('true');
    });

    test('should return false when localStorage contains "false"', () => {
      localStorage.setItem('toolset-auth-is-user', 'false');
      vi.mocked(types.isValueTruthy).mockReturnValue(false);

      const result = getIsUser();

      expect(result).toBe(false);
      expect(types.isValueTruthy).toHaveBeenCalledWith('false');
    });

    test('should remove the key from localStorage after reading', () => {
      localStorage.setItem('toolset-auth-is-user', 'true');
      vi.mocked(types.isValueTruthy).mockReturnValue(true);

      getIsUser();

      expect(localStorage.getItem('toolset-auth-is-user')).toBeNull();
    });

    test('should return false when key does not exist in localStorage', () => {
      vi.mocked(types.isValueTruthy).mockReturnValue(false);

      const result = getIsUser();

      expect(result).toBe(false);
      expect(types.isValueTruthy).toHaveBeenCalledWith(null);
    });

    test('should return null when window is undefined (SSR)', () => {
      windowSpy = vi.spyOn(global, 'window', 'get').mockReturnValue(undefined as any);

      const result = getIsUser();

      expect(result).toBeNull();
      expect(types.isValueTruthy).not.toHaveBeenCalled();
    });

    test('should handle empty string value', () => {
      localStorage.setItem('toolset-auth-is-user', '');
      vi.mocked(types.isValueTruthy).mockReturnValue(false);

      const result = getIsUser();

      expect(result).toBe(false);
      expect(types.isValueTruthy).toHaveBeenCalledWith('');
      expect(localStorage.getItem('toolset-auth-is-user')).toBeNull();
    });

    test('should call isValueTruthy only once per invocation', () => {
      localStorage.setItem('toolset-auth-is-user', 'true');
      vi.mocked(types.isValueTruthy).mockReturnValue(true);

      getIsUser();

      expect(types.isValueTruthy).toHaveBeenCalledTimes(1);
    });
  });

  describe('setUrl', () => {
    const mockToolset: Toolset = {
      id: 'toolset-123',
      name: 'Test Toolset',
      description: 'Test description',
    } as Toolset;

    test('should set URL with query parameter for Toolsets route', () => {
      const mockUrn = '/toolsets/toolset-123';
      vi.mocked(openInNewTab.getUrnForEntity).mockReturnValue(mockUrn);

      setUrl(ApplicationRoute.Toolsets, mockToolset);

      expect(openInNewTab.getUrnForEntity).toHaveBeenCalledWith(ApplicationRoute.Toolsets, mockToolset);
      expect(localStorage.getItem('toolset-auth-redirect-url')).toBe(`${mockUrn}?`);
    });

    test('should set URL with ampersand for AssetsToolsets route', () => {
      const mockUrn = '/assets/toolsets/toolset-123';
      vi.mocked(openInNewTab.getUrnForEntity).mockReturnValue(mockUrn);

      setUrl(ApplicationRoute.AssetsToolsets, mockToolset);

      expect(openInNewTab.getUrnForEntity).toHaveBeenCalledWith(ApplicationRoute.AssetsToolsets, mockToolset);
      expect(localStorage.getItem('toolset-auth-redirect-url')).toBe(`${mockUrn}&`);
    });

    test('should handle different toolset IDs', () => {
      const toolsets = [
        { ...mockToolset, id: 'toolset-1' },
        { ...mockToolset, id: 'toolset-999' },
        { ...mockToolset, id: 'special-toolset-abc' },
      ];

      toolsets.forEach((toolset) => {
        localStorage.clear();
        vi.mocked(openInNewTab.getUrnForEntity).mockReturnValue(`/toolsets/${toolset.id}`);

        setUrl(ApplicationRoute.Toolsets, toolset);

        expect(localStorage.getItem('toolset-auth-redirect-url')).toBe(`/toolsets/${toolset.id}?`);
      });
    });

    test('should not throw when window is undefined (SSR)', () => {
      windowSpy = vi.spyOn(global, 'window', 'get').mockReturnValue(undefined as any);

      expect(() => setUrl(ApplicationRoute.Toolsets, mockToolset)).not.toThrow();
      expect(openInNewTab.getUrnForEntity).not.toHaveBeenCalled();
      expect(localStorage.getItem('toolset-auth-redirect-url')).toBeNull();
    });

    test('should overwrite existing URL value', () => {
      localStorage.setItem('toolset-auth-redirect-url', '/old-url');
      vi.mocked(openInNewTab.getUrnForEntity).mockReturnValue('/new-toolsets/toolset-456');

      setUrl(ApplicationRoute.Toolsets, mockToolset);

      expect(localStorage.getItem('toolset-auth-redirect-url')).toBe('/new-toolsets/toolset-456?');
    });

    test('should handle empty URN from getUrnForEntity', () => {
      vi.mocked(openInNewTab.getUrnForEntity).mockReturnValue('');

      setUrl(ApplicationRoute.Toolsets, mockToolset);

      expect(localStorage.getItem('toolset-auth-redirect-url')).toBe('?');
    });
  });

  describe('getUrl', () => {
    test('should return the stored URL from localStorage', () => {
      const testUrl = '/toolsets/toolset-123?';
      localStorage.setItem('toolset-auth-redirect-url', testUrl);

      const result = getUrl();

      expect(result).toBe(testUrl);
    });

    test('should remove the key from localStorage after reading', () => {
      localStorage.setItem('toolset-auth-redirect-url', '/test-url');

      getUrl();

      expect(localStorage.getItem('toolset-auth-redirect-url')).toBeNull();
    });

    test('should return null when key does not exist in localStorage', () => {
      const result = getUrl();

      expect(result).toBeNull();
    });

    test('should handle empty string value', () => {
      localStorage.setItem('toolset-auth-redirect-url', '');

      const result = getUrl();

      expect(result).toBe('');
      expect(localStorage.getItem('toolset-auth-redirect-url')).toBeNull();
    });

    test('should handle URLs with query parameters', () => {
      const urlWithParams = '/toolsets/toolset-123?tab=settings&mode=edit';
      localStorage.setItem('toolset-auth-redirect-url', urlWithParams);

      const result = getUrl();

      expect(result).toBe(urlWithParams);
    });

    test('should handle URLs with ampersand', () => {
      const urlWithAmpersand = '/assets/toolsets/toolset-123&param=value';
      localStorage.setItem('toolset-auth-redirect-url', urlWithAmpersand);

      const result = getUrl();

      expect(result).toBe(urlWithAmpersand);
    });

    test('should return null on subsequent calls after first read', () => {
      localStorage.setItem('toolset-auth-redirect-url', '/test-url');

      const firstResult = getUrl();
      const secondResult = getUrl();

      expect(firstResult).toBe('/test-url');
      expect(secondResult).toBeNull();
    });

    test('should not throw when localStorage is empty', () => {
      localStorage.clear();

      expect(() => getUrl()).not.toThrow();
      expect(getUrl()).toBeNull();
    });
  });

  describe('Integration tests', () => {
    const mockToolset: Toolset = {
      id: 'toolset-integration',
      name: 'Integration Toolset',
    } as Toolset;

    test('should handle complete flow: setIsUser -> getIsUser', () => {
      vi.mocked(types.isValueTruthy).mockReturnValue(true);

      setIsUser(ToolsetAuthCredentialLevel.USER);
      const result = getIsUser();

      expect(result).toBe(true);
      expect(localStorage.getItem('toolset-auth-is-user')).toBeNull();
    });

    test('should handle complete flow: setUrl -> getUrl', () => {
      vi.mocked(openInNewTab.getUrnForEntity).mockReturnValue('/toolsets/toolset-integration');

      setUrl(ApplicationRoute.Toolsets, mockToolset);
      const result = getUrl();

      expect(result).toBe('/toolsets/toolset-integration?');
      expect(localStorage.getItem('toolset-auth-redirect-url')).toBeNull();
    });

    test('should keep values independent', () => {
      vi.mocked(openInNewTab.getUrnForEntity).mockReturnValue('/toolsets/test');
      vi.mocked(types.isValueTruthy).mockReturnValue(true);

      setIsUser(ToolsetAuthCredentialLevel.USER);
      setUrl(ApplicationRoute.Toolsets, mockToolset);

      expect(localStorage.getItem('toolset-auth-is-user')).toBe('true');
      expect(localStorage.getItem('toolset-auth-redirect-url')).toBe('/toolsets/test?');

      getIsUser();
      expect(localStorage.getItem('toolset-auth-is-user')).toBeNull();
      expect(localStorage.getItem('toolset-auth-redirect-url')).toBe('/toolsets/test?');
    });
  });
});
