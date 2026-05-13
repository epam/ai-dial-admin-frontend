import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApplicationRoute } from '@/src/types/routes';
import { DialFileNodeType } from '@epam/ai-dial-ui-kit';
import { processAssetsData, getFilePathGridOptions } from '../utils';
import * as fileManagerUtils from '@/src/components/Common/FileManager/utils';
import * as baseAssetListUtils from '@/src/components/Assets/BaseAssetList/utils';
import { Asset, AssetWithVersion } from '@/src/models/dial/deployment-asset';

vi.mock('@/src/components/Common/FileManager/utils');
vi.mock('@/src/components/Assets/BaseAssetList/utils');

describe('FilePath utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processAssetsData', () => {
    it('should return assets as-is when view is not one of the supported routes', () => {
      const assets = [
        {
          id: '1',
          name: 'asset1',
          nodeType: DialFileNodeType.ITEM,
          version: '1.0',
        },
      ];

      const result = processAssetsData(assets as AssetWithVersion[], ApplicationRoute.Models);

      expect(result).toEqual(assets);
    });

    it('should return empty array when assets is empty', () => {
      const result = processAssetsData([], ApplicationRoute.AssetsApplications);

      expect(result).toEqual([]);
    });

    it('should return assets as-is when view is undefined', () => {
      const assets = [
        {
          id: '1',
          name: 'asset1',
          nodeType: DialFileNodeType.ITEM,
          version: '1.0',
        },
      ];

      const result = processAssetsData(assets as AssetWithVersion[]);

      expect(result).toEqual(assets);
    });

    it('should process assets for AssetsApplications view', () => {
      const assets = [
        {
          id: '1',
          name: 'app1',
          nodeType: DialFileNodeType.ITEM,
          version: '1.0',
          path: '/path/app1',
        },
      ];

      const result = processAssetsData(assets as AssetWithVersion[], ApplicationRoute.AssetsApplications);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'app1',
        nodeType: DialFileNodeType.ITEM,
        version: '1.0',
        selectedVersions: ['1.0'],
        versions: ['1.0'],
      });
    });

    it('should process assets for AssetsToolsets view', () => {
      const assets = [
        {
          id: '1',
          name: 'toolset1',
          nodeType: DialFileNodeType.ITEM,
          version: '2.0',
          path: '/path/toolset1',
        },
      ];

      const result = processAssetsData(assets as AssetWithVersion[], ApplicationRoute.AssetsToolsets);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        version: '2.0',
        selectedVersions: ['2.0'],
        versions: ['2.0'],
      });
    });

    it('should process assets for Prompts view', () => {
      const assets = [
        {
          id: '1',
          name: 'prompt1',
          nodeType: DialFileNodeType.ITEM,
          version: '1.5',
          path: '/path/prompt1',
        },
      ];

      const result = processAssetsData(assets as AssetWithVersion[], ApplicationRoute.Prompts);

      expect(result).toHaveLength(1);
      expect((result[0] as AssetWithVersion).selectedVersions).toEqual(['1.5']);
    });

    it('should merge items with same name and different versions', () => {
      const assets = [
        {
          id: '1',
          name: 'app1',
          nodeType: DialFileNodeType.ITEM,
          version: '1.0',
          path: '/path/app1_v1',
        },
        {
          id: '2',
          name: 'app1',
          nodeType: DialFileNodeType.ITEM,
          version: '2.0',
          path: '/path/app1_v2',
        },
      ];

      const result = processAssetsData(assets as AssetWithVersion[], ApplicationRoute.AssetsApplications);

      expect(result).toHaveLength(1);
      expect((result[0] as AssetWithVersion).versions).toEqual(expect.arrayContaining(['1.0', '2.0']));
      expect((result[0] as AssetWithVersion).version).toBe('2.0');
      expect(result[0].path).toBe('/path/app1_v2');
    });

    it('should handle mixed folders and items', () => {
      const assets = [
        {
          id: 'folder1',
          name: 'folder1',
          nodeType: DialFileNodeType.FOLDER,
          path: '/path/folder1',
          items: [],
        },
        {
          id: '1',
          name: 'app1',
          nodeType: DialFileNodeType.ITEM,
          version: '1.0',
          path: '/path/app1',
        },
      ];

      const result = processAssetsData(assets as AssetWithVersion[], ApplicationRoute.AssetsApplications);

      expect(result).toHaveLength(2);
      expect(result.some((item) => item.nodeType === DialFileNodeType.FOLDER)).toBe(true);
      expect(result.some((item) => item.nodeType === DialFileNodeType.ITEM)).toBe(true);
    });

    it('should not add duplicate versions', () => {
      const assets = [
        {
          id: '1',
          name: 'app1',
          nodeType: DialFileNodeType.ITEM,
          version: '1.0',
          path: '/path/app1',
          versions: ['1.0'],
        },
        {
          id: '2',
          name: 'app1',
          nodeType: DialFileNodeType.ITEM,
          version: '1.0',
          path: '/path/app1',
        },
      ];

      const result = processAssetsData(assets as AssetWithVersion[], ApplicationRoute.AssetsApplications);

      expect(result).toHaveLength(1);
      expect((result[0] as AssetWithVersion).versions).toEqual(['1.0']);
    });
  });

  describe('getFilePathGridOptions', () => {
    const mockTranslate = vi.fn((key: string) => key);

    beforeEach(() => {
      mockTranslate.mockClear();
      vi.mocked(baseAssetListUtils.getGridColumns).mockReturnValue([]);
      vi.mocked(fileManagerUtils.getGridOptions).mockReturnValue({} as any);
    });

    it('should return undefined when view is not AssetsApplications, AssetsToolsets, or Prompts', () => {
      const result = getFilePathGridOptions(mockTranslate, ApplicationRoute.Models);

      expect(result).toBeUndefined();
    });

    it('should return undefined when view is undefined', () => {
      const result = getFilePathGridOptions(mockTranslate);

      expect(result).toBeUndefined();
    });

    it('should call getGridColumns and getGridOptions for AssetsApplications', () => {
      getFilePathGridOptions(mockTranslate, ApplicationRoute.AssetsApplications);

      expect(baseAssetListUtils.getGridColumns).toHaveBeenCalledWith(expect.any(Function), {}, false);
      expect(fileManagerUtils.getGridOptions).toHaveBeenCalledWith(ApplicationRoute.Prompts, true, [], mockTranslate);
    });

    it('should call getGridColumns and getGridOptions for AssetsToolsets', () => {
      getFilePathGridOptions(mockTranslate, ApplicationRoute.AssetsToolsets);

      expect(baseAssetListUtils.getGridColumns).toHaveBeenCalledWith(expect.any(Function), {}, false);
      expect(fileManagerUtils.getGridOptions).toHaveBeenCalledWith(ApplicationRoute.Prompts, true, [], mockTranslate);
    });

    it('should call getGridColumns and getGridOptions for Prompts', () => {
      getFilePathGridOptions(mockTranslate, ApplicationRoute.Prompts);

      expect(baseAssetListUtils.getGridColumns).toHaveBeenCalledWith(expect.any(Function), {}, false);
      expect(fileManagerUtils.getGridOptions).toHaveBeenCalledWith(ApplicationRoute.Prompts, true, [], mockTranslate);
    });

    it('should return the result from getGridOptions', () => {
      const mockGridOptions = {
        columnDefs: [],
        defaultColDef: {},
      };
      vi.mocked(fileManagerUtils.getGridOptions).mockReturnValue(mockGridOptions as any);

      const result = getFilePathGridOptions(mockTranslate, ApplicationRoute.AssetsApplications);

      expect(result).toEqual(mockGridOptions);
    });

    it('should pass correct parameters to getGridOptions', () => {
      const mockColumnDefs = [{ field: 'name' }];
      vi.mocked(baseAssetListUtils.getGridColumns).mockReturnValue(mockColumnDefs as any);

      getFilePathGridOptions(mockTranslate, ApplicationRoute.AssetsToolsets);

      expect(fileManagerUtils.getGridOptions).toHaveBeenCalledWith(
        ApplicationRoute.Prompts,
        true,
        mockColumnDefs,
        mockTranslate,
      );
    });
  });
});
