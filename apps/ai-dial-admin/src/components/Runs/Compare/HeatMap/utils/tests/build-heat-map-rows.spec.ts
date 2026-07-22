import { describe, expect, test } from 'vitest';

import { HeatMapColorDisplayMode, HeatMapRowType } from '@/src/components/Runs/Compare/HeatMap/models';
import {
  buildHeatMapDeltaRows,
  buildHeatMapRows,
  buildHeatMapRowsForMode,
  filterHeatMapRowsByExpandedGroups,
  getHeatMapGroupKeys,
} from '@/src/components/Runs/Compare/HeatMap/utils/build-heat-map-rows';
import { formatHeatMapTestCaseColId } from '@/src/components/Runs/Compare/HeatMap/utils/heat-map-test-case-columns';
import { RUN_COMPARE_PRIMARY_INDEX, RUN_COMPARE_SECONDARY_INDEX } from '@/src/components/Runs/Compare/constants';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { AnalyticsResult } from '@/src/models/evaluation/run';

const makeResult = (overrides: Partial<AnalyticsResult> = {}): AnalyticsResult => ({
  id: 'result-1',
  testCaseId: 'tc-1',
  testCaseName: 'Test Case 1',
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

describe('buildHeatMapRows', () => {
  test('creates group row and both run rows per metric', () => {
    const rows = buildHeatMapRows([
      makeRow({
        testCaseId: 'tc-1',
        metricValues: { Accuracy: { precision: 0.5 } },
        _compared: makeResult({
          id: 'result-2',
          metricValues: { Accuracy: { precision: 0.8 } },
        }),
      }),
    ]);

    expect(rows.filter((row) => row.rowType === HeatMapRowType.Group).map((row) => row.groupKey)).toEqual(['Accuracy']);
    const metricRows = rows.filter((row) => row.rowType === HeatMapRowType.Metric);
    expect(metricRows).toHaveLength(2);
    expect(metricRows.map((row) => row.runIndex)).toEqual([RUN_COMPARE_PRIMARY_INDEX, RUN_COMPARE_SECONDARY_INDEX]);
    expect(metricRows.every((row) => row.metricKey === 'precision')).toBe(true);
  });

  test('maps cell values per test case column for each run', () => {
    const rows = buildHeatMapRows([
      makeRow({
        id: 'r1',
        testCaseId: 'tc-1',
        metricValues: { Accuracy: { precision: 0.5 } },
        _compared: makeResult({ id: 'r2', metricValues: { Accuracy: { precision: 0.8 } } }),
      }),
      makeRow({
        id: 'r3',
        testCaseId: 'tc-2',
        testCaseName: 'Test Case 2',
        metricValues: { Accuracy: { precision: 0.2 } },
        _compared: makeResult({ id: 'r4', metricValues: { Accuracy: { precision: null as unknown as number } } }),
      }),
    ]);

    const primaryRow = rows.find(
      (row) => row.rowType === HeatMapRowType.Metric && row.runIndex === RUN_COMPARE_PRIMARY_INDEX,
    );
    const comparedRow = rows.find(
      (row) => row.rowType === HeatMapRowType.Metric && row.runIndex === RUN_COMPARE_SECONDARY_INDEX,
    );

    expect(primaryRow?.values[formatHeatMapTestCaseColId('tc-1', 0)]).toBe(0.5);
    expect(primaryRow?.values[formatHeatMapTestCaseColId('tc-2', 0)]).toBe(0.2);
    expect(comparedRow?.values[formatHeatMapTestCaseColId('tc-1', 0)]).toBe(0.8);
    expect(comparedRow?.values[formatHeatMapTestCaseColId('tc-2', 0)]).toBeNull();
  });

  test('maps distinct columns for multiple sub-runs of the same test case', () => {
    const rows = buildHeatMapRows([
      makeRow({
        id: 'r1',
        testCaseId: 'tc-blr',
        testCaseName: 'BLR',
        runIndex: 0,
        metricValues: { Accuracy: { precision: 0.1 } },
        _compared: makeResult({ id: 'c1', runIndex: 0, metricValues: { Accuracy: { precision: 0.2 } } }),
      }),
      makeRow({
        id: 'r2',
        testCaseId: 'tc-blr',
        testCaseName: 'BLR',
        runIndex: 1,
        metricValues: { Accuracy: { precision: 0.3 } },
        _compared: makeResult({ id: 'c2', runIndex: 1, metricValues: { Accuracy: { precision: 0.4 } } }),
      }),
    ]);

    const primaryRow = rows.find(
      (row) => row.rowType === HeatMapRowType.Metric && row.runIndex === RUN_COMPARE_PRIMARY_INDEX,
    );

    expect(primaryRow?.values[formatHeatMapTestCaseColId('tc-blr', 0)]).toBe(0.1);
    expect(primaryRow?.values[formatHeatMapTestCaseColId('tc-blr', 1)]).toBe(0.3);
  });

  test('group rows have no cell values', () => {
    const rows = buildHeatMapRows([
      makeRow({
        metricValues: { Accuracy: { precision: 0.5 } },
        _compared: makeResult({ metricValues: { Accuracy: { precision: 0.8 } } }),
      }),
    ]);

    const groupRow = rows.find((row) => row.rowType === HeatMapRowType.Group);
    expect(groupRow?.values).toEqual({});
  });
});

describe('buildHeatMapDeltaRows', () => {
  test('creates one metric row per metric without run index', () => {
    const rows = buildHeatMapDeltaRows([
      makeRow({
        testCaseId: 'tc-1',
        metricValues: { Accuracy: { precision: 0.5 } },
        _compared: makeResult({
          id: 'result-2',
          metricValues: { Accuracy: { precision: 0.8 } },
        }),
      }),
    ]);

    const metricRows = rows.filter((row) => row.rowType === HeatMapRowType.Metric);
    expect(metricRows).toHaveLength(1);
    expect(metricRows[0].runIndex).toBeUndefined();
    expect(metricRows[0].metricKey).toBe('precision');
  });

  test('maps signed delta values per test case column', () => {
    const rows = buildHeatMapDeltaRows([
      makeRow({
        testCaseId: 'tc-1',
        metricValues: { Accuracy: { precision: 0.5 } },
        _compared: makeResult({ metricValues: { Accuracy: { precision: 0.8 } } }),
      }),
      makeRow({
        id: 'r3',
        testCaseId: 'tc-2',
        metricValues: { Accuracy: { precision: 0.5 } },
        _compared: makeResult({ id: 'r4', metricValues: { Accuracy: { precision: 0.5 } } }),
      }),
      makeRow({
        id: 'r5',
        testCaseId: 'tc-3',
        metricValues: { Accuracy: { precision: 0.8 } },
        _compared: makeResult({ id: 'r6', metricValues: { Accuracy: {} } }),
      }),
      makeRow({
        id: 'r7',
        testCaseId: 'tc-4',
        metricValues: { Accuracy: {} },
        _compared: makeResult({ id: 'r8', metricValues: { Accuracy: { precision: 0.3 } } }),
      }),
    ]);

    const deltaRow = rows.find((row) => row.rowType === HeatMapRowType.Metric);
    expect(deltaRow?.values[formatHeatMapTestCaseColId('tc-1', 0)]).toBe(0.3);
    expect(deltaRow?.values[formatHeatMapTestCaseColId('tc-2', 0)]).toBe(0);
    expect(deltaRow?.values[formatHeatMapTestCaseColId('tc-3', 0)]).toBeUndefined();
    expect(deltaRow?.values[formatHeatMapTestCaseColId('tc-4', 0)]).toBeUndefined();
  });

  test('omits delta when either run is missing a numeric value', () => {
    const rows = buildHeatMapDeltaRows([
      makeRow({
        testCaseId: 'tc-1',
        metricValues: { Accuracy: { precision: 0.8 } },
        _compared: makeResult({ id: 'r2', metricValues: {} }),
      }),
      makeRow({
        id: 'r3',
        testCaseId: 'tc-2',
        metricValues: {},
        _compared: makeResult({ id: 'r4', metricValues: { Accuracy: { precision: 0.3 } } }),
      }),
    ]);

    const deltaRow = rows.find((row) => row.rowType === HeatMapRowType.Metric);
    expect(deltaRow?.values[formatHeatMapTestCaseColId('tc-1', 0)]).toBeUndefined();
    expect(deltaRow?.values[formatHeatMapTestCaseColId('tc-2', 0)]).toBeUndefined();
  });
});

describe('buildHeatMapRowsForMode', () => {
  test('returns absolute rows by default and delta rows in delta mode', () => {
    const mergedRows = [
      makeRow({
        metricValues: { Accuracy: { precision: 0.5 } },
        _compared: makeResult({ metricValues: { Accuracy: { precision: 0.8 } } }),
      }),
    ];

    expect(buildHeatMapRowsForMode(mergedRows, HeatMapColorDisplayMode.Absolute)).toEqual(buildHeatMapRows(mergedRows));
    expect(buildHeatMapRowsForMode(mergedRows, HeatMapColorDisplayMode.Delta)).toEqual(
      buildHeatMapDeltaRows(mergedRows),
    );
  });
});

describe('filterHeatMapRowsByExpandedGroups', () => {
  test('hides metric rows when their group is collapsed', () => {
    const rows = buildHeatMapRows([
      makeRow({
        metricValues: { Accuracy: { precision: 0.5 } },
        _compared: makeResult({ metricValues: { Accuracy: { precision: 0.8 } } }),
      }),
    ]);

    const filtered = filterHeatMapRowsByExpandedGroups(rows, new Set());

    expect(filtered.every((row) => row.rowType === HeatMapRowType.Group)).toBe(true);
  });
});

describe('getHeatMapGroupKeys', () => {
  test('returns group keys from heat map rows', () => {
    const rows = buildHeatMapRows([
      makeRow({
        metricValues: { Accuracy: { precision: 0.5 }, Quality: { score: 0.9 } },
        _compared: makeResult({
          metricValues: { Accuracy: { precision: 0.8 }, Quality: { score: 0.7 } },
        }),
      }),
    ]);

    expect(getHeatMapGroupKeys(rows)).toEqual(['Accuracy', 'Quality']);
  });
});
