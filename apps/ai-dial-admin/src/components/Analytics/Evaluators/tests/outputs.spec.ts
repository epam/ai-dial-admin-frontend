import { describe, expect, test } from 'vitest';

import { toOutputRows, toOutputs } from '@/src/components/Analytics/Evaluators/outputs';
import { EvaluatorType } from '@/src/models/analytics/evaluator';
import { OutputRefinementKind, OutputRow } from '@/src/models/analytics/evaluator-ui';

const row = (overrides: Partial<OutputRow>): OutputRow => ({
  id: '1',
  name: '',
  text: '',
  refinement: OutputRefinementKind.Jsonata,
  values: [],
  jsonata: '',
  ...overrides,
});

describe('Analytics :: evaluators :: toOutputRows', () => {
  test('seeds a sql row from the expression', () => {
    const [row] = toOutputRows([{ name: 'total', sql: 'count(*)' }], EvaluatorType.Sql);

    expect(row.name).toBe('total');
    expect(row.text).toBe('count(*)');
  });

  test('seeds an llm row from the prose and its refinement', () => {
    const [row] = toOutputRows([{ name: 'risk', prose: 'Severity.', values: ['low', 'high'] }], EvaluatorType.Llm);

    expect(row.text).toBe('Severity.');
    expect(row.values).toEqual(['low', 'high']);
    expect(row.refinement).toBe(OutputRefinementKind.Values);
  });

  test('seeds the transform, empty, from an output that declares neither refinement', () => {
    const [row] = toOutputRows([{ name: 'risk', prose: 'Severity.' }], EvaluatorType.Llm);

    expect(row.refinement).toBe(OutputRefinementKind.Jsonata);
    expect(row.jsonata).toBe('');
  });
});

describe('Analytics :: evaluators :: toOutputs', () => {
  test('writes the row text into the member the type uses', () => {
    const rows = [row({ name: 'total', text: 'count(*)' })];

    expect(toOutputs(rows, EvaluatorType.Sql)).toEqual([{ name: 'total', sql: 'count(*)' }]);
    expect(toOutputs(rows, EvaluatorType.Llm)).toEqual([{ name: 'total', prose: 'count(*)' }]);
  });

  test('carries the refinement the row selects', () => {
    const rows = [row({ name: 'risk', text: 'Severity.', refinement: OutputRefinementKind.Values, values: ['low'] })];

    expect(toOutputs(rows, EvaluatorType.Llm)).toEqual([{ name: 'risk', prose: 'Severity.', values: ['low'] }]);
  });

  test('leaves out what the unselected refinement holds, rather than erasing it', () => {
    const rows = [
      row({
        name: 'risk',
        text: 'Severity.',
        refinement: OutputRefinementKind.Jsonata,
        values: ['low'],
        jsonata: 'level',
      }),
    ];

    expect(toOutputs(rows, EvaluatorType.Llm)).toEqual([{ name: 'risk', prose: 'Severity.', jsonata: 'level' }]);
    expect(rows[0].values).toEqual(['low']);
  });
});
