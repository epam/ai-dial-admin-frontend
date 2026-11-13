import { describe, expect, test } from 'vitest';

import { getFlatAssetColumns } from '@/src/components/Assets/FlatAssetGrid/columns';
import { getForbiddenSymbolsRegExp, isItemNameValid, isItemOpenable } from '@/src/components/Common/FileManager/utils';
import { AssetSource } from '@/src/models/dial/asset-source';
import { ApplicationRoute } from '@/src/types/routes';

const VIEW = ApplicationRoute.PlatformAppRunners;
const RUNNER_ID = 'http://asdqwe';

/**
 * An app runner's row name is its `$id`, a URI. The FileManager's generic name rules assume a
 * filename, so `:` and `/` make every row look invalid — grey name, disabled actions, dead click —
 * while the encoded `path` the CRUD calls use is unaffected.
 */
describe('App runner asset :: URI-shaped names', () => {
  test('Should confirm a runner id trips the generic filename rule', () => {
    expect(isItemNameValid(RUNNER_ID)).toBe(false);
  });

  test('Should still be openable, since navigation uses the encoded path', () => {
    expect(isItemOpenable(VIEW, RUNNER_ID)).toBe(true);
  });

  test.each([ApplicationRoute.PlatformModels, ApplicationRoute.Prompts, ApplicationRoute.AssetsApplications])(
    'Should keep the generic rule for %s',
    (view) => {
      expect(isItemOpenable(view, RUNNER_ID)).toBe(false);
      expect(isItemOpenable(view, 'plain-name')).toBe(true);
    },
  );

  test('Should not flag a runner id as containing forbidden symbols', () => {
    expect(getForbiddenSymbolsRegExp(VIEW)?.test(RUNNER_ID)).toBe(false);
  });

  test('Should still flag control characters in a runner id', () => {
    expect(getForbiddenSymbolsRegExp(VIEW)?.test('http://ab')).toBe(true);
  });

  test('Should leave other views on the ui-kit default', () => {
    expect(getForbiddenSymbolsRegExp(ApplicationRoute.Prompts)).toBeUndefined();
  });
});

describe('App runner asset :: created time column', () => {
  const columnsOf = () =>
    getFlatAssetColumns(VIEW, AssetSource.Platform, () => undefined, { name: 'Name', costObject: 'Cost object' });

  test('Should expose createdAt as its own column with a date formatter', () => {
    const createdAt = columnsOf().find((column) => column.field === 'createdAt');

    expect(createdAt).toBeDefined();
    expect(createdAt?.valueFormatter).toBeTypeOf('function');
  });

  test('Should not reuse the updated-time colId, which would collide in ag-grid', () => {
    const createdAt = columnsOf().find((column) => column.field === 'createdAt');
    const updatedAt = columnsOf().find((column) => column.field === 'updatedAt');

    expect(createdAt?.field).not.toEqual(updatedAt?.field);
    expect(createdAt?.colId ?? createdAt?.field).not.toEqual(updatedAt?.colId ?? updatedAt?.field);
  });
});
