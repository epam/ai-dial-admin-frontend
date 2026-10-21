import { describe, expect, test } from 'vitest';

import { toOutputRows, toOutputs } from '@/src/components/Analytics/Pipelines/Enrich/outputs';
import { TransformType } from '@/src/models/analytics/pipeline';
import { OutputRefinementKind, OutputRow } from '@/src/models/analytics/pipeline-ui';

const row = (overrides: Partial<OutputRow>): OutputRow => ({
  id: '1',
  name: '',
  text: '',
  refinement: OutputRefinementKind.Jsonata,
  values: [],
  jsonata: '',
  ...overrides,
});

describe('Analytics :: pipelines :: toOutputRows', () => {
  test('seeds a sql row from the expression', () => {
    const [row] = toOutputRows([{ name: 'total', sql: 'count(*)' }], TransformType.Sql);

    expect(row.name).toBe('total');
    expect(row.text).toBe('count(*)');
  });

  test('seeds an llm row from the prose and its refinement', () => {
    const [row] = toOutputRows([{ name: 'risk', prose: 'Severity.', values: ['low', 'high'] }], TransformType.Llm);

    expect(row.text).toBe('Severity.');
    expect(row.values).toEqual(['low', 'high']);
    expect(row.refinement).toBe(OutputRefinementKind.Values);
  });

  test('seeds the transform, empty, from an output that declares neither refinement', () => {
    const [row] = toOutputRows([{ name: 'risk', prose: 'Severity.' }], TransformType.Llm);

    expect(row.refinement).toBe(OutputRefinementKind.Jsonata);
    expect(row.jsonata).toBe('');
  });
});

describe('Analytics :: pipelines :: toOutputRows — the wire shape', () => {
  // Leaving the JSON editor hands the draft back as the service serves it, keyed by target column.
  test('seeds rows from the map a JSON-edited document carries', () => {
    const rows = toOutputRows(
      { title: 'Title of the session.' } as unknown as Parameters<typeof toOutputRows>[0],
      TransformType.Llm,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('title');
    expect(rows[0].text).toBe('Title of the session.');
  });
});

describe('Analytics :: pipelines :: toOutputs', () => {
  test('writes the row text into the member the type uses', () => {
    const rows = [row({ name: 'total', text: 'count(*)' })];

    expect(toOutputs(rows, TransformType.Sql)).toEqual([{ name: 'total', sql: 'count(*)' }]);
    expect(toOutputs(rows, TransformType.Llm)).toEqual([{ name: 'total', prose: 'count(*)' }]);
  });

  test('carries the refinement the row selects', () => {
    const rows = [row({ name: 'risk', text: 'Severity.', refinement: OutputRefinementKind.Values, values: ['low'] })];

    expect(toOutputs(rows, TransformType.Llm)).toEqual([{ name: 'risk', prose: 'Severity.', values: ['low'] }]);
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

    expect(toOutputs(rows, TransformType.Llm)).toEqual([{ name: 'risk', prose: 'Severity.', jsonata: 'level' }]);
    expect(rows[0].values).toEqual(['low']);
  });
});
