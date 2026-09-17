import { ColDef, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { MISSING_VALUE_DISPLAY } from '@/src/components/Grid/CellRenderers/OptionalValueCellRenderer';
import {
  RUN_WITH_ALL_MOCK_VALUES,
  RUN_WITHOUT_MOCK_COST,
  RUN_WITHOUT_MOCK_SCORE,
  RUNNING_RUN,
} from '@/src/components/Runs/mocks/run-list-mock-fixtures';
import { Run } from '@/src/models/evaluation/run';
import { RUNS_COLUMN } from '../grid-columns';

const columnOf = (colId: string): ColDef => RUNS_COLUMN.find((col) => col.colId === colId) as ColDef;

const format = (column: ColDef, value: unknown): string =>
  (column.valueFormatter as (params: ValueFormatterParams) => string)({ value } as ValueFormatterParams);

/** What the cell shows for a row: the column's own value, put through its own formatter. */
const displayedValue = (colId: string, run: Run): string => {
  const column = columnOf(colId);
  const value = (column.valueGetter as (params: ValueGetterParams) => unknown)({ data: run } as ValueGetterParams);
  return format(column, value);
};

describe('RUNS_COLUMN — Duration', () => {
  test('shows the elapsed time when the run has both a start and a completion', () => {
    expect(displayedValue('duration', RUN_WITH_ALL_MOCK_VALUES)).toBe('2m 5s');
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
    expect(displayedValue('cost', RUN_WITHOUT_MOCK_COST)).toBe(MISSING_VALUE_DISPLAY);
  });

  test('shows the cost of a run that has one', () => {
    expect(displayedValue('cost', RUN_WITH_ALL_MOCK_VALUES)).toContain('$');
  });
});

describe('RUNS_COLUMN — Overall score', () => {
  test('shows a zero score as a value, not as a missing one', () => {
    expect(format(columnOf('overallScore'), 0)).toBe('0.000');
  });

  test('shows the missing-value indication for a run with no score', () => {
    expect(displayedValue('overallScore', RUN_WITHOUT_MOCK_SCORE)).toBe(MISSING_VALUE_DISPLAY);
  });

  test('shows the score of a run that has one', () => {
    expect(displayedValue('overallScore', RUN_WITH_ALL_MOCK_VALUES)).toMatch(/^\d\.\d{3}$/);
  });
});
