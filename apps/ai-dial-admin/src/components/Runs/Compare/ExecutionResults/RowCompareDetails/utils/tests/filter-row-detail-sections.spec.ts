import { describe, expect, test } from 'vitest';

import { CompareRowDetailSection } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/models';
import { filterRowDetailSections } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/filter-row-detail-sections';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';

const sections: CompareRowDetailSection[] = [
  {
    key: 'execution',
    label: 'Execution',
    rows: [
      {
        fieldKey: 'executionStatus',
        label: 'executionStatus',
        primaryRaw: 'SUCCESS',
        secondaryRaw: 'FAILED',
        diffKind: MetricDeltaKind.Changed,
        isNumeric: false,
        isScoreIndicator: false,
        isMetric: false,
      },
      {
        fieldKey: 'execDurationMs',
        label: 'execDurationMs',
        primaryRaw: '100',
        secondaryRaw: '100',
        diffKind: MetricDeltaKind.Empty,
        isNumeric: true,
        isScoreIndicator: false,
        isMetric: false,
      },
    ],
  },
  {
    key: 'testCaseData',
    label: 'Test Case Data',
    rows: [
      {
        fieldKey: 'prompt',
        label: 'prompt',
        primaryRaw: 'hello',
        secondaryRaw: 'hello world',
        diffKind: MetricDeltaKind.Changed,
        isNumeric: false,
        isScoreIndicator: false,
        isMetric: false,
      },
    ],
  },
];

describe('filterRowDetailSections', () => {
  test('returns all sections when no filters are applied', () => {
    const result = filterRowDetailSections(sections, { searchQuery: '', showDiffsOnly: false });

    expect(result).toHaveLength(2);
    expect(result[0].rows).toHaveLength(2);
    expect(result[1].rows).toHaveLength(1);
  });

  test('filters rows by search query on field label', () => {
    const result = filterRowDetailSections(sections, { searchQuery: 'prompt', showDiffsOnly: false });

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('testCaseData');
    expect(result[0].rows).toHaveLength(1);
    expect(result[0].rows[0].label).toBe('prompt');
  });

  test('showDiffsOnly excludes rows without diffs', () => {
    const result = filterRowDetailSections(sections, { searchQuery: '', showDiffsOnly: true });

    expect(result).toHaveLength(2);
    expect(result[0].rows).toHaveLength(1);
    expect(result[0].rows[0].fieldKey).toBe('executionStatus');
    expect(result[1].rows).toHaveLength(1);
    expect(result[1].rows[0].fieldKey).toBe('prompt');
  });

  test('combines search and showDiffsOnly filters', () => {
    const result = filterRowDetailSections(sections, { searchQuery: 'exec', showDiffsOnly: true });

    expect(result).toHaveLength(1);
    expect(result[0].rows).toHaveLength(1);
    expect(result[0].rows[0].fieldKey).toBe('executionStatus');
  });

  test('removes sections with no matching rows', () => {
    const result = filterRowDetailSections(sections, { searchQuery: 'missing-field', showDiffsOnly: false });

    expect(result).toHaveLength(0);
  });
});
