import { describe, expect, test } from 'vitest';

import { CoverageSource, CoverageStatus } from '@/src/components/EvalSystemHealth/models';
import { buildEvalCostCard } from '@/src/components/EvalSystemHealth/utils/build-eval-cost-card';
import { EvalPeriodCosts, TotalCosts } from '@/src/models/evaluation/run';

const ready = (current: TotalCosts | null, previous: TotalCosts | null): CoverageSource<EvalPeriodCosts> => ({
  status: CoverageStatus.Ready,
  value: { current, previous },
});

const COSTS: TotalCosts = { totalCost: 4218, testCaseCost: 2840, metricEvalCost: 1378 };

describe('buildEvalCostCard', () => {
  test('passes the loading state through with no figures', () => {
    expect(buildEvalCostCard({ status: CoverageStatus.Loading })).toEqual({
      status: CoverageStatus.Loading,
      total: null,
      evaluateesCost: null,
      judgesCost: null,
      deltaLabel: null,
    });
  });

  test('passes the error state through', () => {
    expect(buildEvalCostCard({ status: CoverageStatus.Error }).status).toBe(CoverageStatus.Error);
  });

  test('reads the total, the split and the delta of a ready source', () => {
    expect(buildEvalCostCard(ready(COSTS, { totalCost: 3876 }))).toEqual({
      status: CoverageStatus.Ready,
      total: 4218,
      evaluateesCost: 2840,
      judgesCost: 1378,
      deltaLabel: '+$342',
    });
  });

  test('labels a fall with a minus sign', () => {
    expect(buildEvalCostCard(ready({ totalCost: 3000 }, { totalCost: 3214 })).deltaLabel).toBe('-$214');
  });

  test.each([
    ['current', null, { totalCost: 1 }],
    ['previous', { totalCost: 1 }, null],
  ])('is an error when the %s window failed, not a one-period total', (_name, current, previous) => {
    expect(buildEvalCostCard(ready(current, previous))).toMatchObject({
      status: CoverageStatus.Error,
      total: null,
      deltaLabel: null,
    });
  });

  test('is an error for a ready source with no value', () => {
    expect(buildEvalCostCard({ status: CoverageStatus.Ready }).status).toBe(CoverageStatus.Error);
  });

  test('reads a figure the backend omitted as null', () => {
    expect(buildEvalCostCard(ready({ totalCost: 5 }, {}))).toMatchObject({
      total: 5,
      evaluateesCost: null,
      judgesCost: null,
    });
  });

  test('keeps a zero judge cost as zero', () => {
    expect(buildEvalCostCard(ready({ totalCost: 5, testCaseCost: 5, metricEvalCost: 0 }, {})).judgesCost).toBe(0);
  });

  test('has no total and no label when the current window recorded no cost', () => {
    expect(buildEvalCostCard(ready({}, { totalCost: 100 }))).toMatchObject({
      status: CoverageStatus.Ready,
      total: null,
      deltaLabel: null,
    });
  });

  test('has no label when the previous window recorded no cost', () => {
    expect(buildEvalCostCard(ready(COSTS, {})).deltaLabel).toBeNull();
  });

  test('has no label for a change under a cent', () => {
    expect(buildEvalCostCard(ready({ totalCost: 10.003 }, { totalCost: 10 })).deltaLabel).toBeNull();
  });
});
