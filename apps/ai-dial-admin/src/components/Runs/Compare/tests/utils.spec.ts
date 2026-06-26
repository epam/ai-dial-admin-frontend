import { describe, expect, test } from 'vitest';

import { CompareRunSlot } from '../constants';
import { getCompareRunsPath, getCompareRunsUrn, getSelectableCompareRuns } from '../utils';

describe('Runs Compare :: getSelectableCompareRuns', () => {
  const suiteRuns = [
    { id: 'run-1', testSuiteId: 'suite-1' },
    { id: 'run-2', testSuiteId: 'suite-1' },
    { id: 'run-3', testSuiteId: 'suite-1' },
  ] as const;

  test('excludes compared run when selecting primary run', () => {
    const runs = getSelectableCompareRuns([...suiteRuns], CompareRunSlot.Primary, 'run-1', 'run-2');
    expect(runs.map((run) => run.id)).toEqual(['run-1', 'run-3']);
  });

  test('excludes primary run when selecting secondary run', () => {
    const runs = getSelectableCompareRuns([...suiteRuns], CompareRunSlot.Secondary, 'run-1', 'run-2');
    expect(runs.map((run) => run.id)).toEqual(['run-2', 'run-3']);
  });
});

describe('Runs Compare :: getCompareRunsPath', () => {
  test('returns compare path with encoded run ids', () => {
    expect(getCompareRunsPath('run-1', 'run-2')).toBe('compare?runs=run-1,run-2');
  });
});

describe('Runs Compare :: getCompareRunsUrn', () => {
  test('returns full compare url', () => {
    expect(getCompareRunsUrn('run-1', 'run-2')).toBe('/runs/compare?runs=run-1,run-2');
  });
});
