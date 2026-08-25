import { describe, expect, test } from 'vitest';

import {
  createBindingRow,
  getBindingRowError,
  getTakenElsewhere,
  hasBlockingBindingError,
  toOutputBindings,
} from '@/src/components/Analytics/EnrichmentRules/output-bindings';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { EvaluatorVar } from '@/src/models/analytics/evaluator';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';

const columns: AnalyticsTableColumn[] = [
  { source_name: 'title', name: 'title', type: AnalyticsFieldType.String },
  { source_name: 'sentiment_score', name: 'sentiment_score', type: AnalyticsFieldType.Decimal },
];

const vars: EvaluatorVar[] = [
  { name: 'title', type: 'string' },
  { name: 'sentiment_score', type: 'double' },
];

const row = (column: string, varName: string) => ({ id: 'row-1', column, var: varName });

describe('EnrichmentRules :: getBindingRowError', () => {
  test('reports no error for a resolvable, type-compatible pair', () => {
    expect(getBindingRowError(row('title', 'title'), columns, vars)).toEqual({
      isColumnUnavailable: false,
      isVarUnavailable: false,
      isTypeMismatch: false,
    });
  });

  test('does not flag decimal bound to double', () => {
    expect(getBindingRowError(row('sentiment_score', 'sentiment_score'), columns, vars).isTypeMismatch).toBe(false);
  });

  test('flags a column that the target table no longer has', () => {
    expect(getBindingRowError(row('gone', 'title'), columns, vars).isColumnUnavailable).toBe(true);
  });

  test('flags a variable that the evaluator version no longer has', () => {
    expect(getBindingRowError(row('title', 'gone'), columns, vars).isVarUnavailable).toBe(true);
  });

  test('flags a genuine type disagreement', () => {
    expect(getBindingRowError(row('title', 'sentiment_score'), columns, vars).isTypeMismatch).toBe(true);
  });

  test('reports nothing for an empty row', () => {
    expect(getBindingRowError(row('', ''), columns, vars)).toEqual({
      isColumnUnavailable: false,
      isVarUnavailable: false,
      isTypeMismatch: false,
    });
  });
});

describe('EnrichmentRules :: hasBlockingBindingError', () => {
  test('a stranded value blocks', () => {
    expect(hasBlockingBindingError({ isColumnUnavailable: true, isVarUnavailable: false, isTypeMismatch: false })).toBe(
      true,
    );
  });

  test('a type mismatch alone does not block', () => {
    expect(hasBlockingBindingError({ isColumnUnavailable: false, isVarUnavailable: false, isTypeMismatch: true })).toBe(
      false,
    );
  });
});

describe('EnrichmentRules :: getTakenElsewhere', () => {
  const rows = [
    { id: 'a', column: 'title', var: 'title' },
    { id: 'b', column: 'sentiment_score', var: 'sentiment_score' },
    { id: 'c', column: '', var: '' },
  ];

  test('collects the columns chosen in sibling rows only', () => {
    expect(getTakenElsewhere(rows, 'a', 'column')).toEqual(new Set(['sentiment_score']));
  });

  test('collects the variables chosen in sibling rows only', () => {
    expect(getTakenElsewhere(rows, 'b', 'var')).toEqual(new Set(['title']));
  });

  test('ignores blank values', () => {
    expect(getTakenElsewhere(rows, 'a', 'column').has('')).toBe(false);
  });
});

describe('EnrichmentRules :: toOutputBindings', () => {
  test('emits only complete rows, without their ids', () => {
    expect(
      toOutputBindings([
        { id: 'a', column: 'title', var: 'title' },
        { id: 'b', column: 'sentiment_score', var: '' },
        { id: 'c', column: '', var: 'topic' },
      ]),
    ).toEqual([{ column: 'title', var: 'title' }]);
  });

  test('a fresh row contributes nothing', () => {
    expect(toOutputBindings([createBindingRow()])).toEqual([]);
  });

  test('createBindingRow issues distinct ids', () => {
    expect(createBindingRow().id).not.toBe(createBindingRow().id);
  });
});
