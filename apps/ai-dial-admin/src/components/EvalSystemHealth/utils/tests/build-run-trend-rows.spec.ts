import { describe, expect, test } from 'vitest';

import { buildRunTrendRows } from '@/src/components/EvalSystemHealth/utils/build-run-trend-rows';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';
import { RunTrendPoint, SuiteRunTrend, SuiteType } from '@/src/models/evaluation/run-trend';

const run = (passRate?: number): RunTrendPoint => ({
  runId: `run-${passRate ?? 'none'}`,
  createdAt: 1,
  passRate,
  passedCount: 0,
  totalCount: passRate == null ? 0 : 10,
});

const suiteOf = (overrides: Partial<SuiteRunTrend> = {}): SuiteRunTrend => ({
  suiteId: 'suite-1',
  suiteName: 'Docs regression',
  suiteType: SuiteType.Deployment,
  evaluatee: { id: 'gpt-4o', name: 'GPT-4o', type: 'dial-model' },
  runs: [run(0.9), run(0.8)],
  latestPassRate: 0.8,
  previousPassRate: 0.9,
  delta: -0.1,
  ...overrides,
});

const rowOf = (overrides: Partial<SuiteRunTrend> = {}) => buildRunTrendRows([suiteOf(overrides)])[0];

describe('buildRunTrendRows', () => {
  test('keeps the order of the suites it is given', () => {
    const rows = buildRunTrendRows([suiteOf({ suiteId: 'b' }), suiteOf({ suiteId: 'a' })]);

    expect(rows.map((row) => row.suiteId)).toEqual(['b', 'a']);
  });

  test('returns no rows for no suites', () => {
    expect(buildRunTrendRows([])).toEqual([]);
  });

  describe('test suite', () => {
    test('carries the suite id and name', () => {
      expect(rowOf()).toMatchObject({ suiteId: 'suite-1', suiteName: 'Docs regression' });
    });
  });

  describe('evaluatee', () => {
    test('shows the evaluatee name with its type label', () => {
      expect(rowOf()).toMatchObject({
        evaluateeName: 'GPT-4o',
        kindKey: EvalSystemHealthI18nKey.RunTrendsKindModel,
      });
    });

    test('reads Model, Application and Toolset from the evaluatee type', () => {
      expect(rowOf({ evaluatee: { name: 'a', type: 'dial-model' } }).kindKey).toBe(
        EvalSystemHealthI18nKey.RunTrendsKindModel,
      );
      expect(rowOf({ evaluatee: { name: 'a', type: 'dial-application' } }).kindKey).toBe(
        EvalSystemHealthI18nKey.RunTrendsKindApplication,
      );
      expect(rowOf({ evaluatee: { name: 'a', type: 'dial-toolset' } }).kindKey).toBe(
        EvalSystemHealthI18nKey.RunTrendsKindToolset,
      );
    });

    test('reads an application behind an MCP tool as an application', () => {
      const row = rowOf({
        suiteType: SuiteType.McpTool,
        evaluatee: { name: 'Bot', type: 'dial-application', toolName: 'search' },
      });

      expect(row.kindKey).toBe(EvalSystemHealthI18nKey.RunTrendsKindApplication);
    });

    test('reads Route for a route suite that carries only a name', () => {
      expect(
        rowOf({ suiteType: SuiteType.Route, evaluatee: { name: 'routes/platform/validate-route' } }),
      ).toMatchObject({
        evaluateeName: 'routes/platform/validate-route',
        kindKey: EvalSystemHealthI18nKey.RunTrendsKindRoute,
      });
    });

    test('falls back to the suite type when the evaluatee has a name but no type', () => {
      expect(rowOf({ suiteType: SuiteType.McpTool, evaluatee: { name: 'Docs' } }).kindKey).toBe(
        EvalSystemHealthI18nKey.RunTrendsKindToolset,
      );
      expect(rowOf({ suiteType: SuiteType.Deployment, evaluatee: { name: 'Docs' } }).kindKey).toBe(
        EvalSystemHealthI18nKey.RunTrendsKindModel,
      );
    });

    test('falls back to the suite type for an evaluatee type it has no label for', () => {
      expect(rowOf({ suiteType: SuiteType.Route, evaluatee: { name: 'a', type: 'dial-future-kind' } }).kindKey).toBe(
        EvalSystemHealthI18nKey.RunTrendsKindRoute,
      );
    });

    test('shows the id when the evaluatee has no name', () => {
      expect(rowOf({ evaluatee: { id: 'gpt-4o', type: 'dial-model' } })).toMatchObject({
        evaluateeName: 'gpt-4o',
        kindKey: EvalSystemHealthI18nKey.RunTrendsKindModel,
      });
    });

    test('has neither a name nor a type label for a suite with no reference', () => {
      expect(rowOf({ evaluatee: {} })).toMatchObject({ evaluateeName: null, kindKey: null });
    });
  });

  describe('trend and latest', () => {
    test('lists the pass rates of the runs in the order given', () => {
      expect(rowOf({ runs: [run(0.5), run(0.7), run(0.9)] }).points).toEqual([0.5, 0.7, 0.9]);
    });

    test('leaves out a run that has no pass rate', () => {
      expect(rowOf({ runs: [run(0.5), run(undefined), run(0.9)] }).points).toEqual([0.5, 0.9]);
    });

    test('returns no points for a suite whose only run has no pass rate', () => {
      expect(rowOf({ runs: [run(undefined)], latestPassRate: undefined }).points).toEqual([]);
    });

    test('carries the latest pass rate', () => {
      expect(rowOf({ latestPassRate: 0.8 }).latestRate).toBe(0.8);
    });

    test('has no latest rate when the backend gives none', () => {
      expect(rowOf({ latestPassRate: undefined }).latestRate).toBeNull();
    });

    test('keeps a latest rate of zero', () => {
      expect(rowOf({ latestPassRate: 0 }).latestRate).toBe(0);
    });
  });

  describe('change', () => {
    test('formats a drop as a negative percentage-point change', () => {
      expect(rowOf({ latestPassRate: 0.8, previousPassRate: 0.9 }).deltaLabel).toBe('-10%');
    });

    test('formats a rise as a positive percentage-point change', () => {
      expect(rowOf({ latestPassRate: 0.9, previousPassRate: 0.8 }).deltaLabel).toBe('+10%');
    });

    test('has no change for a single run', () => {
      expect(rowOf({ runs: [run(0.8)], previousPassRate: undefined, delta: undefined }).deltaLabel).toBeNull();
    });

    test('has no change when the newest run has no pass rate', () => {
      expect(rowOf({ latestPassRate: undefined, delta: undefined }).deltaLabel).toBeNull();
    });

    test('has no change when it rounds to zero', () => {
      expect(rowOf({ latestPassRate: 0.8, previousPassRate: 0.8 }).deltaLabel).toBeNull();
    });
  });
});
