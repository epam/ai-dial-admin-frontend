import { describe, expect, test } from 'vitest';

import { getGridColumns } from '@/src/components/Assets/BaseAssetList/utils';
import { getForbiddenSymbolsRegExp, isItemNameValid, isItemOpenable } from '@/src/components/Common/FileManager/utils';
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
  const columnsOf = () => getGridColumns(VIEW, () => void 0, {}, false);

  test('Should expose createdAt as a locale-aware column factory, not a raw field', () => {
    const createdAt = columnsOf()[2] as unknown as (
      locale: Intl.LocalesArgument,
      options: Intl.DateTimeFormatOptions | undefined,
    ) => { field?: string; colId?: string; cellRenderer?: unknown };

    expect(typeof createdAt).toEqual('function');

    const resolved = createdAt('en-US', undefined);
    expect(resolved.field).toEqual('createdAt');
    expect(resolved.cellRenderer).toBeTypeOf('function');
  });

  test('Should not reuse the updated-time colId, which would collide in ag-grid', () => {
    const createdAt = columnsOf()[2] as unknown as (
      locale: Intl.LocalesArgument,
      options: Intl.DateTimeFormatOptions | undefined,
    ) => { colId?: string };
    const updatedAt = columnsOf()[3] as unknown as (
      locale: Intl.LocalesArgument,
      options: Intl.DateTimeFormatOptions | undefined,
    ) => { colId?: string };

    expect(createdAt('en-US', undefined).colId).toEqual('createdAt');
    expect(createdAt('en-US', undefined).colId).not.toEqual(updatedAt('en-US', undefined).colId);
  });
});
