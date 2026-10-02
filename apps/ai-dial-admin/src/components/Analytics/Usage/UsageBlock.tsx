'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import BreakdownTable from '@/src/components/Analytics/Usage/Breakdown/BreakdownTable';
import RowDetailPanel from '@/src/components/Analytics/Usage/Breakdown/RowDetailPanel';
import ActivityHeatmap from '@/src/components/Analytics/Usage/Charts/ActivityHeatmap';
import ShareBreakdown from '@/src/components/Analytics/Usage/Charts/ShareBreakdown';
import TimeSeries from '@/src/components/Analytics/Usage/Charts/TimeSeries';
import KpiRow from '@/src/components/Analytics/Usage/Kpi/KpiRow';
import {
  BREAKDOWN_PAGE_SIZE,
  DIALOG_BLOCK_SIZE,
  DONUT_CARD_ROW_LIMIT,
  QUERY_ROW_LIMIT,
  VIEW_TIME_SERIES_VIEWS,
} from '@/src/components/Analytics/Usage/constants';
import {
  BreakdownRowModel,
  BreakdownTab,
  ComparePeriod,
  DonutMetric,
  TimeSeriesView,
  UsageScope,
  UsageView,
} from '@/src/components/Analytics/Usage/models';
import { useHeatmapWeek } from '@/src/components/Analytics/Usage/use-heatmap-week';
import { LoadFailureNotice } from '@/src/components/Analytics/Usage/use-load-failure-notice';
import { useUsageDashboardData } from '@/src/components/Analytics/Usage/use-usage-dashboard-data';
import { UsageWindows } from '@/src/components/Analytics/Usage/use-usage-windows';

interface Props extends UsageWindows {
  view: UsageView;
  scope: UsageScope;
  /** The breakdown tabs this block offers; the first leads the share chart and the split plot. */
  tabs: BreakdownTab[];
  compare: ComparePeriod;
  refreshToken: number;
  notice: LoadFailureNotice;
  onRefreshingChange: (isRefreshing: boolean) => void;
}

/**
 * One view's widgets — KPI row, time series, share chart, heatmap, breakdown — over the windows a
 * page hands it. The page owns the period, the comparison and the refresh; the block owns what the
 * reader picks inside it.
 */
const UsageBlock: FC<Props> = ({
  view,
  scope,
  tabs,
  windows,
  resolution,
  compare,
  refreshToken,
  notice,
  onRefreshingChange,
}) => {
  const leadingTab = tabs[0];

  const [tab, setTab] = useState<BreakdownTab>(leadingTab);
  const [isShowingAll, setIsShowingAll] = useState(false);
  const [donutMetric, setDonutMetric] = useState<DonutMetric>(DonutMetric.Calls);
  const [isDonutFullOpen, setIsDonutFullOpen] = useState(false);
  // Blocks of the donut's dimension read so far. The dialog starts at one and grows as its legend
  // is scrolled; the card never reads more than its five slices.
  const [donutBlocks, setDonutBlocks] = useState(1);
  const [timeSeriesView, setTimeSeriesView] = useState<TimeSeriesView>(TimeSeriesView.Requests);
  const [selectedRow, setSelectedRow] = useState<BreakdownRowModel | null>(null);

  // A new view is a new set of tabs and figures. Reset while rendering rather than in an effect, so
  // the first requests of the new view are not issued with the old view's tab.
  const [renderedView, setRenderedView] = useState(view);
  if (renderedView !== view) {
    setRenderedView(view);
    // The MCP view prices nothing, so a cost ring there would be empty whatever the window.
    setDonutMetric(DonutMetric.Calls);
    setTab(leadingTab);
    setTimeSeriesView((current) =>
      VIEW_TIME_SERIES_VIEWS[view].includes(current) ? current : VIEW_TIME_SERIES_VIEWS[view][0],
    );
    setIsShowingAll(false);
    setSelectedRow(null);
  }

  const rowLimit = BREAKDOWN_PAGE_SIZE;

  const donutLimit = isDonutFullOpen
    ? Math.min(donutBlocks * DIALOG_BLOCK_SIZE, QUERY_ROW_LIMIT)
    : DONUT_CARD_ROW_LIMIT;

  const {
    totals,
    previousTotals,
    buckets,
    donutRows,
    donutRowsMetric,
    dimensionBuckets,
    spendBuckets,
    tabRows,
    previousTabRows,
    isDonutReadingMore,
    isRefreshing,
  } = useUsageDashboardData({
    view,
    scope,
    windows,
    resolution,
    tab,
    leadingTab,
    tabLimit: rowLimit,
    donutLimit,
    donutMetric,
    timeSeriesView,
    refreshToken,
    notice,
  });

  useEffect(() => {
    onRefreshingChange(isRefreshing);
  }, [isRefreshing, onRefreshingChange]);

  const heatmap = useHeatmapWeek({ view, scope, refreshToken, notice });

  const windowTotalCalls = totals.data?.calls ?? null;

  const onTabChange = useCallback((next: BreakdownTab) => {
    setTab(next);
    setIsShowingAll(false);
    setSelectedRow(null);
  }, []);

  const onShowDonutAll = useCallback(() => {
    setDonutBlocks(1);
    setIsDonutFullOpen(true);
  }, []);

  const onLoadMoreDonutRows = useCallback(() => setDonutBlocks((blocks) => blocks + 1), []);

  const onHideAll = useCallback(() => setIsShowingAll(false), []);

  return (
    <>
      <KpiRow view={view} totals={totals} previousTotals={previousTotals} buckets={buckets} compare={compare} />

      <div className="flex shrink-0 flex-wrap items-stretch gap-3">
        <TimeSeries
          view={view}
          window={windows.current}
          buckets={buckets}
          dimensionBuckets={dimensionBuckets}
          spendBuckets={spendBuckets}
          donutRows={donutRows}
          dimensionTab={leadingTab}
          resolution={resolution}
          timeSeriesView={timeSeriesView}
          onTimeSeriesViewChange={setTimeSeriesView}
        />
        <ShareBreakdown
          rows={donutRows}
          tab={leadingTab}
          view={view}
          metric={donutMetric}
          renderedMetric={donutRowsMetric}
          onMetricChange={setDonutMetric}
          windowTotalCalls={windowTotalCalls}
          windowTotalSpend={totals.data?.spend ?? null}
          isFullOpen={isDonutFullOpen}
          // A response filled to the limit is the signal that the window holds further rows — but
          // only while the limit can still grow: at the query surface's own ceiling it never will,
          // and offering to read on would scroll against a wall.
          hasMoreRows={donutLimit < QUERY_ROW_LIMIT && (donutRows.data?.length ?? 0) >= donutLimit}
          isReadingMore={isDonutReadingMore}
          onLoadMoreRows={onLoadMoreDonutRows}
          onShowAll={onShowDonutAll}
          onHideAll={() => setIsDonutFullOpen(false)}
        />
      </div>

      <ActivityHeatmap heatmap={heatmap} view={view} />

      <BreakdownTable
        view={view}
        scope={scope}
        tabs={tabs}
        tab={tab}
        onTabChange={onTabChange}
        rows={tabRows}
        previousRows={previousTabRows}
        windowTotal={windowTotalCalls}
        windows={windows}
        rowLimit={rowLimit}
        isShowingAll={isShowingAll}
        onShowAll={() => setIsShowingAll(true)}
        onHideAll={onHideAll}
        onOpenRow={setSelectedRow}
        notice={notice}
      />

      <RowDetailPanel row={selectedRow} onClose={() => setSelectedRow(null)} />
    </>
  );
};

export default UsageBlock;
