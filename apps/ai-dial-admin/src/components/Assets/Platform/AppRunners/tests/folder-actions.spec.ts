import { describe, expect, test } from 'vitest';

import { getFlatAssetColumns } from '@/src/components/Assets/FlatAssetGrid/columns';
import { getGridActionLabels, getToolbarOptionLabels } from '@/src/components/Assets/utils';
import { AssetSource } from '@/src/models/dial/asset-source';
import { ApplicationRoute } from '@/src/types/routes';

const VIEW = ApplicationRoute.PlatformAppRunners;

/**
 * The App runner list is a flat grid on the Platform tab, not a file-manager tree, so the file manager's label
 * helpers must offer nothing for it: a folder operation would submit a placeholder Core cannot store.
 */
describe('App runner asset :: folder operations', () => {
  test('Should offer no file-manager toolbar entries', () => {
    expect(getToolbarOptionLabels(VIEW, false)).toEqual([]);
  });

  test('Should offer no file-manager row actions', () => {
    expect(getGridActionLabels(VIEW, false)).toEqual([]);
  });
});

type ColumnFactory = (dateLocale?: unknown, dateOptions?: unknown) => { colId?: string; field?: string };

const columnIds = (view: ApplicationRoute): (string | undefined)[] =>
  getFlatAssetColumns(view, AssetSource.Platform, () => undefined, { name: 'Name', costObject: 'Cost object' }).map(
    (column) => {
      const resolved = typeof column === 'function' ? (column as unknown as ColumnFactory)('en-US', void 0) : column;

      return resolved.colId ?? resolved.field;
    },
  );

describe('App runner asset :: list columns', () => {
  test('Should expose name, author, created-at and updated-at', () => {
    expect(columnIds(VIEW)).toEqual(['name', 'author', 'createdAt', 'updatedAt']);
  });

  test('Should not collide colIds, since two columns sharing one break ag-grid', () => {
    const ids = columnIds(VIEW);

    expect(new Set(ids).size).toBe(ids.length);
  });

  test('Should carry no version or folder column', () => {
    expect(columnIds(VIEW)).not.toContain('version');
    expect(columnIds(VIEW)).not.toContain('folder');
  });
});
