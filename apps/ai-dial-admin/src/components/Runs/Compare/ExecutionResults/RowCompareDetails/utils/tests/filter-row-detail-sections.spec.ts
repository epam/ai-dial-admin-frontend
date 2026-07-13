import { describe, expect, test } from 'vitest';

import { CompareRowDetailSection } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/models';
import { filterRowDetailSections } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/filter-row-detail-sections';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { GridFilterType } from '@/src/types/grid-filter';

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

  describe('fieldFilter', () => {
    test('contains keeps only matching labels', () => {
      const result = filterRowDetailSections(sections, {
        searchQuery: '',
        showDiffsOnly: false,
        fieldFilter: { operator: GridFilterType.CONTAINS, value: 'exec' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].rows.map((row) => row.fieldKey)).toEqual(['executionStatus', 'execDurationMs']);
    });

    test('not contains excludes matching labels', () => {
      const result = filterRowDetailSections(sections, {
        searchQuery: '',
        showDiffsOnly: false,
        fieldFilter: { operator: GridFilterType.NOT_CONTAINS, value: 'exec' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('testCaseData');
      expect(result[0].rows).toHaveLength(1);
    });

    test('equals matches the full label case-insensitively', () => {
      const result = filterRowDetailSections(sections, {
        searchQuery: '',
        showDiffsOnly: false,
        fieldFilter: { operator: GridFilterType.EQUALS, value: 'PROMPT' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].rows[0].fieldKey).toBe('prompt');
    });

    test('not equal excludes the exact label', () => {
      const result = filterRowDetailSections(sections, {
        searchQuery: '',
        showDiffsOnly: false,
        fieldFilter: { operator: GridFilterType.NOT_EQUAL, value: 'prompt' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('execution');
      expect(result[0].rows).toHaveLength(2);
    });
  });

  describe('deltaFilter', () => {
    const metricSections: CompareRowDetailSection[] = [
      {
        key: 'metric:accuracy',
        label: 'Accuracy',
        rows: [
          {
            fieldKey: 'precision',
            label: 'precision',
            primaryRaw: '0.5',
            secondaryRaw: '0.8',
            diffKind: MetricDeltaKind.Changed,
            isNumeric: true,
            isScoreIndicator: false,
            isMetric: true,
          },
          {
            fieldKey: 'recall',
            label: 'recall',
            primaryRaw: '0.9',
            secondaryRaw: '0.4',
            diffKind: MetricDeltaKind.Changed,
            isNumeric: true,
            isScoreIndicator: false,
            isMetric: true,
          },
          {
            fieldKey: 'notes',
            label: 'notes',
            primaryRaw: 'a',
            secondaryRaw: 'b',
            diffKind: MetricDeltaKind.Changed,
            isNumeric: false,
            isScoreIndicator: false,
            isMetric: true,
          },
        ],
      },
    ];

    test('greater than keeps positive deltas', () => {
      const result = filterRowDetailSections(metricSections, {
        searchQuery: '',
        showDiffsOnly: false,
        deltaFilter: { operator: GridFilterType.GREATER_THAN, value: 0 },
      });

      expect(result).toHaveLength(1);
      expect(result[0].rows.map((row) => row.fieldKey)).toEqual(['precision']);
    });

    test('less than keeps negative deltas', () => {
      const result = filterRowDetailSections(metricSections, {
        searchQuery: '',
        showDiffsOnly: false,
        deltaFilter: { operator: GridFilterType.LESS_THAN, value: 0 },
      });

      expect(result).toHaveLength(1);
      expect(result[0].rows.map((row) => row.fieldKey)).toEqual(['recall']);
    });

    test('excludes rows without a numeric delta when active', () => {
      const result = filterRowDetailSections(metricSections, {
        searchQuery: '',
        showDiffsOnly: false,
        deltaFilter: { operator: GridFilterType.NOT_EQUAL, value: 999 },
      });

      expect(result).toHaveLength(1);
      expect(result[0].rows.map((row) => row.fieldKey)).toEqual(['precision', 'recall']);
    });
  });
});
