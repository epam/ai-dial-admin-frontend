import { describe, expect, test } from 'vitest';

import { getGridColumns } from '@/src/components/Assets/BaseAssetList/utils';
import { getForbiddenSymbolsRegExp, isItemNameValid, isItemOpenable } from '@/src/components/Common/FileManager/utils';
import { ApplicationRoute } from '@/src/types/routes';

const VIEW = ApplicationRoute.PlatformCatalogSchemas;
const SCHEMA_ID = 'https://dial.epam.com/catalog_schemas/agent';

/**
 * A catalog schema's row name is its `$id`, a URI — the same identity shape App Runners has, and the
 * same reason the FileManager's generic filename rules must not apply to it.
 */
describe('Catalog schema asset :: URI-shaped names', () => {
  test('Should confirm a schema id trips the generic filename rule', () => {
    expect(isItemNameValid(SCHEMA_ID)).toBe(false);
  });

  test('Should still be openable, since navigation uses the encoded path', () => {
    expect(isItemOpenable(VIEW, SCHEMA_ID)).toBe(true);
  });

  test.each([ApplicationRoute.PlatformModels, ApplicationRoute.Prompts, ApplicationRoute.AssetsApplications])(
    'Should keep the generic rule for %s',
    (view) => {
      expect(isItemOpenable(view, SCHEMA_ID)).toBe(false);
      expect(isItemOpenable(view, 'plain-name')).toBe(true);
    },
  );

  test('Should not flag a schema id as containing forbidden symbols', () => {
    expect(getForbiddenSymbolsRegExp(VIEW)?.test(SCHEMA_ID)).toBe(false);
  });

  test('Should still flag control characters in a schema id', () => {
    expect(getForbiddenSymbolsRegExp(VIEW)?.test('https://a\u0007b')).toBe(true);
  });


  test('Should list metadata-only columns, with no version column', () => {
    const columns = getGridColumns(VIEW, () => void 0, {}, false);

    expect(columns).toHaveLength(4);
    expect(columns.map((column) => (column as { colId?: string }).colId)).toContain('author');
  });
});
