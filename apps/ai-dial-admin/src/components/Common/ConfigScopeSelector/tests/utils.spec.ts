import { describe, expect, test } from 'vitest';

import { getConfigScopes } from '@/src/components/Common/ConfigScopeSelector/utils';
import { ExportComponentType } from '@/src/types/export';

describe('getConfigScopes', () => {
  test.each([
    [true, false, false, [ExportComponentType.ADMIN]],
    [true, true, false, [ExportComponentType.ADMIN, ExportComponentType.DEPLOYMENTS]],
    [true, false, true, [ExportComponentType.ADMIN, ExportComponentType.ANALYTICS]],
    [true, true, true, [ExportComponentType.ADMIN, ExportComponentType.DEPLOYMENTS, ExportComponentType.ANALYTICS]],
    [false, true, true, [ExportComponentType.DEPLOYMENTS, ExportComponentType.ANALYTICS]],
    [false, false, true, [ExportComponentType.ANALYTICS]],
    [false, false, false, []],
  ])('offers the scopes for adminApi=%s deployments=%s analytics=%s', (adminApi, deployments, analytics, expected) => {
    expect(getConfigScopes(adminApi, deployments, analytics)).toEqual(expected);
  });
});
