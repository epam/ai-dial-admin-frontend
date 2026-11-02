import { ITooltipParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { HeatMapGridRow } from '@/src/components/Common/HeatMap/models';
import { buildStabilityColumns } from '@/src/components/TestSuites/Trends/Stability/utils/build-stability-columns';
import {
  getStabilityTestCaseColId,
  pivotStabilitySummaries,
} from '@/src/components/TestSuites/Trends/Stability/utils/pivot-stability';
import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';

const runOrder: TrendsRunPoint[] = [
  {
    runId: 'run-1',
    runName: 'Run#1',
    computedAtMs: 1,
    overallScore: 0.5,
    overallScoreThreshold: 0.6,
    durationMs: 10,
    isFailed: false,
  },
  {
    runId: 'run-2',
    runName: 'Run#2',
    computedAtMs: 2,
    overallScore: 0.6,
    overallScoreThreshold: null,
    durationMs: 20,
    isFailed: false,
  },
];

describe('pivotStabilitySummaries', () => {
  test('builds run rows × test-case columns with scores', () => {
    const matrix = pivotStabilitySummaries(
      [
        { test_suite_run_id: 'run-1', test_case_name: 'case-b', score: 0.4, passed: false },
        { test_suite_run_id: 'run-1', test_case_name: 'case-a', score: 0.9, passed: true },
        { test_suite_run_id: 'run-2', test_case_name: 'case-a', score: 0.8, passed: true },
      ],
      runOrder,
    );

    expect(matrix.headerLabels).toEqual(['case-a', 'case-b']);
    expect(matrix.rows.map((row) => row.label)).toEqual(['Run#2', 'Run#1']);
    expect(matrix.rows[0].values[getStabilityTestCaseColId('case-a')]).toBe(0.8);
    expect(matrix.rows[1].values[getStabilityTestCaseColId('case-a')]).toBe(0.9);
    expect(matrix.rows[1].values[getStabilityTestCaseColId('case-b')]).toBe(0.4);
    expect(matrix.cellMeta[matrix.rows[1].id][getStabilityTestCaseColId('case-a')].passed).toBe(true);
    expect(matrix.thresholdByRowId).toEqual({ 'run_run-2': null, 'run_run-1': 0.6 });
  });

  test('shows each run threshold before Passed in the cell tooltip', () => {
    const runsWithMixedThresholds: TrendsRunPoint[] = [
      ...runOrder,
      {
        runId: 'run-3',
        runName: 'Run#3',
        computedAtMs: 3,
        overallScore: 0.7,
        overallScoreThreshold: 0.8,
        durationMs: 30,
        isFailed: false,
      },
    ];
    const matrix = pivotStabilitySummaries(
      [
        { test_suite_run_id: 'run-1', test_case_name: 'case-a', score: 0.9, passed: true },
        { test_suite_run_id: 'run-2', test_case_name: 'case-a', score: 0.8, passed: false },
        { test_suite_run_id: 'run-3', test_case_name: 'case-a', score: 0.7, passed: false },
      ],
      runsWithMixedThresholds,
    );
    const [column] = buildStabilityColumns({
      testCaseColIds: matrix.testCaseColIds,
      headerLabels: matrix.headerLabels,
      cellMeta: matrix.cellMeta,
      thresholdByRowId: matrix.thresholdByRowId,
      labels: {
        testCase: 'Test case:',
        run: 'Run:',
        threshold: 'Threshold:',
        score: 'Score:',
        passed: 'Passed:',
        notApplicable: 'N/A',
        passedYes: 'Yes',
        passedNo: 'No',
      },
    }).slice(1);
    const tooltipValueGetter = column.tooltipValueGetter;

    expect(
      tooltipValueGetter?.({ data: matrix.rows[2], location: 'cell' } as ITooltipParams<HeatMapGridRow>),
    ).toMatchObject({
      rows: [
        { label: 'Test case:', value: 'case-a' },
        { label: 'Run:', value: 'Run#1' },
        { label: 'Threshold:', value: '0.6' },
        { label: 'Passed:', value: 'Yes' },
      ],
    });
    expect(
      tooltipValueGetter?.({ data: matrix.rows[0], location: 'cell' } as ITooltipParams<HeatMapGridRow>),
    ).toMatchObject({
      rows: [
        { label: 'Test case:', value: 'case-a' },
        { label: 'Run:', value: 'Run#3' },
        { label: 'Threshold:', value: '0.8' },
        { label: 'Passed:', value: 'No' },
      ],
    });
    expect(
      tooltipValueGetter?.({ data: matrix.rows[1], location: 'cell' } as ITooltipParams<HeatMapGridRow>),
    ).toMatchObject({
      rows: [
        { label: 'Test case:', value: 'case-a' },
        { label: 'Run:', value: 'Run#2' },
        { label: 'Threshold:', value: 'N/A' },
        { label: 'Passed:', value: 'No' },
      ],
    });
  });

  test('marks missing test case × run pairs as undefined gaps', () => {
    const matrix = pivotStabilitySummaries(
      [{ test_suite_run_id: 'run-1', test_case_name: 'case-a', score: 0.5, passed: true }],
      runOrder,
    );

    // Newest run first: run-2 (gap), then run-1 (score).
    expect(matrix.rows[0].values[getStabilityTestCaseColId('case-a')]).toBeUndefined();
    expect(matrix.cellMeta[matrix.rows[0].id][getStabilityTestCaseColId('case-a')]).toBeUndefined();
    expect(matrix.rows[1].values[getStabilityTestCaseColId('case-a')]).toBe(0.5);
  });

  test('last row wins for duplicate test case and run pairs', () => {
    const matrix = pivotStabilitySummaries(
      [
        { test_suite_run_id: 'run-1', test_case_name: 'case-a', score: 0.1, passed: false },
        { test_suite_run_id: 'run-1', test_case_name: 'case-a', score: 0.99, passed: true },
      ],
      runOrder,
    );

    const run1Row = matrix.rows.find((row) => row.label === 'Run#1');
    expect(run1Row?.values[getStabilityTestCaseColId('case-a')]).toBe(0.99);
    expect(matrix.cellMeta[run1Row!.id][getStabilityTestCaseColId('case-a')].passed).toBe(true);
  });

  test('orders rows newest run first', () => {
    const matrix = pivotStabilitySummaries([], runOrder);

    expect(matrix.rows.map((row) => row.label)).toEqual(['Run#2', 'Run#1']);
  });
});
