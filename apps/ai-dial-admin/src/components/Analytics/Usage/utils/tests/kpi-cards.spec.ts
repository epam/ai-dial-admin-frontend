import { describe, expect, test } from 'vitest';

import { BucketPoint, KpiMetric, UsageMeasures, UsageView } from '@/src/components/Analytics/Usage/models';
import { EMPTY_MEASURES } from '@/src/components/Analytics/Usage/utils/folds';
import { VIEW_KPI_METRICS, buildKpiFigures, getShareOfTotal } from '@/src/components/Analytics/Usage/utils/kpi-cards';

const measures = (overrides: Partial<UsageMeasures> = {}): UsageMeasures => ({ ...EMPTY_MEASURES, ...overrides });

const bucket = (bucketMs: number, overrides: Partial<UsageMeasures> = {}): BucketPoint => ({
  bucketMs,
  measures: measures(overrides),
});

const figureOf = (metric: KpiMetric, input: Parameters<typeof buildKpiFigures>[0]) =>
  buildKpiFigures(input).find((figure) => figure.metric === metric);

const llm = (current: UsageMeasures | null, previous: UsageMeasures | null = null, buckets: BucketPoint[] = []) => ({
  view: UsageView.Llm,
  current,
  previous,
  buckets,
});

describe('VIEW_KPI_METRICS', () => {
  test('offers no price or token cards in the MCP view, which records neither', () => {
    expect(VIEW_KPI_METRICS[UsageView.Mcp]).not.toContain(KpiMetric.TotalSpend);
    expect(VIEW_KPI_METRICS[UsageView.Mcp]).not.toContain(KpiMetric.Tokens);
    expect(VIEW_KPI_METRICS[UsageView.Mcp]).toContain(KpiMetric.ToolCalls);
  });
});

describe('buildKpiFigures', () => {
  test('builds one figure per card the view offers, in order', () => {
    expect(buildKpiFigures(llm(measures({ calls: 1 }))).map((figure) => figure.metric)).toEqual(
      VIEW_KPI_METRICS[UsageView.Llm],
    );
  });

  test('reads each metric off the window aggregate', () => {
    const current = measures({ calls: 100, callers: 9, failed: 5, spend: 20, promptTokens: 600, completionTokens: 400 });

    expect(figureOf(KpiMetric.Requests, llm(current))?.value.current).toBe(100);
    expect(figureOf(KpiMetric.UniqueCallers, llm(current))?.value.current).toBe(9);
    expect(figureOf(KpiMetric.TotalSpend, llm(current))?.value.current).toBe(20);
    expect(figureOf(KpiMetric.Tokens, llm(current))?.value.current).toBe(1000);
    expect(figureOf(KpiMetric.ErrorRate, llm(current))?.value.current).toBe(0.05);
    expect(figureOf(KpiMetric.CostPerMillionTokens, llm(current))?.value.current).toBe(20_000);
  });

  test('leaves every card blank when the window recorded no calls', () => {
    const figures = buildKpiFigures(llm(measures({ calls: 0, callers: 0 })));

    expect(figures.every((figure) => figure.value.current === null)).toBe(true);
  });

  test('leaves the comparison blank when the previous window recorded no calls', () => {
    const figures = buildKpiFigures(llm(measures({ calls: 10 }), measures({ calls: 0 })));

    expect(figures.every((figure) => figure.value.previous === null)).toBe(true);
  });

  test('reads the comparison when the previous window did carry traffic', () => {
    expect(figureOf(KpiMetric.Requests, llm(measures({ calls: 10 }), measures({ calls: 4 })))?.value.previous).toBe(4);
  });

  test('leaves cost per token unknown when the window counted no tokens', () => {
    expect(figureOf(KpiMetric.CostPerMillionTokens, llm(measures({ calls: 5, spend: 1 })))?.value.current).toBeNull();
  });

  test('plots a sparkline point per bucket', () => {
    const buckets = [bucket(1, { calls: 2 }), bucket(2, { calls: 4 })];

    expect(figureOf(KpiMetric.Requests, llm(measures({ calls: 6 }), null, buckets))?.sparkline).toEqual([2, 4]);
  });

  test('leaves a gap out of the cost-per-token line rather than drawing it as a collapse', () => {
    const buckets = [bucket(1, { spend: 2, promptTokens: 1_000_000 }), bucket(2, { spend: 1 })];
    const figure = figureOf(KpiMetric.CostPerMillionTokens, llm(measures({ calls: 1 }), null, buckets));

    expect(figure?.sparkline).toEqual([2]);
  });
});

describe('getShareOfTotal', () => {
  test('divides the row by the window total', () => {
    expect(getShareOfTotal(25, 100)).toBe(0.25);
  });

  test.each([
    ['the row is unknown', null, 100],
    ['the total is unknown', 25, null],
    ['the total is zero', 25, 0],
  ])('returns nothing when %s', (_case, value, total) => {
    expect(getShareOfTotal(value, total)).toBeNull();
  });
});
