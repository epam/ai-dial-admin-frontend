import { describe, expect, test } from 'vitest';

import { getIsConfigTransferEnabled } from '@/src/utils/env/get-config-transfer-toggle';

describe('getIsConfigTransferEnabled', () => {
  test.each([
    [false, false, false, false],
    [true, false, false, true],
    [false, true, false, true],
    [false, false, true, true],
  ])(
    'adminApi=%s deployments=%s analytics=%s -> %s',
    (adminApiEnabled, deploymentsEnabled, analyticsEnabled, expected) => {
      expect(getIsConfigTransferEnabled({ adminApiEnabled, deploymentsEnabled, analyticsEnabled })).toBe(expected);
    },
  );
});
