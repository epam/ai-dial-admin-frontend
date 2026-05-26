import { describe, expect, test, vi } from 'vitest';
import { ApplicationRoute } from '@/src/types/routes';
import { FileManagerI18nKey } from '@/src/constants/i18n';
import { DialFileNodeType } from '@/src/models/dial/file';
import { FileManagerColumnKey } from '@epam/ai-dial-ui-kit';
import {
  getDeleteModalDescription,
  getDeleteModalTitle,
  getGridColumns,
  generateTreeForDeletingItems,
  normalizePath,
  processAssetsData,
} from '../utils';
import { Asset, AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';

const t = (key: string, options?: Record<string, string | number>) => {
  if (options?.items) {
    return `${key}:${options.items}`;
  }

  return key;
};

describe('Assets Modals utils', () => {
  describe('getGridColumns', () => {
    test('returns Name and Version columns for prompts, applications and toolsets', () => {
      const promptsColumns = getGridColumns(ApplicationRoute.Prompts, true);
      const appsColumns = getGridColumns(ApplicationRoute.AssetsApplications, true);
      const toolsetsColumns = getGridColumns(ApplicationRoute.AssetsToolsets, true);

      expect(promptsColumns).toHaveLength(2);
      expect(!!promptsColumns.some((column) => (column as ColDef).colId === FileManagerColumnKey.Version)).toBeTruthy();
      expect(!!appsColumns.some((column) => (column as ColDef).colId === FileManagerColumnKey.Version)).toBeTruthy();
      expect(
        !!toolsetsColumns.some((column) => (column as ColDef).colId === FileManagerColumnKey.Version),
      ).toBeTruthy();
    });

    test('returns Name and Size columns for files view', () => {
      const columns = getGridColumns(ApplicationRoute.Files, true);

      expect(columns).toHaveLength(2);
      expect(!!columns.some((column) => (column as ColDef).colId === FileManagerColumnKey.Size)).toBeTruthy();
    });
  });

  describe('getDeleteModalTitle', () => {
    test('returns folder-aware title when folders are included', () => {
      const result = getDeleteModalTitle(ApplicationRoute.Prompts, t, 1, true);
      expect(result).toBe(FileManagerI18nKey.DeleteItemsAndFoldersModalTitle);
    });

    test('returns singular prompt title when deleting one prompt', () => {
      const result = getDeleteModalTitle(ApplicationRoute.Prompts, t, 1, false);
      expect(result).toBe(`${FileManagerI18nKey.DeleteItemsModalTitle}:FileManager.Prompt`);
    });

    test('returns plural file title when deleting multiple files', () => {
      const result = getDeleteModalTitle(ApplicationRoute.Files, t, 2, false);
      expect(result).toBe(`${FileManagerI18nKey.DeleteItemsModalTitle}:FileManager.Files`);
    });
  });

  describe('getDeleteModalDescription', () => {
    test('returns folder-aware description for applications', () => {
      const result = getDeleteModalDescription(ApplicationRoute.AssetsApplications, t, 1, true);
      expect(result).toBe(`${FileManagerI18nKey.DeleteItemsAndFoldersModalDescription}:filemanager.applications`);
    });

    test('returns singular prompt description when deleting one prompt', () => {
      const result = getDeleteModalDescription(ApplicationRoute.Prompts, t, 1, false);
      expect(result).toBe(`${FileManagerI18nKey.DeleteItemsModalDescription}:filemanager.prompt`);
    });

    test('returns plural toolset description when deleting multiple toolsets', () => {
      const result = getDeleteModalDescription(ApplicationRoute.AssetsToolsets, t, 3, false);
      expect(result).toBe(`${FileManagerI18nKey.DeleteItemsModalDescription}:filemanager.toolsets`);
    });
  });

  describe('normalizePath', () => {
    test('appends slash when missing', () => {
      expect(normalizePath('folder/subfolder')).toBe('folder/subfolder/');
    });

    test('keeps path unchanged when slash already exists', () => {
      expect(normalizePath('folder/subfolder/')).toBe('folder/subfolder/');
    });
  });

  describe('generateTreeForDeletingItems', () => {
    const originalItems = [
      {
        id: 'folder-1',
        name: 'Folder One',
        path: 'folder1/',
        parentPath: '',
        nodeType: DialFileNodeType.FOLDER,
        items: [
          {
            id: 'file-1',
            name: 'file.txt',
            path: 'folder1/file.txt',
            parentPath: 'folder1/',
            nodeType: DialFileNodeType.ITEM,
          },
        ],
      },
    ];

    test('builds tree and path mapping for a top-level folder', () => {
      const itemsToDelete = [{ id: 'folder-1', name: 'Folder One', path: 'folder1/' }];
      const { treeItems, pathMapping } = generateTreeForDeletingItems(
        originalItems as Asset[],
        itemsToDelete as DialFile[],
        'Selected Items to delete',
      );

      expect(treeItems).toHaveLength(1);
      const root = treeItems[0];
      expect(root.path).toBe('Selected Items to delete/');
      expect(root.items).toHaveLength(1);
      expect(root.items?.[0].path).toBe('Selected Items to delete/folder1/');
      expect(root.items?.[0].items?.[0].path).toBe('Selected Items to delete/folder1/file.txt');
      expect(pathMapping.get('Selected Items to delete/folder1/')).toBe('folder1/');
      expect(pathMapping.get('Selected Items to delete/folder1/file.txt')).toBe('folder1/file.txt');
    });

    test('builds tree and path mapping for a single file', () => {
      const itemsToDelete = [{ id: 'file-1', name: 'file.txt', path: 'folder1/file.txt' }];
      const { treeItems, pathMapping } = generateTreeForDeletingItems(
        originalItems as Asset[],
        itemsToDelete as DialFile[],
        'Selected Items to delete',
      );

      expect(treeItems[0].items).toHaveLength(1);
      expect(treeItems[0].items?.[0].path).toBe('Selected Items to delete/file.txt');
      expect(treeItems[0].items?.[0].parentPath).toBe('Selected Items to delete/');
      expect(pathMapping.get('Selected Items to delete/file.txt')).toBe('folder1/file.txt');
    });
  });

  describe('processAssetsData', () => {
    test('processes single item without folder', () => {
      const assets = [
        {
          id: 'asset-1',
          name: 'prompt1',
          version: '1.0',
          folderId: 'folder1',
          path: 'folder1/prompt1',
          nodeType: DialFileNodeType.ITEM,
        },
      ];
      const selectedVersionsMap = {};

      const result = processAssetsData(assets, selectedVersionsMap, ApplicationRoute.Prompts);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('prompt1');
      expect(result[0].versions).toEqual(['1.0']);
      expect(result[0].selectedVersions).toEqual(['1.0']);
    });

    test('uses selectedVersionsMap when available', () => {
      const assets = [
        {
          id: 'asset-1',
          name: 'app1',
          version: '1.0',
          folderId: 'folder1',
          path: 'folder1/app1',
          nodeType: DialFileNodeType.ITEM,
        },
      ];
      const selectedVersionsMap = { folder1app1: ['1.0', '2.0'] };

      const result = processAssetsData(assets, selectedVersionsMap, ApplicationRoute.AssetsApplications);

      expect(result[0].selectedVersions).toEqual(['1.0', '2.0']);
    });

    test('deduplicates items with same name and merges versions', () => {
      const assets = [
        {
          id: 'asset-1',
          name: 'toolset',
          version: '1.0',
          folderId: 'folder1',
          path: 'folder1/toolset',
          nodeType: DialFileNodeType.ITEM,
        },
        {
          id: 'asset-2',
          name: 'toolset',
          version: '2.0',
          folderId: 'folder2',
          path: 'folder2/toolset',
          nodeType: DialFileNodeType.ITEM,
        },
      ];
      const selectedVersionsMap = {};

      const result = processAssetsData(assets, selectedVersionsMap, ApplicationRoute.AssetsToolsets);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('toolset');
      expect(result[0].versions).toContain('1.0');
      expect(result[0].versions).toContain('2.0');
    });

    test('avoids duplicate versions when merging', () => {
      const assets = [
        {
          id: 'asset-1',
          name: 'file',
          version: '1.0',
          folderId: 'folder1',
          path: 'folder1/file',
          nodeType: DialFileNodeType.ITEM,
        },
        {
          id: 'asset-2',
          name: 'file',
          version: '1.0',
          folderId: 'folder2',
          path: 'folder2/file',
          nodeType: DialFileNodeType.ITEM,
        },
      ];
      const selectedVersionsMap = {};

      const result = processAssetsData(assets, selectedVersionsMap, ApplicationRoute.AssetsApplications);

      expect(result).toHaveLength(1);
      expect(result[0].versions?.filter((v) => v === '1.0')).toHaveLength(1);
    });

    test('recursively processes nested folders', () => {
      const assets = [
        {
          id: 'folder-1',
          name: 'folder1',
          path: 'folder1/',
          nodeType: DialFileNodeType.FOLDER,
          items: [
            {
              id: 'asset-1',
              name: 'prompt',
              version: '1.0',
              folderId: 'folder1',
              path: 'folder1/prompt',
              nodeType: DialFileNodeType.ITEM,
            },
          ],
        },
      ];
      const selectedVersionsMap = {};

      const result = processAssetsData(assets as AssetWithVersion[], selectedVersionsMap, ApplicationRoute.Prompts);

      expect(result).toHaveLength(1);
      expect(result[0].nodeType).toBe(DialFileNodeType.FOLDER);
      expect(result[0].items).toHaveLength(1);
      expect(result[0].items?.[0].name).toBe('prompt');
    });

    test('handles empty asset array', () => {
      const result = processAssetsData([], {}, ApplicationRoute.Prompts);
      expect(result).toEqual([]);
    });

    test('preserves folder structure while deduplicating items', () => {
      const assets = [
        {
          id: 'folder-1',
          name: 'folder1',
          path: 'folder1/',
          nodeType: DialFileNodeType.FOLDER,
          items: [
            {
              id: 'asset-1',
              name: 'item',
              version: '1.0',
              folderId: 'folder1',
              path: 'folder1/item',
              nodeType: DialFileNodeType.ITEM,
            },
            {
              id: 'asset-2',
              name: 'item',
              version: '2.0',
              folderId: 'folder1',
              path: 'folder1/item-v2',
              nodeType: DialFileNodeType.ITEM,
            },
          ],
        },
      ];
      const selectedVersionsMap = {};

      const result = processAssetsData(assets as AssetWithVersion[], selectedVersionsMap, ApplicationRoute.Prompts);

      expect(result).toHaveLength(1);
      expect(result[0].items).toHaveLength(1);
      expect(result[0].items?.[0].versions).toContain('1.0');
      expect(result[0].items?.[0].versions).toContain('2.0');
    });
  });
});
