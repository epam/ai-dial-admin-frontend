import { describe, expect, test } from 'vitest';

import { getConfigScopes } from '@/src/components/Common/ConfigScopeSelector/utils';
import { ExportComponentType } from '@/src/types/export';

describe('getConfigScopes', () => {
  test.each([
    [false, false, [ExportComponentType.ADMIN]],
    [true, false, [ExportComponentType.ADMIN, ExportComponentType.DEPLOYMENTS]],
    [false, true, [ExportComponentType.ADMIN, ExportComponentType.ANALYTICS]],
    [true, true, [ExportComponentType.ADMIN, ExportComponentType.DEPLOYMENTS, ExportComponentType.ANALYTICS]],
  ])('offers the scopes for deployments=%s analytics=%s', (deployments, analytics, expected) => {
    expect(getConfigScopes(deployments, analytics)).toEqual(expected);
  });
});
