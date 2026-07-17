import { describe, expect, test } from 'vitest';

import {
  formatHeatMapTestCaseColId,
  formatHeatMapTestCaseHeader,
  getHeatMapTestCaseColId,
  getHeatMapTestCaseHeaderLabels,
  getHeatMapTestCaseKey,
  hasHeatMapMultiSubRuns,
} from '@/src/components/Runs/Compare/HeatMap/utils/heat-map-test-case-columns';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { AnalyticsResult } from '@/src/models/evaluation/run';

const makeResult = (overrides: Partial<AnalyticsResult> = {}): AnalyticsResult => ({
  id: 'result-1',
  testCaseId: 'tc-1',
  testCaseName: 'BLR',
  runIndex: 0,
  responseStatusCode: 200,
  executionStatus: 'SUCCESS',
  metricValues: {},
  ...overrides,
});

const makeRow = (overrides: Partial<CompareAnalyticsRow> = {}): CompareAnalyticsRow => ({
  ...makeResult(),
  ...overrides,
});

describe('getHeatMapTestCaseKey', () => {
  test('prefers testCaseId, then testCaseName, then id', () => {
    expect(getHeatMapTestCaseKey(makeResult())).toBe('tc-1');
    expect(getHeatMapTestCaseKey(makeResult({ testCaseId: undefined }))).toBe('BLR');
    expect(getHeatMapTestCaseKey(makeResult({ testCaseId: undefined, testCaseName: undefined }))).toBe('result-1');
  });
});

describe('formatHeatMapTestCaseColId / getHeatMapTestCaseColId', () => {
  test('includes runIndex so sub-runs stay unique', () => {
    expect(formatHeatMapTestCaseColId('tc-1', 0)).toBe('tc_tc-1__0');
    expect(formatHeatMapTestCaseColId('tc-1', 2)).toBe('tc_tc-1__2');
    expect(getHeatMapTestCaseColId(makeResult({ runIndex: 1 }))).toBe('tc_tc-1__1');
  });
});

describe('hasHeatMapMultiSubRuns', () => {
  test('is false when every primary and compared row has runIndex 0', () => {
    expect(
      hasHeatMapMultiSubRuns([
        makeRow({
          _compared: makeResult({ id: 'c1', runIndex: 0 }),
        }),
      ]),
    ).toBe(false);
  });

  test('is true when any primary or compared row has runIndex > 0', () => {
    expect(hasHeatMapMultiSubRuns([makeRow({ runIndex: 1 })])).toBe(true);
    expect(
      hasHeatMapMultiSubRuns([
        makeRow({
          runIndex: 0,
          _compared: makeResult({ id: 'c1', runIndex: 2 }),
        }),
      ]),
    ).toBe(true);
  });
});

describe('formatHeatMapTestCaseHeader', () => {
  test('uses test case name without suffix when includeSubRunIndex is false', () => {
    expect(formatHeatMapTestCaseHeader(makeResult({ runIndex: 2 }), false)).toBe('BLR');
  });

  test('appends 1-based sub-run index when includeSubRunIndex is true', () => {
    expect(formatHeatMapTestCaseHeader(makeResult({ runIndex: 0 }), true)).toBe('BLR_1');
    expect(formatHeatMapTestCaseHeader(makeResult({ runIndex: 2 }), true)).toBe('BLR_3');
  });

  test('falls back to testCaseId then id when name is missing', () => {
    expect(formatHeatMapTestCaseHeader(makeResult({ testCaseName: undefined }), false)).toBe('tc-1');
    expect(formatHeatMapTestCaseHeader(makeResult({ testCaseName: undefined, testCaseId: undefined }), true)).toBe(
      'result-1_1',
    );
  });
});

describe('getHeatMapTestCaseHeaderLabels', () => {
  test('returns plain names for single-sub-run datasets', () => {
    expect(
      getHeatMapTestCaseHeaderLabels([
        makeRow({ testCaseName: 'Alpha' }),
        makeRow({ id: 'r2', testCaseId: 'tc-2', testCaseName: 'Beta' }),
      ]),
    ).toEqual(['Alpha', 'Beta']);
  });

  test('returns name_index labels when any sub-run index is greater than 0', () => {
    expect(
      getHeatMapTestCaseHeaderLabels([
        makeRow({ testCaseName: 'BLR', runIndex: 0 }),
        makeRow({ id: 'r2', testCaseName: 'BLR', runIndex: 1 }),
        makeRow({ id: 'r3', testCaseName: 'BLR', runIndex: 2 }),
      ]),
    ).toEqual(['BLR_1', 'BLR_2', 'BLR_3']);
  });
});
