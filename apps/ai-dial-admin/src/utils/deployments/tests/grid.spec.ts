import { describe, expect, test } from 'vitest';
import { getAdminAssetPath, getAdminEntityPath } from '../grid';
import { ApplicationRoute } from '@/src/types/routes';

describe('grid utils', () => {
  describe('getAdminEntityPath', () => {
    test('returns correct path for InterceptorDeployments', () => {
      const data = { name: 'my-interceptor' };
      const result = getAdminEntityPath(ApplicationRoute.InterceptorDeployments, data);
      expect(result).toBe(`${ApplicationRoute.Interceptors}/my-interceptor`);
      expect(getAdminEntityPath(ApplicationRoute.InterceptorDeployments, {})).toBe(`${ApplicationRoute.Interceptors}/`);
    });

    test('returns correct path for McpDeployments', () => {
      const data = { name: 'my-mcp' };
      const result = getAdminEntityPath(ApplicationRoute.McpDeployments, data);
      expect(result).toBe(`${ApplicationRoute.Toolsets}/my-mcp`);
      expect(getAdminEntityPath(ApplicationRoute.McpDeployments, {})).toBe(`${ApplicationRoute.Toolsets}/`);
    });

    test('returns correct path for ModelServings', () => {
      const data = { name: 'my-model' };
      const result = getAdminEntityPath(ApplicationRoute.ModelServings, data);
      expect(result).toBe(`${ApplicationRoute.Models}/my-model`);
      expect(getAdminEntityPath(ApplicationRoute.ModelServings, {})).toBe(`${ApplicationRoute.Models}/`);
    });

    test('encodes name in path', () => {
      const data = { name: 'my/model' };
      const result = getAdminEntityPath(ApplicationRoute.ModelServings, data);
      expect(result).toBe(`${ApplicationRoute.Models}/my%2Fmodel`);
    });

    test('returns empty string for unknown route', () => {
      const data = { name: 'test' };
      const result = getAdminEntityPath('unknown-route' as ApplicationRoute, data);
      expect(result).toBe('');
    });
  });

  describe('getAdminAssetPath', () => {
    test('returns correct path for McpDeployments', () => {
      const data = {
        folderId: 'folders/',
        name: 'asset-name',
        version: '1.0.0',
      };
      const result = getAdminAssetPath(ApplicationRoute.McpDeployments, data);
      const expectedPath = encodeURIComponent('folders/asset-name__1.0.0');
      const expectedName = encodeURIComponent('asset-name');
      expect(result).toBe(`${ApplicationRoute.AssetsToolsets}/${expectedName}?path=${expectedPath}`);
    });

    test('returns empty string for other routes', () => {
      const data = {
        folderId: 'folders/',
        name: 'asset-name',
        version: '1.0.0',
      };
      const result = getAdminAssetPath(ApplicationRoute.ModelServings, data);
      expect(result).toBe('');
    });
  });
});
