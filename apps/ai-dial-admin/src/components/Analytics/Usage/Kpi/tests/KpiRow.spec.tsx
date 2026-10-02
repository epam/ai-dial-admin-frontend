import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import KpiRow from '@/src/components/Analytics/Usage/Kpi/KpiRow';
import {
  BucketPoint,
  ComparePeriod,
  RequestState,
  UsageMeasures,
  UsageView,
} from '@/src/components/Analytics/Usage/models';
import { EMPTY_MEASURES } from '@/src/components/Analytics/Usage/utils/folds';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';

const loaded = <T,>(data: T): RequestState<T> => ({ data, isLoading: false, hasFailed: false });

const measures = (overrides: Partial<UsageMeasures> = {}): UsageMeasures => ({ ...EMPTY_MEASURES, ...overrides });

const FULL = measures({
  calls: 52_400,
  callers: 57,
  failed: 524,
  avgLatencyMs: 7480,
  spend: 630.88,
  promptTokens: 100_000_000,
  completionTokens: 60_700_000,
});

const renderRow = (props?: {
  totals?: RequestState<UsageMeasures | null>;
  previousTotals?: RequestState<UsageMeasures | null>;
  buckets?: RequestState<BucketPoint[]>;
  compare?: ComparePeriod;
  view?: UsageView;
}) =>
  render(
    <KpiRow
      view={props?.view ?? UsageView.Llm}
      totals={props?.totals ?? loaded<UsageMeasures | null>(FULL)}
      previousTotals={props?.previousTotals ?? loaded<UsageMeasures | null>(null)}
      buckets={props?.buckets ?? loaded<BucketPoint[]>([])}
      compare={props?.compare ?? ComparePeriod.Off}
    />,
  );

describe('KpiRow', () => {
  test('names every card the LLM view offers', () => {
    renderRow();

    expect(screen.getByText(AnalyticsUsageI18nKey.KpiTotalSpend)).toBeTruthy();
    expect(screen.getByText(AnalyticsUsageI18nKey.KpiRequests)).toBeTruthy();
    expect(screen.getByText(AnalyticsUsageI18nKey.KpiCostPerMillionTokens)).toBeTruthy();
  });

  test('names its count card for tool calls in the MCP view, which holds nothing else', () => {
    renderRow({ view: UsageView.Mcp, totals: loaded<UsageMeasures | null>(measures({ calls: 10 })) });

    expect(screen.getByText(AnalyticsUsageI18nKey.KpiTotalToolCalls)).toBeTruthy();
    expect(screen.queryByText(AnalyticsUsageI18nKey.KpiTotalSpend)).toBeNull();
  });

  test('heads the Routes view with requests, callers, error rate and latency, and no money or tokens', () => {
    renderRow({ view: UsageView.Routes, totals: loaded<UsageMeasures | null>(measures({ calls: 10 })) });

    for (const key of [
      AnalyticsUsageI18nKey.KpiRequests,
      AnalyticsUsageI18nKey.KpiUniqueCallers,
      AnalyticsUsageI18nKey.KpiErrorRate,
      AnalyticsUsageI18nKey.KpiAvgLatency,
    ]) {
      expect(screen.getByText(key)).toBeTruthy();
    }
    expect(screen.queryByText(AnalyticsUsageI18nKey.KpiTotalSpend)).toBeNull();
    expect(screen.queryByText(AnalyticsUsageI18nKey.KpiTokens)).toBeNull();
    expect(screen.queryByText(AnalyticsUsageI18nKey.KpiCostPerMillionTokens)).toBeNull();
  });

  test('abbreviates a headline figure and carries its unit beside it', () => {
    renderRow();

    expect(screen.getByText('52.4')).toBeTruthy();
    expect(screen.getByText('K')).toBeTruthy();
  });

  test('renders money with its symbol', () => {
    renderRow();

    expect(screen.getByText('$630.88')).toBeTruthy();
  });

  test('states no figure at all when the window recorded no calls', () => {
    renderRow({ totals: loaded<UsageMeasures | null>(measures({ calls: 0 })) });

    expect(screen.queryByText('0')).toBeNull();
  });

  test('names what each card is compared against once comparison is on', () => {
    renderRow({
      compare: ComparePeriod.PreviousPeriod,
      previousTotals: loaded<UsageMeasures | null>(measures({ calls: 40_000 })),
    });

    expect(screen.getAllByText(AnalyticsUsageI18nKey.KpiComparisonFoot).length).toBeGreaterThan(0);
  });

  test('adds no footnote while comparison is off', () => {
    renderRow();

    expect(screen.queryByText(AnalyticsUsageI18nKey.KpiComparisonFoot)).toBeNull();
  });

  test('states the change as a direction rather than a signed number', () => {
    renderRow({
      compare: ComparePeriod.PreviousPeriod,
      previousTotals: loaded<UsageMeasures | null>(measures({ calls: 40_000, spend: 500 })),
    });

    expect(screen.getAllByText(AnalyticsUsageI18nKey.KpiDeltaIncrease).length).toBeGreaterThan(0);
  });

  test('states no figure when the window could not be read, leaving the message to a notification', () => {
    renderRow({ totals: { data: null, isLoading: false, hasFailed: true } });

    expect(screen.queryByText('$630.88')).toBeNull();
    expect(screen.getByText(AnalyticsUsageI18nKey.KpiTotalSpend)).toBeTruthy();
  });
});

describe('KpiRow with a separate money source', () => {
  const PENDING: RequestState<UsageMeasures | null> = { data: null, isLoading: true, hasFailed: false };

  test('shows the money and token cards loading while their own source is, and the rest settled', () => {
    render(
      <KpiRow
        view={UsageView.Llm}
        totals={loaded<UsageMeasures | null>(FULL)}
        previousTotals={loaded<UsageMeasures | null>(null)}
        buckets={loaded<BucketPoint[]>([])}
        compare={ComparePeriod.Off}
        madeTotals={{ current: PENDING, previous: loaded<UsageMeasures | null>(null) }}
      />,
    );

    expect(screen.getAllByRole('status')).toHaveLength(3);
  });
});
