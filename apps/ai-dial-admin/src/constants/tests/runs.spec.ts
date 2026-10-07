import { describe, expect, test } from 'vitest';

import { ALL_RUN_STATUSES } from '@/src/constants/runs';
import { RunStatus } from '@/src/models/evaluation/run';

describe('ALL_RUN_STATUSES', () => {
  test('lists every RunStatus value exactly once', () => {
    const expected = Object.values(RunStatus);

    expect(ALL_RUN_STATUSES).toHaveLength(expected.length);
    expect(new Set(ALL_RUN_STATUSES).size).toBe(ALL_RUN_STATUSES.length);
    expect(ALL_RUN_STATUSES.sort()).toEqual(expected.sort());
  });
});
