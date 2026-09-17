import { describe, expect, test } from 'vitest';

import {
  getMockRunCost,
  getMockRunMetricNames,
  getMockRunOverallScore,
  getMockRunTarget,
} from '@/src/components/Runs/mocks/run-list-mock-data';
import {
  RUN_LIST_MOCK_FIXTURES,
  RUN_WITH_ALL_MOCK_VALUES,
  RUN_WITH_ONE_MOCK_METRIC,
  RUN_WITH_TWELVE_MOCK_METRICS,
  RUN_WITHOUT_MOCK_COST,
  RUN_WITHOUT_MOCK_METRICS,
  RUN_WITHOUT_MOCK_SCORE,
  RUNNING_RUN,
} from '@/src/components/Runs/mocks/run-list-mock-fixtures';
import { Run } from '@/src/models/evaluation/run';

describe('getMockRunTarget', () => {
  test('resolves a name and a kind for a run', () => {
    expect(getMockRunTarget(RUN_WITH_ALL_MOCK_VALUES)).toEqual({ name: expect.any(String), kind: expect.any(String) });
  });

  test.each(RUN_LIST_MOCK_FIXTURES)('returns the same target for $id on every call', (run: Run) => {
    // The infinite row model re-renders a row on scroll and sort with a fresh object; a value that
    // changed between renders would make the cell flicker.
    expect(getMockRunTarget({ ...run })).toEqual(getMockRunTarget(run));
  });

  test('returns nothing for a run with no id', () => {
    expect(getMockRunTarget({} as Run)).toBeNull();
  });
});

describe('getMockRunMetricNames', () => {
  test.each([
    [RUN_WITH_ALL_MOCK_VALUES, 6],
    [RUN_WITH_TWELVE_MOCK_METRICS, 12],
    [RUN_WITHOUT_MOCK_METRICS, 0],
    [RUN_WITH_ONE_MOCK_METRIC, 1],
  ])('resolves $testRunName to its expected number of metric names', (run: Run, expected: number) => {
    expect(getMockRunMetricNames(run)).toHaveLength(expected);
  });

  test.each(RUN_LIST_MOCK_FIXTURES)('returns the same metric names for $id on every call', (run: Run) => {
    expect(getMockRunMetricNames({ ...run })).toEqual(getMockRunMetricNames(run));
  });

  test('returns no metric names for a run with no id', () => {
    expect(getMockRunMetricNames({} as Run)).toEqual([]);
  });
});

describe('getMockRunCost', () => {
  test('resolves a cost for a settled run that has one', () => {
    expect(getMockRunCost(RUN_WITH_ALL_MOCK_VALUES)).toBeGreaterThan(0);
  });

  test('resolves no cost for the run fixture that stands for a missing cost', () => {
    expect(getMockRunCost(RUN_WITHOUT_MOCK_COST)).toBeNull();
  });

  test('resolves no cost for a run that has not settled', () => {
    expect(getMockRunCost(RUNNING_RUN)).toBeNull();
  });

  test.each(RUN_LIST_MOCK_FIXTURES)('returns the same cost for $id on every call', (run: Run) => {
    expect(getMockRunCost({ ...run })).toBe(getMockRunCost(run));
  });

  test('resolves no cost for a run with no id', () => {
    expect(getMockRunCost({} as Run)).toBeNull();
  });
});

describe('getMockRunOverallScore', () => {
  test('resolves a score for a settled run that has one', () => {
    expect(getMockRunOverallScore(RUN_WITH_ALL_MOCK_VALUES)).toBeGreaterThan(0);
  });

  test('resolves no score for the run fixture that stands for a missing score', () => {
    expect(getMockRunOverallScore(RUN_WITHOUT_MOCK_SCORE)).toBeNull();
  });

  test('resolves no score for a run that has not settled', () => {
    expect(getMockRunOverallScore(RUNNING_RUN)).toBeNull();
  });

  test.each(RUN_LIST_MOCK_FIXTURES)('returns the same score for $id on every call', (run: Run) => {
    expect(getMockRunOverallScore({ ...run })).toBe(getMockRunOverallScore(run));
  });

  test('resolves no score for a run with no id', () => {
    expect(getMockRunOverallScore({} as Run)).toBeNull();
  });
});
