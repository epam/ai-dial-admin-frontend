import { describe, expect, test } from 'vitest';

import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialInterceptorResource } from '@/src/models/dial/resource';
import { AssetInterceptorOrigin } from '../models';
import { hasAssetInterceptorOrigin, mergeInterceptorOrigins, withAssetSourceColumn } from '../utils';

describe('mergeInterceptorOrigins', () => {
  test('tags admin-BE rows as Entity and asset rows as Asset', () => {
    const entityInterceptors = [{ name: 'redactor' }] as DialInterceptor[];
    const assetInterceptors = [{ name: 'logger', path: 'logger', folderId: '' }] as DialInterceptorResource[];

    const merged = mergeInterceptorOrigins(entityInterceptors, assetInterceptors);

    expect(merged).toEqual([
      { name: 'redactor', assetOrigin: AssetInterceptorOrigin.Entity },
      { name: 'logger', path: 'logger', folderId: '', assetOrigin: AssetInterceptorOrigin.Asset },
    ]);
  });

  test('a name present in both populations yields two distinguishable rows', () => {
    const entityInterceptors = [{ name: 'shared' }] as DialInterceptor[];
    const assetInterceptors = [{ name: 'shared', path: 'shared', folderId: '' }] as DialInterceptorResource[];

    const merged = mergeInterceptorOrigins(entityInterceptors, assetInterceptors);

    expect(merged).toHaveLength(2);
    expect(merged.map((row) => row.assetOrigin)).toEqual([AssetInterceptorOrigin.Entity, AssetInterceptorOrigin.Asset]);
  });

  test('returns an empty array when both populations are empty', () => {
    expect(mergeInterceptorOrigins([], [])).toEqual([]);
  });
});

describe('hasAssetInterceptorOrigin', () => {
  test('is true when a row carries assetOrigin', () => {
    expect(hasAssetInterceptorOrigin([{ assetOrigin: AssetInterceptorOrigin.Asset }])).toBe(true);
  });

  test('is false for rows with no assetOrigin', () => {
    expect(hasAssetInterceptorOrigin([{ name: 'plain' }])).toBe(false);
  });

  test('is false for a null/undefined row set', () => {
    expect(hasAssetInterceptorOrigin(null)).toBe(false);
    expect(hasAssetInterceptorOrigin(undefined)).toBe(false);
  });
});

describe('withAssetSourceColumn', () => {
  test('appends a Source column when rows carry assetOrigin', () => {
    const columns = withAssetSourceColumn([{ field: 'displayName' }], [{ assetOrigin: AssetInterceptorOrigin.Asset }]);

    expect(columns).toHaveLength(2);
    expect(columns[1]).toMatchObject({ headerName: 'Source', colId: 'assetOrigin' });
  });

  test('leaves columns unchanged when no row carries assetOrigin', () => {
    const base = [{ field: 'displayName' }];

    expect(withAssetSourceColumn(base, [{ name: 'plain' }])).toBe(base);
  });
});
