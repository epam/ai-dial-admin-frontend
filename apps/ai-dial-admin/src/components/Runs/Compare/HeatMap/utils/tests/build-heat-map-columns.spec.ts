import { describe, expect, test, vi } from 'vitest';

import { HeatMapColorDisplayMode } from '@/src/components/Runs/Compare/HeatMap/models';
import { buildHeatMapColumns } from '@/src/components/Runs/Compare/HeatMap/utils/build-heat-map-columns';
import { getHeatMapTestCaseColId } from '@/src/components/Runs/Compare/HeatMap/utils/heat-map-test-case-columns';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { AnalyticsResult } from '@/src/models/evaluation/run';

vi.mock('@/src/components/Runs/Compare/HeatMap/HeatMapTestCaseHeader', () => ({
  default: () => null,
}));
vi.mock('@/src/components/Runs/Compare/HeatMap/HeatMapLabelCellRenderer', () => ({
  default: () => null,
}));
vi.mock('@/src/components/Runs/Compare/HeatMap/HeatMapValueCellRenderer', () => ({
  default: () => null,
}));
vi.mock('@/src/components/Runs/Compare/HeatMap/HeatMapCellTooltip', () => ({
  default: () => null,
}));

const makeResult = (overrides: Partial<AnalyticsResult> = {}): AnalyticsResult => ({
  id: 'result-1',
  testCaseId: 'tc-blr',
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

const buildOptions = {
  colorDisplayMode: HeatMapColorDisplayMode.Absolute,
  expandedGroups: new Set<string>(),
  onToggleGroup: vi.fn(),
  primaryRunName: 'Run #1',
  comparedRunName: 'Run #2',
};

describe('buildHeatMapColumns', () => {
  test('uses test case names as headers for single-sub-run datasets', () => {
    const columns = buildHeatMapColumns(
      [makeRow({ testCaseName: 'Alpha' }), makeRow({ id: 'r2', testCaseId: 'tc-2', testCaseName: 'Beta' })],
      buildOptions,
    );

    const testCaseColumns = columns.slice(1);
    expect(testCaseColumns.map((col) => col.headerName)).toEqual(['Alpha', 'Beta']);
    expect(testCaseColumns.map((col) => col.headerComponentParams)).toEqual([{ label: 'Alpha' }, { label: 'Beta' }]);
  });

  test('uses distinct colIds and name_index headers for multiple sub-runs of the same test case', () => {
    const rows = [
      makeRow({ testCaseName: 'BLR', runIndex: 0 }),
      makeRow({ id: 'r2', testCaseName: 'BLR', runIndex: 1 }),
      makeRow({ id: 'r3', testCaseName: 'BLR', runIndex: 2 }),
    ];

    const columns = buildHeatMapColumns(rows, buildOptions);
    const testCaseColumns = columns.slice(1);

    expect(testCaseColumns.map((col) => col.headerName)).toEqual(['BLR_1', 'BLR_2', 'BLR_3']);
    expect(testCaseColumns.map((col) => col.colId)).toEqual([
      getHeatMapTestCaseColId(rows[0]),
      getHeatMapTestCaseColId(rows[1]),
      getHeatMapTestCaseColId(rows[2]),
    ]);
    expect(new Set(testCaseColumns.map((col) => col.colId)).size).toBe(3);
  });
});
