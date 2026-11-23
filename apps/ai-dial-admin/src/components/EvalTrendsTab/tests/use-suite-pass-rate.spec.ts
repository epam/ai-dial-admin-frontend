import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useSuitePassRate } from '@/src/components/EvalTrendsTab/use-suite-pass-rate';

const getSuitePassRateMock = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getSuitePassRate: (...args: unknown[]) => getSuitePassRateMock(...args),
}));

describe('useSuitePassRate', () => {
  beforeEach(() => {
    getSuitePassRateMock.mockReset();
    getSuitePassRateMock.mockResolvedValue({
      passRate: 1,
      previousPassRate: null,
      suiteCount: 1,
      previousSuiteCount: 0,
    });
  });

  test('passes an id that contains a comma as one suite id', async () => {
    renderHook(() => useSuitePassRate(['suite,a', 'suite-b']));

    await vi.waitFor(() => expect(getSuitePassRateMock).toHaveBeenCalledWith(['suite,a', 'suite-b']));
  });
});
