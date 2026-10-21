import { ColDef, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { MISSING_VALUE_DISPLAY } from '@/src/components/Grid/CellRenderers/OptionalValueCellRenderer';
import { Run, RunStatus } from '@/src/models/evaluation/run';
import { SuiteType } from '@/src/models/evaluation/test-suite';
import { RUNS_COLUMN } from '../grid-columns';

const START = 1700000000000;
const COMPLETED = START + 125000;

const SETTLED_RUN: Run = {
  id: 'run-1',
  status: RunStatus.COMPLETED,
  startedAt: START,
  completedAt: COMPLETED,
  totalCost: 0.42,
  overallScoreValue: 0.875,
  metricNames: ['Answer Relevancy', 'Faithfulness'],
  suiteSnapshot: {
    suiteType: SuiteType.Deployment,
    deploymentRef: { id: 'dep-1', name: 'gpt-4o', type: 'dial-model' },
  },
};

const RUN_WITHOUT_COST: Run = { ...SETTLED_RUN, totalCost: undefined };
const RUN_WITHOUT_SCORE: Run = { ...SETTLED_RUN, overallScoreValue: undefined };
const RUNNING_RUN: Run = { ...SETTLED_RUN, status: RunStatus.RUNNING, completedAt: undefined };

const columnOf = (colId: string): ColDef => RUNS_COLUMN.find((col) => col.colId === colId) as ColDef;

const format = (column: ColDef, value: unknown): string =>
  (column.valueFormatter as (params: ValueFormatterParams) => string)({ value } as ValueFormatterParams);

const getValue = (colId: string, run: Run): unknown => {
  const column = columnOf(colId);
  return (column.valueGetter as (params: ValueGetterParams) => unknown)({ data: run } as ValueGetterParams);
};

/** What the cell shows for a row: the column's own value, put through its own formatter. */
const displayedValue = (colId: string, run: Run): string => format(columnOf(colId), getValue(colId, run));

describe('RUNS_COLUMN — Duration', () => {
  test('shows the elapsed time when the run has both a start and a completion', () => {
    expect(displayedValue('duration', SETTLED_RUN)).toBe('2m 5s');
  });

  test('shows the missing-value indication for a run that started but has not completed', () => {
    expect(displayedValue('duration', RUNNING_RUN)).toBe(MISSING_VALUE_DISPLAY);
  });
});

describe('RUNS_COLUMN — Cost', () => {
  test('shows a zero cost as a value, not as a missing one', () => {
    expect(format(columnOf('cost'), 0)).toBe('$0');
  });

  test('shows the missing-value indication for a run with no cost', () => {
    expect(displayedValue('cost', RUN_WITHOUT_COST)).toBe(MISSING_VALUE_DISPLAY);
  });

  test('shows the run’s own cost, not a fabricated one', () => {
    expect(getValue('cost', SETTLED_RUN)).toBe(0.42);
    expect(displayedValue('cost', SETTLED_RUN)).toBe('$0.42');
  });
});

describe('RUNS_COLUMN — Overall score', () => {
  test('shows a zero score as a value, not as a missing one', () => {
    expect(format(columnOf('overallScore'), 0)).toBe('0.000');
  });

  test('shows the missing-value indication for a run with no score', () => {
    expect(displayedValue('overallScore', RUN_WITHOUT_SCORE)).toBe(MISSING_VALUE_DISPLAY);
  });

  test('shows the run’s own overall score, not a fabricated one', () => {
    expect(getValue('overallScore', SETTLED_RUN)).toBe(0.875);
    expect(displayedValue('overallScore', SETTLED_RUN)).toBe('0.875');
  });
});

describe('RUNS_COLUMN — Target', () => {
  test('shows the deployment name and kind for a model deployment', () => {
    expect(getValue('target', SETTLED_RUN)).toBe('gpt-4o');
    const subtitle = columnOf('target').cellRendererParams.getSubtitle(SETTLED_RUN);
    expect(subtitle).toBe('Model');
  });

  test('shows the MCP deployment name and kind', () => {
    const mcpRun: Run = {
      ...SETTLED_RUN,
      suiteSnapshot: {
        suiteType: SuiteType.McpTool,
        mcpDeploymentRef: { id: 'mcp-1', name: 'calculator', type: 'dial-toolset' },
      },
    };
    expect(getValue('target', mcpRun)).toBe('calculator');
    expect(columnOf('target').cellRendererParams.getSubtitle(mcpRun)).toBe('MCP');
  });

  test('shows the missing-value indication for a run with no resolvable target', () => {
    const noTargetRun: Run = { ...SETTLED_RUN, suiteSnapshot: undefined };
    expect(getValue('target', noTargetRun)).toBe(MISSING_VALUE_DISPLAY);
  });
});

describe('RUNS_COLUMN — Metrics', () => {
  test('reads the run’s own metric names', () => {
    expect(getValue('metrics', SETTLED_RUN)).toEqual(['Answer Relevancy', 'Faithfulness']);
  });

  test('falls back to an empty list rather than throwing when AG Grid calls it with no row data', () => {
    // AG Grid runs every column's `valueGetter` once against `{ data: undefined }` while it processes
    // `columnDefs`, before any row data is set — this must not throw.
    const valueGetter = columnOf('metrics').valueGetter as (params: ValueGetterParams) => unknown;
    expect(valueGetter({ data: undefined } as ValueGetterParams)).toEqual([]);
  });

  test('falls back to an empty list for a run with no metric names', () => {
    expect(getValue('metrics', { ...SETTLED_RUN, metricNames: undefined })).toEqual([]);
  });
});

describe('RUNS_COLUMN — every valueGetter', () => {
  test('tolerates AG Grid calling it with no row data, without throwing', () => {
    // Same shape as the Metrics regression above, generalized: `columnDefs` processing calls every
    // column's `valueGetter` against `{ data: undefined }` before row data exists.
    RUNS_COLUMN.forEach((column) => {
      if (!column.valueGetter) {
        return;
      }
      const valueGetter = column.valueGetter as (params: ValueGetterParams) => unknown;
      expect(() => valueGetter({ data: undefined } as ValueGetterParams)).not.toThrow();
    });
  });
});
