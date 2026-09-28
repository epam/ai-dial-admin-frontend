import { ColDef } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { ResultDto } from '@/src/models/evaluation/run';
import { ExecutionIndexField, getUniformExecutionFields, hideUniformColumns } from '../column-variation';

const result = (overrides: Partial<ResultDto> = {}): ResultDto => ({
  responseStatusCode: 200,
  runIndex: 0,
  ...overrides,
});

describe('getUniformExecutionFields', () => {
  test('returns an empty set for an empty result list', () => {
    expect(getUniformExecutionFields([])).toEqual(new Set());
  });

  test('reports every index field as uniform for a single result', () => {
    const fields = getUniformExecutionFields([result({ runIndex: 2, turnIndex: 1, totalTurns: 4 })]);

    expect(fields).toEqual(new Set(Object.values(ExecutionIndexField)));
  });

  test('does not report a field whose value differs between results', () => {
    const fields = getUniformExecutionFields([result({ turnIndex: 0 }), result({ turnIndex: 1 })]);

    expect(fields.has(ExecutionIndexField.TurnIndex)).toBe(false);
  });

  test('reports a field carrying the same value on every result', () => {
    const fields = getUniformExecutionFields([result({ turnIndex: 3 }), result({ turnIndex: 3 })]);

    expect(fields.has(ExecutionIndexField.TurnIndex)).toBe(true);
  });

  test('reports a field absent from every result, treating undefined as one value', () => {
    const fields = getUniformExecutionFields([result(), result()]);

    expect(fields.has(ExecutionIndexField.TurnIndex)).toBe(true);
    expect(fields.has(ExecutionIndexField.RequestIndex)).toBe(true);
  });

  test('does not report a field present on one result and absent on another', () => {
    const fields = getUniformExecutionFields([result({ requestIndex: 0 }), result()]);

    expect(fields.has(ExecutionIndexField.RequestIndex)).toBe(false);
  });

  test('never reports the total columns, which the builders hide outright', () => {
    const fields = getUniformExecutionFields([result({ totalTurns: 4 }), result({ totalTurns: 4 })]);

    expect(fields.has('totalTurns')).toBe(false);
    expect(fields.has('totalRequests')).toBe(false);
  });

  test('judges each index field independently', () => {
    const fields = getUniformExecutionFields([
      result({ runIndex: 0, turnIndex: 0, totalTurns: 2 }),
      result({ runIndex: 1, turnIndex: 1, totalTurns: 2 }),
    ]);

    expect(fields).toEqual(new Set([ExecutionIndexField.RequestIndex]));
  });
});

describe('hideUniformColumns', () => {
  const columns: ColDef[] = [
    { colId: 'turnIndex', field: 'turnIndex' },
    { colId: 'http', field: 'responseStatusCode' },
  ];

  test('hides a column whose colId is uniform', () => {
    const [turn] = hideUniformColumns(columns, new Set([ExecutionIndexField.TurnIndex]));

    expect(turn.hide).toBe(true);
  });

  test('leaves a column that is not uniform untouched', () => {
    const [, http] = hideUniformColumns(columns, new Set([ExecutionIndexField.TurnIndex]));

    expect(http).toBe(columns[1]);
  });

  test('matches on field when a column carries no colId', () => {
    const [turn] = hideUniformColumns([{ field: 'turnIndex' }], new Set([ExecutionIndexField.TurnIndex]));

    expect(turn.hide).toBe(true);
  });

  test('never un-hides a column the builder already hid', () => {
    const hidden: ColDef[] = [{ colId: 'turnIndex', hide: true }];

    expect(hideUniformColumns(hidden, new Set())).toEqual([{ colId: 'turnIndex', hide: true }]);
  });

  test('returns the columns unchanged when nothing is uniform', () => {
    expect(hideUniformColumns(columns, new Set())).toEqual(columns);
  });
});
