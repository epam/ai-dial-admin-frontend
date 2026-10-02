'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

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
  BlockReads,
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
import { resolveBlockRows } from '@/src/components/Analytics/Usage/utils/entity-blocks';
import { isPricedView } from '@/src/components/Analytics/Usage/utils/views';

const NO_MADE_TABS: BreakdownTab[] = [];

interface Props extends UsageWindows {
  view: UsageView;
  scope: UsageScope;
  /** Where each figure is read from; absent on the page, which reads one set of rows for all of them. */
  reads?: BlockReads;
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
  reads,
  tabs,
  windows,
  resolution,
  compare,
  refreshToken,
  notice,
  onRefreshingChange,
}) => {
  const leadingTab = tabs[0];
  const madeTabs = reads?.madeTabs ?? NO_MADE_TABS;
  const { rows, madeRows } = useMemo(() => resolveBlockRows(scope, reads), [scope, reads]);

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
    madeTotals,
    previousMadeTotals,
    isDonutReadingMore,
    isRefreshing,
  } = useUsageDashboardData({
    view,
    rows,
    madeRows,
    madeTabs,
    isMoneyFromMade: Boolean(reads?.isMoneyFromMade),
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

  const heatmap = useHeatmapWeek({ view, rows, refreshToken, notice });

  // A tab read from the calls the entity made states its shares of those calls: a share of the
  // entity's own requests would read past a hundred per cent wherever one request fanned out.
  const isMadeTab = (of: BreakdownTab) => madeRows != null && madeTabs.includes(of);
  const totalsOf = (of: BreakdownTab) => (isMadeTab(of) ? madeTotals : totals);
  const donutTotals = totalsOf(leadingTab).data;
  const tabTotals = totalsOf(tab).data;
  const isMoneyFromMade = Boolean(reads?.isMoneyFromMade && madeRows);
  const moneyTotals = useMemo(
    () => (isMoneyFromMade ? { current: madeTotals, previous: previousMadeTotals } : void 0),
    [isMoneyFromMade, madeTotals, previousMadeTotals],
  );

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
      <KpiRow
        view={view}
        totals={totals}
        previousTotals={previousTotals}
        buckets={buckets}
        compare={compare}
        madeTotals={moneyTotals}
      />

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
          windowTotalCalls={donutTotals?.calls ?? null}
          windowTotalSpend={donutTotals?.spend ?? null}
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

      {/* Its hourly response is over the entity's own calls; a block counting money on its call tree
          offers no cost there rather than paint a second basis beside the cards. */}
      <ActivityHeatmap heatmap={heatmap} view={view} isCostOffered={isPricedView(view) && !isMoneyFromMade} />

      <BreakdownTable
        view={view}
        rowScope={madeRows && isMadeTab(tab) ? madeRows : rows}
        tabs={tabs}
        tab={tab}
        onTabChange={onTabChange}
        rows={tabRows}
        previousRows={previousTabRows}
        windowTotal={tabTotals?.calls ?? null}
        windows={windows}
        rowLimit={rowLimit}
        isShowingAll={isShowingAll}
        onShowAll={() => setIsShowingAll(true)}
        onHideAll={onHideAll}
        onOpenRow={setSelectedRow}
        notice={notice}
        // An application's own calls carry no price of their own, so where its money is read from its
        // call tree, a tab ranking its own calls has no cost to state.
        isCostOffered={isPricedView(view) && (!isMoneyFromMade || isMadeTab(tab))}
      />

      <RowDetailPanel row={selectedRow} onClose={() => setSelectedRow(null)} />
    </>
  );
};

export default UsageBlock;
