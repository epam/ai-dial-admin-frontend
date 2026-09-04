import { describe, expect, test } from 'vitest';

import { RowDetailField, RowDetailSection } from '@/src/components/Runs/Details/RowDetails/models';
import { flattenPivotFields } from '@/src/components/Runs/Details/RowDetails/utils/flatten-pivot-fields';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';

const field = (fieldKey: string, overrides: Partial<RowDetailField> = {}): RowDetailField => ({
  fieldKey,
  label: fieldKey,
  primaryRaw: 'a',
  secondaryRaw: 'b',
  diffKind: MetricDeltaKind.Changed,
  isNumeric: false,
  isScoreIndicator: false,
  isMetric: false,
  ...overrides,
});

const sections: RowDetailSection[] = [
  {
    key: 'execution',
    label: 'Execution',
    rows: [field('status'), field('http')],
  },
  {
    key: 'accuracy',
    label: 'Accuracy',
    rows: [field('equality', { isNumeric: true, isMetric: true, isScoreIndicator: true })],
  },
];

describe('flattenPivotFields', () => {
  test('flattens sections into ordered columns', () => {
    const columns = flattenPivotFields(sections);

    expect(columns.map((column) => column.field.fieldKey)).toEqual(['status', 'http', 'equality']);
    expect(columns.map((column) => column.sectionKey)).toEqual(['execution', 'execution', 'accuracy']);
  });

  test('marks the first field of each section group as a section start', () => {
    const columns = flattenPivotFields(sections);

    expect(columns.map((column) => column.isSectionStart)).toEqual([true, false, true]);
  });

  test('flags delta only for numeric metric fields', () => {
    const columns = flattenPivotFields(sections);

    expect(columns.map((column) => column.hasDelta)).toEqual([false, false, true]);
  });

  test('returns an empty list for empty sections', () => {
    expect(flattenPivotFields([])).toEqual([]);
  });
});
