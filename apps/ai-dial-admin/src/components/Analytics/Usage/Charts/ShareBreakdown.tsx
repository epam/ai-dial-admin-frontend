'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { DialLinkButton, DialLoader, ElementSize, Popup, PopupSize, Search } from '@epam/ai-dial-ui-kit';

import DashboardCard from '@/src/components/Analytics/Usage/Card/DashboardCard';
import TabSelector from '@/src/components/Common/TabSelector/TabSelector';
import DonutFigure from '@/src/components/Analytics/Usage/Charts/DonutFigure';
import EmptyRing from '@/src/components/Analytics/Usage/Empty/EmptyRing';
import { DONUT_MODAL_SIZE, DONUT_SIZE, DONUT_SLICE_COUNT } from '@/src/components/Analytics/Usage/constants';
import {
  BreakdownRow,
  BreakdownTab,
  DonutMetric,
  DonutSliceView,
  RequestState,
  UsageView,
} from '@/src/components/Analytics/Usage/models';
import { getSliceColor } from '@/src/components/Analytics/Usage/utils/chart-options';
import {
  buildDonutSlices,
  getSliceCalls,
  getSliceShare,
  getSliceSpend,
} from '@/src/components/Analytics/Usage/utils/donut';
import { formatGroupedNumber, formatMoney, formatPercent } from '@/src/components/Analytics/Usage/utils/format';
import { BREAKDOWN_TAB_COLUMN_LABEL_KEY, getFallbackLabelKey } from '@/src/components/Analytics/Usage/utils/labels';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  rows: RequestState<BreakdownRow[]>;
  tab: BreakdownTab;
  view: UsageView;
  /** What the switch reads: the measure the reader selected. */
  metric: DonutMetric;
  /**
   * What the figures state: the measure the rows on screen were ranked by. It lags `metric` while
   * the re-ranking is read, which is what keeps the card from emptying and moving the page.
   */
  renderedMetric: DonutMetric;
  /** Held above: the ranking is taken on the measure, so a change here re-issues the request. */
  onMetricChange: (metric: DonutMetric) => void;
  windowTotalCalls: number | null;
  windowTotalSpend: number | null;
  /** The dialog is owned above, because opening it is what widens the request behind this card. */
  isFullOpen: boolean;
  /** Whether the window holds rows beyond the ones loaded, which is what the legend scrolls for. */
  hasMoreRows: boolean;
  isReadingMore: boolean;
  onLoadMoreRows: () => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

/** Smaller than the card's own loader: it sits under a list, not in place of a figure. */
const LEGEND_LOADER_SIZE = 20;

/** A figure this chart states, as text: money carries its marker, a count its thousands. */
const formatMetricValue = (value: number, metric: DonutMetric): string => {
  if (metric !== DonutMetric.Cost) {
    return formatGroupedNumber(value);
  }

  const money = formatMoney(value);

  return `${money.value}${money.unit ?? ''}`;
};

const ShareBreakdown: FC<Props> = ({
  rows,
  tab,
  view,
  metric,
  renderedMetric,
  onMetricChange,
  windowTotalCalls,
  windowTotalSpend,
  isFullOpen,
  hasMoreRows,
  isReadingMore,
  onLoadMoreRows,
  onShowAll,
  onHideAll,
}) => {
  const t = useI18n();
  const [legendFilter, setLegendFilter] = useState('');

  const otherLabel = t(AnalyticsUsageI18nKey.DonutOther);
  const fallbackKey = getFallbackLabelKey(tab);
  const hasCostMetric = view === UsageView.Llm;

  const isCostMetric = renderedMetric === DonutMetric.Cost;
  const windowTotal = isCostMetric ? windowTotalSpend : windowTotalCalls;
  const measuresById = useMemo(() => new Map((rows.data ?? []).map((row) => [row.id, row.measures])), [rows.data]);

  /**
   * One ranking read at two depths: the card names five entities, the dialog every row that came
   * back. The share is resolved here so both surfaces divide by the same window total.
   *
   * `withBothMeasures` is the dialog: there the legend has room to state calls and cost side by
   * side, so a reader who opened it on one measure still sees the other without going back for it.
   * The order stays the one the ring was ranked by, which is the measure they arrived with.
   */
  const toViews = useCallback(
    (sliceCount: number, withBothMeasures = false): DonutSliceView[] => {
      const slices = buildDonutSlices(
        rows.data ?? [],
        otherLabel,
        windowTotal,
        sliceCount,
        isCostMetric ? getSliceSpend : getSliceCalls,
      );

      const named = slices.filter((slice) => !slice.isOther);
      const namedCalls = named.reduce((acc, slice) => acc + (measuresById.get(slice.id)?.calls ?? 0), 0);
      const namedSpend = named.reduce((acc, slice) => acc + (measuresById.get(slice.id)?.spend ?? 0), 0);

      // Both columns only where both measures exist; the MCP view prices nothing, so there the
      // legend states its single figure as the card does.
      const statesBoth = withBothMeasures && hasCostMetric;

      const residual = (total: number | null, named: number): number | null =>
        total == null ? null : Math.max(total - named, 0);

      return slices.map((slice, index) => {
        const share = getSliceShare(slice, windowTotal);
        const measures = measuresById.get(slice.id);
        const calls = slice.isOther ? residual(windowTotalCalls, namedCalls) : (measures?.calls ?? 0);
        const spend = slice.isOther ? residual(windowTotalSpend, namedSpend) : (measures?.spend ?? 0);

        return {
          id: slice.id,
          label: slice.isFallbackLabel && fallbackKey ? t(fallbackKey) : slice.label,
          value: slice.value,
          ...(statesBoth
            ? {
                callsLabel: calls == null ? '—' : formatMetricValue(calls, DonutMetric.Calls),
                costLabel: spend == null ? '—' : formatMetricValue(spend, DonutMetric.Cost),
              }
            : {}),
          isOther: slice.isOther,
          valueLabel: formatMetricValue(slice.value, renderedMetric),
          shareLabel: share == null ? null : formatPercent(share, 0),
          color: getSliceColor(index, slice.isOther),
        };
      });
    },
    [
      rows.data,
      otherLabel,
      windowTotal,
      windowTotalCalls,
      windowTotalSpend,
      measuresById,
      isCostMetric,
      hasCostMetric,
      renderedMetric,
      fallbackKey,
      t,
    ],
  );

  const cardSlices = useMemo(() => toViews(DONUT_SLICE_COUNT), [toViews]);
  const fullSlices = useMemo(() => toViews(rows.data?.length ?? 0, true), [toViews, rows.data]);

  // The term narrows the list, never the ring: the reader is looking one entity up in a figure that
  // has to keep adding up to the window.
  const filteredSlices = useMemo(() => {
    const term = legendFilter.trim().toLowerCase();

    return term ? fullSlices.filter((slice) => slice.label.toLowerCase().includes(term)) : fullSlices;
  }, [fullSlices, legendFilter]);

  const isEmptyWindow = !rows.isLoading && (rows.hasFailed || cardSlices.length === 0);
  const centerValue = windowTotal == null ? null : formatMetricValue(windowTotal, renderedMetric);
  const centerCaption = t(isCostMetric ? AnalyticsUsageI18nKey.DonutTotalCost : AnalyticsUsageI18nKey.DonutTotal);
  // Every row of the MCP view is a tool call, so its ring says so rather than saying "calls".
  const callsSubtitleKey = hasCostMetric ? AnalyticsUsageI18nKey.DonutSubtitle : AnalyticsUsageI18nKey.DonutSubtitleMcp;
  const callSubtitleKey = isCostMetric ? AnalyticsUsageI18nKey.DonutSubtitleCost : callsSubtitleKey;
  const searchPlaceholder = t(AnalyticsUsageI18nKey.SearchPlaceholder, {
    dimension: t(BREAKDOWN_TAB_COLUMN_LABEL_KEY[tab]),
  });

  const metricTabs = useMemo(
    () => [
      { id: DonutMetric.Calls, label: t(AnalyticsUsageI18nKey.DonutMetricCalls) },
      { id: DonutMetric.Cost, label: t(AnalyticsUsageI18nKey.DonutMetricCost) },
    ],
    [t],
  );

  const onCloseFull = useCallback(() => {
    onHideAll();
    setLegendFilter('');
  }, [onHideAll]);

  const renderFigure = () => {
    if (rows.isLoading) {
      return <DialLoader size={24} />;
    }

    if (isEmptyWindow) {
      return (
        <div className="flex justify-center">
          <EmptyRing size={DONUT_SIZE}>
            <span className="dial-display2-text text-secondary">—</span>
            <span className="dial-small-text text-secondary">{t(AnalyticsUsageI18nKey.DonutEmptyCenter)}</span>
          </EmptyRing>
        </div>
      );
    }

    return (
      <DonutFigure slices={cardSlices} centerValue={centerValue} centerCaption={centerCaption} size={DONUT_SIZE} />
    );
  };

  return (
    <DashboardCard
      title={t(AnalyticsUsageI18nKey.DonutTitle)}
      subtitle={
        isEmptyWindow
          ? t(AnalyticsUsageI18nKey.DonutEmptySubtitle)
          : t(callSubtitleKey, { count: String(DONUT_SLICE_COUNT) })
      }
      headerActions={
        <div className="flex items-center gap-3">
          {/* Absent in the MCP view, where no row carries a price and a cost ring would be empty
              whatever the window. */}
          {hasCostMetric && (
            <TabSelector
              tabs={metricTabs}
              activeTab={metric}
              onChange={(next) => onMetricChange(next as DonutMetric)}
            />
          )}
          {cardSlices.length > 0 && <DialLinkButton label={t(AnalyticsUsageI18nKey.ViewAll)} onClick={onShowAll} />}
        </div>
      }
      className="flex-[1_1_320px]"
    >
      {renderFigure()}

      <Popup
        open={isFullOpen}
        size={PopupSize.Md}
        header={t(AnalyticsUsageI18nKey.DonutTitle)}
        headerActions={
          <div className="w-[240px]">
            <Search
              id="donut-legend-search"
              size={ElementSize.Small}
              value={legendFilter}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              onChange={(next) => setLegendFilter(next ?? '')}
            />
          </div>
        }
        onClose={onCloseFull}
      >
        <div className="px-6 pb-4">
          {/* The ring draws every row read so far, not the card's five: the dialog is where the
              long tail is being read, and a ring that kept folding it into one slice answered the
              question the card had already answered. Its residual shrinks as the legend reads on. */}
          <DonutFigure
            slices={fullSlices}
            legendSlices={filteredSlices}
            centerValue={centerValue}
            centerCaption={centerCaption}
            size={DONUT_MODAL_SIZE}
            legendClassName="max-h-[320px] overflow-y-auto pr-1"
            // Not while a block is in flight: a scroll fires an event per frame, and each one
            // stepped the limit again, so one flick sent a request per step.
            onLegendEndReached={hasMoreRows && !isReadingMore ? onLoadMoreRows : void 0}
          />
          {/* Under the list rather than over it: the rows already read stay where the reader left
              them, and the spinner says the next ones are on their way. */}
          {isReadingMore && (
            <div className="flex justify-center pt-3">
              <DialLoader size={LEGEND_LOADER_SIZE} />
            </div>
          )}
        </div>
      </Popup>
    </DashboardCard>
  );
};

export default ShareBreakdown;
