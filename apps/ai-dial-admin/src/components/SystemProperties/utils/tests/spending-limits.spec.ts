import { describe, expect, test } from 'vitest';

import { isDefaultCostObjectValid } from '@/src/components/SystemProperties/utils/spending-limits';

describe('isDefaultCostObjectValid', () => {
  test.each(['', '   ', '\n\t'])('rejects a blank value %j', (value) => {
    expect(isDefaultCostObjectValid(value)).toBe(false);
  });

  test.each(['ORG', ' team/a b '])('accepts a nonblank value %j', (value) => {
    expect(isDefaultCostObjectValid(value)).toBe(true);
  });
});
