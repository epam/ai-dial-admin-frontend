'use client';

import { FC, useEffect, useMemo, useRef, useState } from 'react';

import KpiCard from '@/src/components/Analytics/Usage/Kpi/KpiCard';
import { KPI_CARD_MIN_WIDTH } from '@/src/components/Analytics/Usage/constants';
import {
  BucketPoint,
  ComparePeriod,
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
import { COMPARE_NAME_KEY } from '@/src/components/Analytics/Usage/utils/labels';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  view: UsageView;
  totals: RequestState<UsageMeasures | null>;
  previousTotals: RequestState<UsageMeasures | null>;
  buckets: RequestState<BucketPoint[]>;
  compare: ComparePeriod;
}

const TITLE_KEY: Record<KpiMetric, AnalyticsUsageI18nKey> = {
  [KpiMetric.TotalSpend]: AnalyticsUsageI18nKey.KpiTotalSpend,
  [KpiMetric.Requests]: AnalyticsUsageI18nKey.KpiRequests,
  [KpiMetric.Tokens]: AnalyticsUsageI18nKey.KpiTokens,
  [KpiMetric.CostPerMillionTokens]: AnalyticsUsageI18nKey.KpiCostPerMillionTokens,
  [KpiMetric.UniqueCallers]: AnalyticsUsageI18nKey.KpiUniqueCallers,
  [KpiMetric.ErrorRate]: AnalyticsUsageI18nKey.KpiErrorRate,
  [KpiMetric.AvgLatency]: AnalyticsUsageI18nKey.KpiAvgLatency,
  [KpiMetric.ToolCalls]: AnalyticsUsageI18nKey.KpiTotalToolCalls,
};

/**
 * Cards per row: all of them when the row is wide enough to hold them, and half the count rounded
 * up when it is not.
 *
 * Letting a pixel basis decide instead put the row on the bad counts — seven cards at a common
 * desktop width gave six and a stretched orphan. Measuring is what allows both answers: the width
 * that matters is the row's own, since these cards sit inside a page whose other widgets share it.
 * The gap subtracted here is `gap-3`, so the arithmetic has to follow that class if it changes.
 */
const CARD_GAP_REM = 0.75;
const CARD_GAP_PX = 12;

const getCardsPerRow = (count: number, rowWidth: number): number =>
  rowWidth >= count * KPI_CARD_MIN_WIDTH + (count - 1) * CARD_GAP_PX ? count : Math.ceil(count / 2);

const getCardBasis = (perRow: number): string => `calc((100% - ${(perRow - 1) * CARD_GAP_REM}rem) / ${perRow})`;

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

const KpiRow: FC<Props> = ({ view, totals, previousTotals, buckets, compare }) => {
  const isComparisonOn = compare !== ComparePeriod.Off;
  const t = useI18n();
  const rowRef = useRef<HTMLDivElement>(null);
  const [rowWidth, setRowWidth] = useState(0);

  useEffect(() => {
    const row = rowRef.current;

    if (!row || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(([entry]) => setRowWidth(entry.contentRect.width));
    observer.observe(row);

    return () => observer.disconnect();
  }, []);

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

  const cardBasis = getCardBasis(getCardsPerRow(figures.length, rowWidth));

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
        : t(AnalyticsUsageI18nKey.KpiComparisonFoot, {
            value: previous == null ? '—' : formatFootnoteValue(figure.metric, previous),
            period: t(COMPARE_NAME_KEY[compare]),
          }),
      sparkline: figure.sparkline,
    };
  };

  return (
    /*
     * Wrapping flex rather than a grid of auto-fit tracks. A grid keeps the tracks it created for
     * the first row, so a card count that does not divide by them leaves the last row short and the
     * rest of it blank — seven cards over six tracks sat alone beside five empty columns. Flex
     * items grow into whatever their own row has left, so every row is full whatever the count.
     */
    <div ref={rowRef} className="flex flex-wrap gap-3">
      {figures.map((figure) => (
        <KpiCard
          key={figure.metric}
          card={toCard(figure)}
          className="min-w-[196px] grow"
          style={{ flexBasis: cardBasis }}
          isLoading={totals.isLoading}
          hasFailed={totals.hasFailed}
        />
      ))}
    </div>
  );
};

export default KpiRow;
