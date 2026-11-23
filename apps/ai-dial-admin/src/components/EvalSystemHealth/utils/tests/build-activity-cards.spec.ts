import { describe, expect, test } from 'vitest';

import {
  ActivityCardModel,
  ActivityKind,
  ActivityResults,
  CoverageSource,
  CoverageStatus,
} from '@/src/components/EvalSystemHealth/models';
import { buildActivityCards } from '@/src/components/EvalSystemHealth/utils/build-activity-cards';

const rowsOf = (count: number) => ({
  rows: Array.from({ length: count }, (_, index) => ({ test_suite_id: `s-${index}` })),
});

const resultsOf = (overrides: Partial<ActivityResults> = {}): ActivityResults => ({
  totalSuites: { rows: [{ id: 'any' }], totalCount: 200 },
  suitesRunCurrent: rowsOf(50),
  suitesRunPrevious: rowsOf(30),
  suitesAddedCurrent: {
    rows: [
      { 'deployment_ref::id': 'a', 'mcp_deployment_ref::id': null },
      { 'deployment_ref::id': 'a', 'mcp_deployment_ref::id': null },
      { 'deployment_ref::id': null, 'mcp_deployment_ref::id': 'b' },
    ],
    totalCount: 47,
  },
  suitesAddedPrevious: { rows: [{ id: 'any' }], totalCount: 38 },
  ...overrides,
});

const ready = (value: ActivityResults): CoverageSource<ActivityResults> => ({ status: CoverageStatus.Ready, value });

const cardOf = (cards: ActivityCardModel[], kind: ActivityKind) =>
  cards.find((card) => card.kind === kind) as ActivityCardModel;

describe('buildActivityCards', () => {
  test('returns the two cards in display order', () => {
    expect(buildActivityCards(ready(resultsOf())).map((card) => card.kind)).toEqual([
      ActivityKind.SuitesRun,
      ActivityKind.SuitesAdded,
    ]);
  });

  test('counts the suites run from the group rows, against the total, with the delta', () => {
    expect(cardOf(buildActivityCards(ready(resultsOf())), ActivityKind.SuitesRun)).toEqual({
      kind: ActivityKind.SuitesRun,
      status: CoverageStatus.Ready,
      value: 50,
      delta: 20,
      total: 200,
      rate: 0.25,
      evaluateeCount: null,
    });
  });

  test('gives the run card a null rate when no test suite exists', () => {
    const card = cardOf(
      buildActivityCards(ready(resultsOf({ totalSuites: { rows: [], totalCount: 0 }, suitesRunCurrent: rowsOf(0) }))),
      ActivityKind.SuitesRun,
    );

    expect(card).toMatchObject({ status: CoverageStatus.Ready, total: 0, rate: null });
  });

  test('reads the suites added from the reported totals and counts the targeted evaluatees from the rows', () => {
    expect(cardOf(buildActivityCards(ready(resultsOf())), ActivityKind.SuitesAdded)).toEqual({
      kind: ActivityKind.SuitesAdded,
      status: CoverageStatus.Ready,
      value: 47,
      delta: 9,
      total: null,
      rate: null,
      evaluateeCount: 2,
    });
  });

  test('reports a negative delta when fewer ran than in the previous period', () => {
    const card = cardOf(
      buildActivityCards(ready(resultsOf({ suitesRunCurrent: rowsOf(10), suitesRunPrevious: rowsOf(40) }))),
      ActivityKind.SuitesRun,
    );

    expect(card.delta).toBe(-30);
  });

  test('reports a zero delta when the two periods match', () => {
    const card = cardOf(
      buildActivityCards(ready(resultsOf({ suitesRunCurrent: rowsOf(7), suitesRunPrevious: rowsOf(7) }))),
      ActivityKind.SuitesRun,
    );

    expect(card.delta).toBe(0);
  });

  test.each([['totalSuites'], ['suitesRunCurrent'], ['suitesRunPrevious']] as const)(
    'errors only the run card when the %s query failed',
    (failedQuery) => {
      const cards = buildActivityCards(ready(resultsOf({ [failedQuery]: null })));

      expect(cardOf(cards, ActivityKind.SuitesRun).status).toBe(CoverageStatus.Error);
      expect(cardOf(cards, ActivityKind.SuitesAdded).status).toBe(CoverageStatus.Ready);
    },
  );

  test.each([['suitesAddedCurrent'], ['suitesAddedPrevious']] as const)(
    'errors only the added card when the %s query failed',
    (failedQuery) => {
      const cards = buildActivityCards(ready(resultsOf({ [failedQuery]: null })));

      expect(cardOf(cards, ActivityKind.SuitesAdded).status).toBe(CoverageStatus.Error);
      expect(cardOf(cards, ActivityKind.SuitesRun).status).toBe(CoverageStatus.Ready);
    },
  );

  test('leaves a failed card with no figures', () => {
    const card = cardOf(buildActivityCards(ready(resultsOf({ totalSuites: null }))), ActivityKind.SuitesRun);

    expect(card).toMatchObject({ value: 0, delta: null, total: null, rate: null });
  });

  test('puts both cards in the loading state while the batch is pending', () => {
    const cards = buildActivityCards({ status: CoverageStatus.Loading });

    expect(cards.map((card) => card.status)).toEqual([CoverageStatus.Loading, CoverageStatus.Loading]);
    expect(cards.every((card) => card.delta === null)).toBe(true);
  });

  test('puts both cards in the error state when the whole batch failed', () => {
    const cards = buildActivityCards({ status: CoverageStatus.Error });

    expect(cards.map((card) => card.status)).toEqual([CoverageStatus.Error, CoverageStatus.Error]);
  });
});
