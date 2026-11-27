import { describe, expect, test } from 'vitest';

import { RunTrendRow } from '@/src/components/EvalSystemHealth/models';
import { buildRunTrendColumns } from '@/src/components/EvalSystemHealth/utils/build-run-trend-columns';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';

const row: RunTrendRow = {
  suiteId: 'suite 1',
  suiteName: 'Docs regression',
  evaluateeName: 'Docs toolset',
  kindKey: EvalSystemHealthI18nKey.RunTrendsKindToolset,
  points: [0.5],
  latestRate: 0.5,
  deltaLabel: null,
};

const noReferenceRow: RunTrendRow = { ...row, evaluateeName: null, kindKey: null };

// Keeps the params so the run count in the trend header can be asserted.
const columns = buildRunTrendColumns((key, params) => (params ? `${key}:${JSON.stringify(params)}` : key));
const columnOf = (colId: string) => columns.find((column) => column.colId === colId)!;

interface TitleSubtitleParams {
  getSubtitle: (data?: RunTrendRow) => string | undefined;
  getHref?: (data?: RunTrendRow) => string | undefined;
}

describe('buildRunTrendColumns', () => {
  test('returns Test suite, Evaluatee, Run trends, Latest and Δ prev in that order, with no Type column', () => {
    expect(columns.map((column) => column.headerName)).toEqual([
      EvalSystemHealthI18nKey.RunTrendsColumnSuite,
      EvalSystemHealthI18nKey.RunTrendsColumnEvaluatee,
      `${EvalSystemHealthI18nKey.RunTrendsColumnTrend}:${JSON.stringify({ count: 10 })}`,
      EvalSystemHealthI18nKey.RunTrendsColumnLatest,
      EvalSystemHealthI18nKey.RunTrendsColumnDelta,
    ]);
  });

  test('lets no column sort, filter or move', () => {
    expect(columns.every((column) => column.sortable === false && column.filter === false)).toBe(true);
    expect(columns.every((column) => column.floatingFilter === false && column.suppressMovable === true)).toBe(true);
  });

  describe('Test suite', () => {
    const suite = columnOf('suite');
    const params = suite.cellRendererParams as TitleSubtitleParams;

    test('shows the suite name over the suite id', () => {
      expect(suite.field).toBe('suiteName');
      expect(params.getSubtitle(row)).toBe('suite 1');
    });

    test('links the suite name to the suite', () => {
      expect(params.getHref?.(row)).toBe('/test-suites/suite%201');
    });
  });

  describe('Evaluatee', () => {
    const evaluatee = columnOf('evaluatee');
    const valueGetter = evaluatee.valueGetter as (params: { data?: RunTrendRow }) => string;
    const params = evaluatee.cellRendererParams as TitleSubtitleParams;

    test('shows the evaluatee name over its translated type', () => {
      expect(valueGetter({ data: row })).toBe('Docs toolset');
      expect(params.getSubtitle(row)).toBe(EvalSystemHealthI18nKey.RunTrendsKindToolset);
    });

    test('shows a dash with no second line for a suite with no reference', () => {
      expect(valueGetter({ data: noReferenceRow })).toBe('—');
      expect(params.getSubtitle(noReferenceRow)).toBeUndefined();
    });

    test('does not link', () => {
      expect(params.getHref).toBeUndefined();
    });
  });
});
