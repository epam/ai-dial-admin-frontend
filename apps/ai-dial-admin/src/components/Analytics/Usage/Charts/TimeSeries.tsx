'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ReactECharts from 'echarts-for-react';
import { DialLoader } from '@epam/ai-dial-ui-kit';

import DashboardCard from '@/src/components/Analytics/Usage/Card/DashboardCard';
import ChartLegend, { ChartLegendEntry } from '@/src/components/Analytics/Usage/Charts/ChartLegend';
import UsageEmptyState from '@/src/components/Analytics/Usage/Empty/UsageEmptyState';
import {
  DONUT_SLICE_COUNT,
  TIME_SERIES_MIN_HEIGHT,
  VIEW_TIME_SERIES_VIEWS,
} from '@/src/components/Analytics/Usage/constants';
import {
  BreakdownRow,
  BreakdownTab,
  BucketPoint,
  DimensionBucketPoint,
  RequestState,
  SpendBucket,
  TimeSeriesView,
  UsageView,
} from '@/src/components/Analytics/Usage/models';
import {
  LATENCY_P50_COLOR,
  LATENCY_P95_COLOR,
  buildBarOptions,
  buildLatencyOptions,
  buildSplitSeriesOptions,
  buildTimeSeriesOptions,
  getSliceColor,
} from '@/src/components/Analytics/Usage/utils/chart-options';
import { formatBucketRange, getWindowBounds } from '@/src/components/Analytics/Usage/utils/format';
import { BREAKDOWN_TAB_COLUMN_LABEL_KEY } from '@/src/components/Analytics/Usage/utils/labels';
import { getBucketStepMs, padBucketPoints } from '@/src/components/Analytics/Usage/utils/buckets';
import { buildStackedMatrix } from '@/src/components/Analytics/Usage/utils/stack';
import { getSpendResolution } from '@/src/components/Analytics/Usage/utils/spend-resolution';
import TabSelector from '@/src/components/Common/TabSelector/TabSelector';
import { AnalyticsUsageI18nKey, BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TimeRange } from '@/src/models/time-range';
import { ChartResolution } from '@/src/utils/time-filter/get-chart-resolution';

interface Props {
  window: TimeRange;
  buckets: RequestState<BucketPoint[]>;
  dimensionBuckets: RequestState<DimensionBucketPoint[]>;
  spendBuckets: RequestState<SpendBucket[]>;
  donutRows: RequestState<BreakdownRow[]>;
  view: UsageView;
  dimensionTab: BreakdownTab;
  resolution: ChartResolution;
  timeSeriesView: TimeSeriesView;
  onTimeSeriesViewChange: (view: TimeSeriesView) => void;
}

const TAB_LABEL_KEY: Record<TimeSeriesView, AnalyticsUsageI18nKey> = {
  [TimeSeriesView.Requests]: AnalyticsUsageI18nKey.TimeSeriesTabRequests,
  [TimeSeriesView.ByDimension]: AnalyticsUsageI18nKey.TimeSeriesTabSplit,
  [TimeSeriesView.Cost]: AnalyticsUsageI18nKey.TimeSeriesTabCost,
  [TimeSeriesView.Latency]: AnalyticsUsageI18nKey.TimeSeriesTabLatency,
};

const TITLE_KEY: Record<TimeSeriesView, AnalyticsUsageI18nKey> = {
  [TimeSeriesView.Requests]: AnalyticsUsageI18nKey.TimeSeriesTitle,
  [TimeSeriesView.ByDimension]: AnalyticsUsageI18nKey.TimeSeriesSplitTitle,
  [TimeSeriesView.Cost]: AnalyticsUsageI18nKey.TimeSeriesCostTitle,
  [TimeSeriesView.Latency]: AnalyticsUsageI18nKey.TimeSeriesLatencyTitle,
};

const SUBTITLE_KEY: Record<TimeSeriesView, AnalyticsUsageI18nKey> = {
  [TimeSeriesView.Requests]: AnalyticsUsageI18nKey.TimeSeriesSubtitle,
  [TimeSeriesView.ByDimension]: AnalyticsUsageI18nKey.TimeSeriesSplitSubtitle,
  [TimeSeriesView.Cost]: AnalyticsUsageI18nKey.TimeSeriesCostSubtitle,
  [TimeSeriesView.Latency]: AnalyticsUsageI18nKey.TimeSeriesLatencySubtitle,
};

const formatBucketLabel = (bucketMs: number): string =>
  new Date(bucketMs).toLocaleString(void 0, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/**
 * A spend bar is named by its bin's own width: a bin of a day or more has no hour worth stating,
 * and a shorter one is ambiguous without it.
 */
const formatSpendLabel = (bucketMs: number, resolution: ChartResolution): string =>
  new Date(bucketMs).toLocaleString(
    void 0,
    // A day-wide bin starts at 00:00 UTC and is named in UTC, or west of Greenwich it reads as the
    // previous date with no clock on the axis to show the shift.
    resolution.unit === 'd'
      ? { month: 'short', day: 'numeric', timeZone: 'UTC' }
      : { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  );

const TimeSeries: FC<Props> = ({
  window,
  buckets,
  dimensionBuckets,
  spendBuckets,
  donutRows,
  view,
  dimensionTab,
  resolution,
  timeSeriesView,
  onTimeSeriesViewChange,
}) => {
  const t = useI18n();
  const chartRef = useRef<ReactECharts>(null);
  const plotRef = useRef<HTMLDivElement>(null);

  /**
   * The card is stretched by whatever is tallest in its row, and that arrives after the chart does
   * when this response is the quicker one. ECharts measures its container once at init and only
   * re-measures on a window resize, so a container that grows afterwards leaves the plot at the
   * height it was born with.
   */
  useEffect(() => {
    const plot = plotRef.current;

    if (!plot || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => chartRef.current?.getEchartsInstance()?.resize());
    observer.observe(plot);

    return () => observer.disconnect();
  }, []);
  const [pinnedSeriesIndex, setPinnedSeriesIndex] = useState<number | null>(null);

  /**
   * Picking a legend row picks its band out of the chart. ECharts blurs the rest itself once a
   * series is highlighted, so this dispatches against the live instance rather than rebuilding the
   * options — a rebuild would redraw the whole chart on every pointer move.
   */
  const focusSeries = useCallback((seriesIndex: number | null) => {
    const instance = chartRef.current?.getEchartsInstance();

    if (!instance) {
      return;
    }

    instance.dispatchAction({ type: 'downplay' });

    if (seriesIndex != null) {
      instance.dispatchAction({ type: 'highlight', seriesIndex });
    }
  }, []);

  // A pinned band outlives the pointer, so a hover that ends falls back to it rather than to none.
  const onPreviewSeries = useCallback(
    (seriesIndex: number | null) => focusSeries(seriesIndex ?? pinnedSeriesIndex),
    [focusSeries, pinnedSeriesIndex],
  );

  const onToggleSeries = useCallback(
    (seriesIndex: number) => {
      setPinnedSeriesIndex((current) => {
        const next = current === seriesIndex ? null : seriesIndex;
        focusSeries(next);

        return next;
      });
    },
    [focusSeries],
  );

  // The previous window is carried by the delta figures, not plotted here.
  const points = useMemo(
    () => padBucketPoints(buckets.data ?? [], window, resolution),
    [buckets.data, window, resolution],
  );
  const labels = useMemo(() => points.map((point) => formatBucketLabel(point.bucketMs)), [points]);
  const periods = useMemo(
    () => points.map((point) => formatBucketRange(point.bucketMs, getBucketStepMs(resolution))),
    [points, resolution],
  );
  const bucketLabel = `${resolution.value}${resolution.unit}`;
  const spendResolution = useMemo(() => getSpendResolution(window), [window]);
  const spendBucketLabel = `${spendResolution.value}${spendResolution.unit}`;
  const { from: windowFrom, to: windowTo } = getWindowBounds(window);
  const isEmptyWindow = !buckets.isLoading && (buckets.hasFailed || (buckets.data?.length ?? 0) === 0);
  // Verbatim, never lowercased: a dimension's name can be an acronym, and "MCP name" folded to
  // "mcp name" reads as a typo.
  const dimensionLabel = t(BREAKDOWN_TAB_COLUMN_LABEL_KEY[dimensionTab]);

  const tabs = useMemo(
    () =>
      VIEW_TIME_SERIES_VIEWS[view].map((id) => ({
        id,
        label:
          id === TimeSeriesView.ByDimension
            ? t(AnalyticsUsageI18nKey.TimeSeriesTabSplit, { dimension: dimensionLabel })
            : t(TAB_LABEL_KEY[id]),
      })),
    [view, dimensionLabel, t],
  );

  const onViewTabChange = useCallback(
    (next: TimeSeriesView) => {
      setPinnedSeriesIndex(null);
      onTimeSeriesViewChange(next);
    },
    [onTimeSeriesViewChange],
  );

  const namedRows = useMemo(() => (donutRows.data ?? []).slice(0, DONUT_SLICE_COUNT), [donutRows.data]);

  const stack = useMemo(
    () =>
      buildStackedMatrix(
        points,
        dimensionBuckets.data ?? [],
        namedRows.map((row) => row.id),
      ),
    [points, dimensionBuckets.data, namedRows],
  );

  const { options, legend, isLoading } = useMemo(() => {
    if (timeSeriesView === TimeSeriesView.ByDimension) {
      const series = [
        ...namedRows.map((row, index) => ({
          id: row.id,
          label: row.label || t(BasicI18nKey.NoData),
          color: getSliceColor(index, false),
          values: stack.series[index]?.values ?? [],
        })),
        {
          id: 'other',
          label: t(AnalyticsUsageI18nKey.DonutOther),
          color: getSliceColor(namedRows.length, true),
          values: stack.otherValues,
        },
      ];

      return {
        options: buildSplitSeriesOptions(labels, series, periods),
        // Names and colours only: the share of each band is the share chart's own figure, and a
        // second copy of it under the plot is one more thing to keep in agreement.
        legend: series.map<ChartLegendEntry>((entry, index) => ({
          id: entry.id,
          label: entry.label,
          color: entry.color,
          seriesIndex: index,
        })),
        isLoading: buckets.isLoading || dimensionBuckets.isLoading || donutRows.isLoading,
      };
    }

    if (timeSeriesView === TimeSeriesView.Cost) {
      const bars = spendBuckets.data ?? [];

      return {
        options: buildBarOptions(
          bars.map((bucket) => formatSpendLabel(bucket.bucketMs, spendResolution)),
          bars.map((bucket) => bucket.spend),
          bars.map((bucket) => formatBucketRange(bucket.bucketMs, getBucketStepMs(spendResolution))),
        ),
        legend: [],
        isLoading: spendBuckets.isLoading,
      };
    }

    if (timeSeriesView === TimeSeriesView.Latency) {
      const p50 = points.map((point) => point.measures.p50LatencyMs);
      const p95 = points.map((point) => point.measures.p95LatencyMs);

      return {
        options: buildLatencyOptions(labels, p50, p95, periods),
        legend: [
          { id: 'p50', label: t(AnalyticsUsageI18nKey.TimeSeriesLatencyP50), color: LATENCY_P50_COLOR, seriesIndex: 0 },
          { id: 'p95', label: t(AnalyticsUsageI18nKey.TimeSeriesLatencyP95), color: LATENCY_P95_COLOR, seriesIndex: 1 },
        ],
        isLoading: buckets.isLoading,
      };
    }

    // One band, and the figure it would print is already the Requests card's — a second copy of it
    // computed from the plotted buckets is what made the two disagree.
    return {
      options: buildTimeSeriesOptions(points, formatBucketLabel, periods),
      legend: [],
      isLoading: buckets.isLoading,
    };
  }, [
    timeSeriesView,
    points,
    labels,
    periods,
    stack,
    namedRows,
    spendResolution,
    buckets,
    dimensionBuckets,
    spendBuckets,
    donutRows,
    t,
  ]);

  const renderPlot = () => {
    if (isLoading) {
      return (
        <div className="flex flex-1 items-center justify-center" style={{ minHeight: TIME_SERIES_MIN_HEIGHT }}>
          <DialLoader size={24} />
        </div>
      );
    }

    if (isEmptyWindow) {
      return (
        <div className="relative flex-1" style={{ minHeight: TIME_SERIES_MIN_HEIGHT }}>
          <ReactECharts
            option={buildTimeSeriesOptions([], formatBucketLabel)}
            style={{ height: '100%', minHeight: TIME_SERIES_MIN_HEIGHT, width: '100%' }}
            opts={{ renderer: 'svg' }}
            notMerge
          />
          <UsageEmptyState
            className="absolute inset-0"
            title={t(AnalyticsUsageI18nKey.BreakdownEmptyTitle)}
            lines={[
              t(AnalyticsUsageI18nKey.TimeSeriesEmptyIdle, { from: windowFrom, to: windowTo }),
              t(AnalyticsUsageI18nKey.TimeSeriesEmptyHint),
            ]}
          />
        </div>
      );
    }

    return (
      <>
        <div ref={plotRef} className="shrink-0 flex-1" style={{ height: TIME_SERIES_MIN_HEIGHT }}>
          <ReactECharts
            ref={chartRef}
            option={options}
            style={{ height: '100%', minHeight: TIME_SERIES_MIN_HEIGHT, width: '100%' }}
            opts={{ renderer: 'svg' }}
            notMerge
          />
        </div>
        {legend.length > 0 && (
          <ChartLegend
            entries={legend}
            onPreviewSeries={onPreviewSeries}
            onToggleSeries={onToggleSeries}
            pinnedSeriesIndex={pinnedSeriesIndex}
            className="mt-3"
          />
        )}
      </>
    );
  };

  return (
    <DashboardCard
      // The MCP view holds nothing but tool calls, so the plain plot is named for them rather than
      // for requests it no longer counts. The other tabs name their own measure already.
      title={t(
        view === UsageView.Mcp && timeSeriesView === TimeSeriesView.Requests
          ? AnalyticsUsageI18nKey.TimeSeriesTitleMcp
          : TITLE_KEY[timeSeriesView],
        { dimension: dimensionLabel },
      )}
      subtitle={
        isEmptyWindow
          ? t(AnalyticsUsageI18nKey.TimeSeriesEmptySubtitle, { range: `${windowFrom} – ${windowTo}` })
          : t(
              view === UsageView.Mcp && timeSeriesView === TimeSeriesView.Requests
                ? AnalyticsUsageI18nKey.TimeSeriesSubtitleMcp
                : SUBTITLE_KEY[timeSeriesView],
              {
                // Spend reads its own, coarser bin; every other tab reads the page's.
                bucket: timeSeriesView === TimeSeriesView.Cost ? spendBucketLabel : bucketLabel,
                count: String(DONUT_SLICE_COUNT),
              },
            )
      }
      headerActions={
        <TabSelector
          tabs={tabs}
          activeTab={timeSeriesView}
          onChange={(next) => onViewTabChange(next as TimeSeriesView)}
        />
      }
      className="flex-[3_1_560px]"
    >
      {renderPlot()}
    </DashboardCard>
  );
};

export default TimeSeries;
