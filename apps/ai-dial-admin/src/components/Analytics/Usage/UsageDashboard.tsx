'use client';

import { FC, useCallback, useMemo, useRef, useState } from 'react';

import BreakdownTable from '@/src/components/Analytics/Usage/Breakdown/BreakdownTable';
import RowDetailPanel from '@/src/components/Analytics/Usage/Breakdown/RowDetailPanel';
import ActivityHeatmap from '@/src/components/Analytics/Usage/Charts/ActivityHeatmap';
import ShareBreakdown from '@/src/components/Analytics/Usage/Charts/ShareBreakdown';
import TimeSeries from '@/src/components/Analytics/Usage/Charts/TimeSeries';
import UsageControls from '@/src/components/Analytics/Usage/Controls/UsageControls';
import KpiRow from '@/src/components/Analytics/Usage/Kpi/KpiRow';
import {
  BREAKDOWN_FULL_PAGE_SIZE,
  BREAKDOWN_PAGE_SIZE,
  DONUT_CARD_ROW_LIMIT,
  DONUT_FULL_ROW_LIMIT,
  SEARCH_DEBOUNCE_MS,
  VIEW_BREAKDOWN_TABS,
  VIEW_TIME_SERIES_VIEWS,
} from '@/src/components/Analytics/Usage/constants';
import {
  BreakdownRowModel,
  BreakdownTab,
  ComparePeriod,
  TimeSeriesView,
  UsageView,
} from '@/src/components/Analytics/Usage/models';
import { useDebouncedValue } from '@/src/components/Analytics/Usage/use-debounced-value';
import { useHeatmapWeek } from '@/src/components/Analytics/Usage/use-heatmap-week';
import { useLoadFailureNotice } from '@/src/components/Analytics/Usage/use-load-failure-notice';
import { useUsageDashboardData } from '@/src/components/Analytics/Usage/use-usage-dashboard-data';
import { buildComparedWindows } from '@/src/components/Analytics/Usage/utils/windows';
import { AnalyticsUsageI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useTimeFilter } from '@/src/hooks/use-time-filter';
import { useI18n } from '@/src/locales/client';
import { getChartResolution } from '@/src/utils/time-filter/get-chart-resolution';

const UsageDashboard: FC = () => {
  const t = useI18n();

  const [view, setView] = useState<UsageView>(UsageView.Llm);
  const [compare, setCompare] = useState<ComparePeriod>(ComparePeriod.PreviousPeriod);
  const [tab, setTab] = useState<BreakdownTab>(VIEW_BREAKDOWN_TABS[UsageView.Llm][0]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [isShowingAll, setIsShowingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDonutFullOpen, setIsDonutFullOpen] = useState(false);
  const [timeSeriesView, setTimeSeriesView] = useState<TimeSeriesView>(TimeSeriesView.Requests);
  const [selectedRow, setSelectedRow] = useState<BreakdownRowModel | null>(null);

  const { timePeriod, timeRange, isCustom, getCurrentTimeRange, onTimePeriodChange, onTimeRangeChange } =
    useTimeFilter();

  // One notice for the page: a failure that reaches both hooks is still one thing that went wrong.
  const notice = useLoadFailureNotice(t(AnalyticsUsageI18nKey.LoadFailed));

  // A preset range is computed from the clock, so calling the getter during render would produce a
  // new window on every pass and re-issue every request forever. The window is a snapshot instead,
  // re-taken only when an input to it changes — seeding state and then re-taking it in an effect
  // gave every mount two windows, and so two of every request.
  const getRangeRef = useRef(getCurrentTimeRange);
  getRangeRef.current = getCurrentTimeRange;

  const [windowSnapshot, setWindowSnapshot] = useState(() => getCurrentTimeRange());
  // `isCustom` decides which range the getter reads, so switching to a custom range has to re-take
  // the snapshot even when the period id is unchanged.
  const snapshotKey = [
    timePeriod,
    isCustom,
    timeRange.startDate.getTime(),
    timeRange.endDate.getTime(),
    refreshToken,
  ].join('|');
  const takenKey = useRef(snapshotKey);

  if (takenKey.current !== snapshotKey) {
    takenKey.current = snapshotKey;
    setWindowSnapshot(getRangeRef.current());
  }

  const windows = useMemo(() => buildComparedWindows(windowSnapshot, compare), [windowSnapshot, compare]);

  const resolution = useMemo(() => getChartResolution(windows.current), [windows]);

  const rowLimit = isShowingAll ? BREAKDOWN_FULL_PAGE_SIZE : BREAKDOWN_PAGE_SIZE;

  const debouncedSearchTerm = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);

  const {
    totals,
    previousTotals,
    buckets,
    donutRows,
    dimensionBuckets,
    spendPeriods,
    tabRows,
    previousTabRows,
    isRefreshing,
  } = useUsageDashboardData({
    view,
    windows,
    resolution,
    tab,
    tabLimit: rowLimit,
    tabSearch: debouncedSearchTerm || void 0,
    donutLimit: isDonutFullOpen ? DONUT_FULL_ROW_LIMIT : DONUT_CARD_ROW_LIMIT,
    timeSeriesView,
    refreshToken,
    notice,
  });

  const heatmap = useHeatmapWeek({ view, refreshToken, notice });

  const windowTotalCalls = totals.data?.calls ?? null;
  const donutTab = VIEW_BREAKDOWN_TABS[view][0];

  const onViewChange = useCallback((next: UsageView) => {
    setView(next);
    setTab(VIEW_BREAKDOWN_TABS[next][0]);
    setTimeSeriesView((current) =>
      VIEW_TIME_SERIES_VIEWS[next].includes(current) ? current : VIEW_TIME_SERIES_VIEWS[next][0],
    );
    setSearchTerm('');
    setIsShowingAll(false);
    setSelectedRow(null);
  }, []);

  const onTabChange = useCallback((next: BreakdownTab) => {
    setTab(next);
    setSearchTerm('');
    setIsShowingAll(false);
    setSelectedRow(null);
  }, []);

  const onRefresh = useCallback(() => setRefreshToken((token) => token + 1), []);

  const onHideAll = useCallback(() => setIsShowingAll(false), []);

  return (
    // The widgets scroll inside this panel, so the cards keep a gutter the scrollbar can sit in
    // instead of being drawn over their right edge.
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-auto px-3">
      <h1>{t(MenuI18nKey.AnalyticsUsage)}</h1>

      <UsageControls
        view={view}
        onViewChange={onViewChange}
        compare={compare}
        onCompareChange={setCompare}
        timePeriod={timePeriod}
        onTimePeriodChange={onTimePeriodChange}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
      />

      <KpiRow
        view={view}
        totals={totals}
        previousTotals={previousTotals}
        buckets={buckets}
        isComparisonOn={!!windows.previous}
      />

      <div className="flex shrink-0 flex-wrap items-stretch gap-3">
        <TimeSeries
          view={view}
          window={windows.current}
          buckets={buckets}
          dimensionBuckets={dimensionBuckets}
          spendPeriods={spendPeriods}
          donutRows={donutRows}
          dimensionTab={donutTab}
          resolution={resolution}
          timeSeriesView={timeSeriesView}
          onTimeSeriesViewChange={setTimeSeriesView}
        />
        <ShareBreakdown
          rows={donutRows}
          tab={donutTab}
          windowTotal={windowTotalCalls}
          isFullOpen={isDonutFullOpen}
          onShowAll={() => setIsDonutFullOpen(true)}
          onHideAll={() => setIsDonutFullOpen(false)}
        />
      </div>

      <ActivityHeatmap heatmap={heatmap} />

      <BreakdownTable
        view={view}
        tab={tab}
        onTabChange={onTabChange}
        rows={tabRows}
        previousRows={previousTabRows}
        windowTotal={windowTotalCalls}
        hasComparison={!!windows.previous}
        window={windows.current}
        rowLimit={rowLimit}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isShowingAll={isShowingAll}
        onShowAll={() => setIsShowingAll(true)}
        onHideAll={onHideAll}
        onOpenRow={setSelectedRow}
      />

      <RowDetailPanel row={selectedRow} onClose={() => setSelectedRow(null)} />
    </div>
  );
};

export default UsageDashboard;
