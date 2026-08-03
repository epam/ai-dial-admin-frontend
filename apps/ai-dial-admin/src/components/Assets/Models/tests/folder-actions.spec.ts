import { describe, expect, test } from 'vitest';

import { getGridColumns, getEmptyAsset } from '@/src/components/Assets/BaseAssetList/utils';
import { getGridActionLabels, getToolbarOptionLabels, getTreeActionLabels } from '@/src/components/Assets/utils';
import { ApplicationRoute } from '@/src/types/routes';

const VIEW = ApplicationRoute.AssetsModels;

/**
 * Models are flat in Core's `platform` bucket. Browser verification found the tree root still offered
 * `Add child`, which submits the `getEmptyAsset` placeholder Core cannot store — and it failed
 * invisibly: the pending node vanished with no error, no toast, and an HTTP 200 server action.
 */
describe('Model asset :: folder operations', () => {
  test('Should offer no tree actions, since the tree holds only the flat root', () => {
    expect(getTreeActionLabels(false, VIEW)).toEqual([]);
  });

  test.each(['addSibling', 'addChild', 'move', 'rename', 'managePermissions'])(
    'Should not offer %s on the tree',
    (action) => {
      expect(getTreeActionLabels(false, VIEW).map((item) => item.key)).not.toContain(action);
    },
  );

  test('Should offer no folder creation in the toolbar', () => {
    expect(getToolbarOptionLabels(VIEW, false).map((item) => item.key)).toEqual(['newItem']);
  });

  test('Should offer only delete in the grid context menu', () => {
    expect(getGridActionLabels(VIEW, false).map((item) => item.key)).toEqual(['delete']);
  });

  test('Should confirm the placeholder a folder create would send is not a usable model', () => {
    expect(getEmptyAsset(VIEW, 'platform/')).not.toHaveProperty('endpoint');
  });
});

type ColumnFactory = (dateLocale?: unknown, dateOptions?: unknown) => { colId?: string; field?: string };

/**
 * Date columns are supplied as locale-taking factories cast to `ColDef`, so resolving them is the only
 * way to read their `colId` — which is what matters here, since the created-at column is derived from
 * the updated-at one and two columns sharing a `colId` silently collide in ag-grid.
 */
const columnIds = (view: ApplicationRoute): (string | undefined)[] =>
  getGridColumns(view).map((column) => {
    const resolved = typeof column === 'function' ? (column as ColumnFactory)('en-US', void 0) : column;

    return resolved.colId ?? resolved.field;
  });

describe('Model asset :: list columns', () => {
  test('Should expose name, author, created-at and updated-at', () => {
    expect(columnIds(VIEW)).toEqual(['name', 'author', 'createdAt', 'updatedAt']);
  });

  test('Should not collide colIds, since two columns sharing one break ag-grid', () => {
    const ids = columnIds(VIEW);

    expect(new Set(ids).size).toBe(ids.length);
  });

  test('Should match the sibling flat view, both being metadata-only', () => {
    expect(columnIds(VIEW)).toEqual(columnIds(ApplicationRoute.AssetsAppRunners));
  });

  test('Should carry no version column, unlike the foldered views', () => {
    expect(columnIds(VIEW)).not.toContain('version');
    expect(columnIds(ApplicationRoute.Prompts)).toContain('version');
  });
});
