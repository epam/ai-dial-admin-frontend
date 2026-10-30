import { FileManagerColumnKey } from '@epam/ai-dial-react-file-manager';
import { ColDef } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';
import FormattedValueCellRenderer from '@/src/components/Grid/CellRenderers/FormattedValueCellRenderer';
import { getGridColumns, getPlatformAssetDuplicate } from '@/src/components/Assets/BaseAssetList/utils';
import { DialAppRunnerResource, DialModelResource, PlatformAsset } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

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

    test('should drop the source row identity so the redirect targets the duplicate, not the original', () => {
      const source = {
        name: 'schema-copy',
        $id: 'schema-copy',
        _metadata: { name: 'schema', path: 'platform/schema', folderId: 'platform/' },
      } as unknown as PlatformAsset;

      const duplicate = getPlatformAssetDuplicate(ApplicationRoute.PlatformCatalogSchemas, source);

      expect(duplicate).not.toHaveProperty('_metadata');
      expect(getUrnForEntity(ApplicationRoute.PlatformCatalogSchemas, { ...duplicate, folderId: 'platform/' })).toBe(
        '/platform-catalog-schemas/schema-copy',
      );
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
      const columns = resolveColumns(getGridColumns(view, 'file/'));

      expect(columns).toHaveLength(1);
      expect(columns[0]).toMatchObject({ colId: FileManagerColumnKey.Name, field: 'name', headerName });
    });
  });

  describe('getGridColumns — dual-bucket views', () => {
    test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
      '%s uses the flat platform-entity column set (no Version column) while browsing the platform bucket',
      (view) => {
        const colIds = resolveColIds(getGridColumns(view, 'platform/'));

        expect(colIds).not.toContain(FileManagerColumnKey.Version);
        expect(colIds).toContain(FileManagerColumnKey.Name);
        expect(colIds).toEqual(resolveColIds(getGridColumns(ApplicationRoute.PlatformKeys)));
      },
    );

    test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
      '%s keeps the existing Version column while browsing the public bucket',
      (view) => {
        const withPublicPath = resolveColIds(getGridColumns(view, 'public/'));
        const withoutPath = resolveColIds(getGridColumns(view));

        expect(withPublicPath).toContain(FileManagerColumnKey.Version);
        expect(withPublicPath).toEqual(withoutPath);
      },
    );
  });

  describe('getGridColumns — versioned asset views', () => {
    test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
      '%s uses the identity display column, labeled Name, for the name column',
      (view) => {
        const columns = resolveColumns(getGridColumns(view));
        const nameColumn = columns.find((c) => c.colId === FileManagerColumnKey.Name);

        expect(nameColumn?.headerName).toBe('Name');
        expect(columns.find((c) => c.colId === FileManagerColumnKey.Version)).toMatchObject({
          field: 'version',
          cellRenderer: FormattedValueCellRenderer,
        });
      },
    );
  });

  describe('getGridColumns — PlatformTranslators', () => {
    test('uses the flat platform-entity column set, matching its Catalog siblings', () => {
      const colIds = resolveColIds(getGridColumns(ApplicationRoute.PlatformTranslators));

      expect(colIds).not.toContain(FileManagerColumnKey.Version);
      expect(colIds).toEqual(resolveColIds(getGridColumns(ApplicationRoute.PlatformKeys)));
    });
  });
});
