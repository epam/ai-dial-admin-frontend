'use client';

import { FC, useMemo } from 'react';

import KpiCard from '@/src/components/Analytics/Usage/Kpi/KpiCard';
import {
  BucketPoint,
  KpiCardModel,
  KpiFigure,
  KpiMetric,
  RequestState,
  UsageMeasures,
  UsageView,
} from '@/src/components/Analytics/Usage/models';
import {
  formatCompactNumber,
  formatDuration,
  formatMoney,
  formatPercent,
  getDeltaRatio,
} from '@/src/components/Analytics/Usage/utils/format';
import { buildKpiFigures } from '@/src/components/Analytics/Usage/utils/kpi-cards';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  view: UsageView;
  totals: RequestState<UsageMeasures | null>;
  previousTotals: RequestState<UsageMeasures | null>;
  buckets: RequestState<BucketPoint[]>;
  isComparisonOn: boolean;
}

const TITLE_KEY: Record<KpiMetric, AnalyticsUsageI18nKey> = {
  [KpiMetric.TotalSpend]: AnalyticsUsageI18nKey.KpiTotalSpend,
  [KpiMetric.Requests]: AnalyticsUsageI18nKey.KpiRequests,
  [KpiMetric.Tokens]: AnalyticsUsageI18nKey.KpiTokens,
  [KpiMetric.CostPerMillionTokens]: AnalyticsUsageI18nKey.KpiCostPerMillionTokens,
  [KpiMetric.UniqueUsers]: AnalyticsUsageI18nKey.KpiUniqueUsers,
  [KpiMetric.ErrorRate]: AnalyticsUsageI18nKey.KpiErrorRate,
  [KpiMetric.AvgLatency]: AnalyticsUsageI18nKey.KpiAvgLatency,
  [KpiMetric.ToolCalls]: AnalyticsUsageI18nKey.KpiTotalToolCalls,
};

const MONEY_METRICS = new Set([KpiMetric.TotalSpend, KpiMetric.CostPerMillionTokens]);
const RATIO_METRICS = new Set([KpiMetric.ErrorRate]);
const DURATION_METRICS = new Set([KpiMetric.AvgLatency]);

const formatValue = (metric: KpiMetric, value: number): { value: string; unit?: string } => {
  if (MONEY_METRICS.has(metric)) {
    return formatMoney(value);
  }
  if (RATIO_METRICS.has(metric)) {
    return { value: formatPercent(value, 2) };
  }
  if (DURATION_METRICS.has(metric)) {
    return formatDuration(value);
  }

  return formatCompactNumber(value);
};

/** The card's own value and unit are two nodes; a footnote is one string, so it carries both. */
const formatFootnoteValue = (metric: KpiMetric, value: number): string => {
  const formatted = formatValue(metric, value);

  return `${formatted.value}${formatted.unit ?? ''}`;
};

const KpiRow: FC<Props> = ({ view, totals, previousTotals, buckets, isComparisonOn }) => {
  const t = useI18n();

  const figures = useMemo(
    () =>
      buildKpiFigures({
        view,
        current: totals.data ?? null,
        previous: isComparisonOn ? (previousTotals.data ?? null) : null,
        buckets: buckets.data ?? [],
      }),
    [view, totals.data, previousTotals.data, buckets.data, isComparisonOn],
  );

  const toCard = (figure: KpiFigure): KpiCardModel => {
    const { current, previous } = figure.value;
    const formatted = current == null ? null : formatValue(figure.metric, current);

    return {
      metric: figure.metric,
      titleKey: TITLE_KEY[figure.metric],
      value: formatted?.value ?? null,
      unit: formatted?.unit,
      deltaRatio: getDeltaRatio(current, previous),
      // With comparison on the card always says what it is compared against, including when the
      // previous window reported nothing — silence there reads as a missing feature.
      footnote: !isComparisonOn
        ? void 0
        : t(AnalyticsUsageI18nKey.KpiPreviousPeriodFoot, {
            value: previous == null ? '—' : formatFootnoteValue(figure.metric, previous),
          }),
      sparkline: figure.sparkline,
    };
  };

  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(196px,1fr))]">
      {figures.map((figure) => (
        <KpiCard
          key={figure.metric}
          card={toCard(figure)}
          isLoading={totals.isLoading}
          hasFailed={totals.hasFailed}
          error={totals.error}
        />
      ))}
    </div>
  );
};

export default KpiRow;
