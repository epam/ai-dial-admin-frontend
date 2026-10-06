import { FileManagerColumnKey } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';
import { getAllSelectedItemsPaths, getGridColumns, getPlatformAssetDuplicate } from '../utils';
import { DialAppRunnerResource, DialModelResource, PlatformAsset } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';

/**
 * `getGridColumns` returns ui-kit's curried column factories alongside plain `ColDef`s —
 * `useFileManagerColumns` invokes the former with the locale and compact-view arguments. Resolve
 * them here so assertions see the same shape ag-grid does.
 */
const resolveColumns = (columns: ColDef[]): ColDef[] =>
  columns.map((column) =>
    typeof column === 'function' ? (column as (...args: unknown[]) => ColDef)(undefined, undefined, false) : column,
  );

const resolveColIds = (columns: ColDef[]): (string | undefined)[] => resolveColumns(columns).map((c) => c.colId);

describe('BaseAssetList', () => {
  describe('getAllSelectedItemsPaths', () => {
    test('should get all selected paths for base path', () => {
      const mockSelectedVersionsMap = {
        'public/test': ['1', '2', '3'],
      };
      const basePath = 'public/test__3';
      const result = getAllSelectedItemsPaths(basePath, mockSelectedVersionsMap);

      expect(result).toHaveLength(3);
      expect(result).to.have.members(['public/test__1', 'public/test__2', 'public/test__3']);
    });

    test('should get base path if selected items no specified', () => {
      const mockSelectedVersionsMap = {};
      const basePath = 'public/test__3';
      const result = getAllSelectedItemsPaths(basePath, mockSelectedVersionsMap);

      expect(result).toHaveLength(1);
      expect(result).to.have.members(['public/test__3']);
    });
  });

  describe('getPlatformAssetDuplicate', () => {
    const model = {
      name: 'gpt-4-copy',
      displayName: 'GPT-4 copy',
      endpoint: 'http://model/chat',
      path: 'platform/gpt-4',
      folderId: 'platform/',
      author: 'someone',
      createdAt: '1',
      updatedAt: '2',
      status: 'valid',
      validationWarnings: [{ field: 'endpoint' }],
      reference: 'abc123',
    } as unknown as DialModelResource;

    const runner = {
      $id: 'http://runner/schema-copy',
      'dial:applicationTypeDisplayName': 'Runner copy',
      name: 'http%3A%2F%2Frunner%2Fschema',
      path: 'platform/http%3A%2F%2Frunner%2Fschema',
      folderId: 'platform/',
      author: 'someone',
      createdAt: '1',
      updatedAt: '2',
    } as unknown as DialAppRunnerResource;

    test('should keep the model name, since it is the identity the user just edited', () => {
      const duplicate = getPlatformAssetDuplicate(ApplicationRoute.PlatformModels, model) as DialModelResource;

      expect(duplicate.name).toBe('gpt-4-copy');
      expect(duplicate.displayName).toBe('GPT-4 copy');
      expect(duplicate.endpoint).toBe('http://model/chat');
    });

    test('should drop the fields Core owns from a model duplicate', () => {
      const duplicate = getPlatformAssetDuplicate(ApplicationRoute.PlatformModels, model);

      expect(duplicate).not.toHaveProperty('path');
      expect(duplicate).not.toHaveProperty('folderId');
      expect(duplicate).not.toHaveProperty('author');
      expect(duplicate).not.toHaveProperty('createdAt');
      expect(duplicate).not.toHaveProperty('updatedAt');
      expect(duplicate).not.toHaveProperty('status');
      expect(duplicate).not.toHaveProperty('validationWarnings');
      expect(duplicate).not.toHaveProperty('reference');
    });

    test('should not drop the runner name', () => {
      const duplicate = getPlatformAssetDuplicate(ApplicationRoute.PlatformAppRunners, runner) as DialAppRunnerResource;

      expect(duplicate).not.toHaveProperty('path');
      expect(duplicate.$id).toBe('http://runner/schema-copy');
      expect(duplicate['dial:applicationTypeDisplayName']).toBe('Runner copy');
    });

    test('should not mutate the asset it was given', () => {
      const source = { ...model } as PlatformAsset;
      getPlatformAssetDuplicate(ApplicationRoute.PlatformModels, source);

      expect(source).toEqual(model);
    });
  });

  describe('getGridColumns — file roots', () => {
    test.each([
      [ApplicationRoute.PlatformModels, 'Name'],
      [ApplicationRoute.PlatformCatalogSchemas, 'Name'],
      [ApplicationRoute.PlatformAppRunners, 'Name'],
      [ApplicationRoute.AssetsApplications, 'Name'],
      [ApplicationRoute.AssetsToolsets, 'Name'],
    ])('%s uses the asset name column labeled %s', (view, headerName) => {
      const columns = resolveColumns(getGridColumns(view, vi.fn(), {}, false, 'file/'));

      expect(columns).toHaveLength(1);
      expect(columns[0]).toMatchObject({ colId: FileManagerColumnKey.Name, field: 'name', headerName });
    });
  });

  describe('getGridColumns — dual-bucket views', () => {
    const onChange = vi.fn();

    test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
      '%s uses the flat platform-entity column set (no Version column) while browsing the platform bucket',
      (view) => {
        const colIds = resolveColIds(getGridColumns(view, onChange, {}, false, 'platform/'));

        expect(colIds).not.toContain(FileManagerColumnKey.Version);
        expect(colIds).toContain(FileManagerColumnKey.Name);
        expect(colIds).toEqual(resolveColIds(getGridColumns(ApplicationRoute.PlatformKeys, onChange, {}, false)));
      },
    );

    test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
      '%s keeps the existing Version column while browsing the public bucket',
      (view) => {
        const withPublicPath = resolveColIds(getGridColumns(view, onChange, {}, false, 'public/'));
        const withoutPath = resolveColIds(getGridColumns(view, onChange, {}, false));

        expect(withPublicPath).toContain(FileManagerColumnKey.Version);
        expect(withPublicPath).toEqual(withoutPath);
      },
    );
  });

  describe('getGridColumns — versioned asset views', () => {
    test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
      '%s uses the identity display column, labeled Name, for the name column',
      (view) => {
        const onChange = vi.fn();
        const columns = resolveColumns(getGridColumns(view, onChange, {}, false));
        const nameColumn = columns.find((c) => c.colId === FileManagerColumnKey.Name);

        expect(nameColumn?.headerName).toBe('Name');
      },
    );
  });

  describe('getGridColumns — PlatformTranslators', () => {
    test('uses the flat platform-entity column set, matching its Catalog siblings', () => {
      const onChange = vi.fn();
      const colIds = resolveColIds(getGridColumns(ApplicationRoute.PlatformTranslators, onChange, {}, false));

      expect(colIds).not.toContain(FileManagerColumnKey.Version);
      expect(colIds).toEqual(resolveColIds(getGridColumns(ApplicationRoute.PlatformKeys, onChange, {}, false)));
    });
  });
});
