'use client';

import { FC, useCallback, useMemo } from 'react';

import { ColDef } from 'ag-grid-community';
import { DialLinkButton, ElementSize, Popup, PopupSize, Search } from '@epam/ai-dial-ui-kit';

import BreakdownGrid from '@/src/components/Analytics/Usage/Breakdown/BreakdownGrid';
import DeltaCell from '@/src/components/Analytics/Usage/Breakdown/cells/DeltaCell';
import DimensionCell from '@/src/components/Analytics/Usage/Breakdown/cells/DimensionCell';
import ShareCell from '@/src/components/Analytics/Usage/Breakdown/cells/ShareCell';
import DashboardCard from '@/src/components/Analytics/Usage/Card/DashboardCard';
import { VIEW_BREAKDOWN_TABS } from '@/src/components/Analytics/Usage/constants';
import {
  BreakdownRow,
  BreakdownRowModel,
  BreakdownTab,
  RequestState,
  UsageView,
} from '@/src/components/Analytics/Usage/models';
import { formatDuration, formatPercent, getWindowBounds } from '@/src/components/Analytics/Usage/utils/format';
import { getShareOfTotal } from '@/src/components/Analytics/Usage/utils/kpi-cards';
import {
  BREAKDOWN_TAB_COLUMN_LABEL_KEY,
  BREAKDOWN_TAB_LABEL_KEY,
  getFallbackLabelKey,
  getFallbackTooltipKey,
} from '@/src/components/Analytics/Usage/utils/labels';
import TabSelector from '@/src/components/Common/TabSelector/TabSelector';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TimeRange } from '@/src/models/time-range';

/**
 * The card holds one ranked page from the backend, so its grid offers neither sorting nor its own
 * per-column filters: both would only reorder or sift what that page happens to hold, while hiding
 * that the rest of the dimension was never fetched. The dialog holds the full list, where sifting
 * it is exactly the point — so it turns the filters back on for the columns whose cells are plain
 * values rather than rendered bars.
 */
const BREAKDOWN_COLUMN_BASE: ColDef<BreakdownRowModel> = {
  sortable: false,
  filter: false,
  floatingFilter: false,
  suppressHeaderMenuButton: true,
};

const FILTERABLE_COLUMN: ColDef<BreakdownRowModel> = {
  filter: true,
  floatingFilter: true,
  suppressHeaderMenuButton: false,
};

interface Props {
  view: UsageView;
  tab: BreakdownTab;
  onTabChange: (tab: BreakdownTab) => void;
  rows: RequestState<BreakdownRow[]>;
  previousRows: RequestState<BreakdownRow[]>;
  windowTotal: number | null;
  hasComparison: boolean;
  /** Named in the empty state, so the table says which window held nothing. */
  window: TimeRange;
  rowLimit: number;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  isShowingAll: boolean;
  onShowAll: () => void;
  onHideAll: () => void;
  onOpenRow: (row: BreakdownRowModel) => void;
}

const BreakdownTable: FC<Props> = ({
  view,
  tab,
  onTabChange,
  rows,
  previousRows,
  windowTotal,
  hasComparison,
  window,
  rowLimit,
  searchTerm,
  onSearchChange,
  isShowingAll,
  onShowAll,
  onHideAll,
  onOpenRow,
}) => {
  const t = useI18n();

  const tabs = useMemo(
    () => VIEW_BREAKDOWN_TABS[view].map((option) => ({ id: option, label: t(BREAKDOWN_TAB_LABEL_KEY[option]) })),
    [view, t],
  );

  const rowModels = useMemo<BreakdownRowModel[]>(() => {
    const fallbackLabelKey = getFallbackLabelKey(tab);
    const fallbackTooltipKey = getFallbackTooltipKey(tab, view);
    const previousData = previousRows.data ?? [];
    const previousByLabel = new Map(previousData.map((row) => [row.id, row.measures.calls]));

    /**
     * What the previous window says about a row that is not in its response.
     *
     * Nothing, unless that response is the whole dimension. A window that recorded nothing at all
     * makes every row look new, and a response cut at the page size hides a row that was merely
     * ranked below the cut — in both cases the honest answer is that there is no comparison, not
     * that the row appeared for the first time.
     */
    const missingPrevious = previousData.length > 0 && previousData.length < rowLimit ? 0 : null;

    return (rows.data ?? []).map((row) => {
      const calls = row.measures.calls;
      const previous = hasComparison ? (previousByLabel.get(row.id) ?? missingPrevious) : null;

      return {
        id: row.id,
        displayLabel: row.isFallbackLabel && fallbackLabelKey ? t(fallbackLabelKey) : row.label,
        isFallbackLabel: row.isFallbackLabel,
        fallbackTooltip: fallbackTooltipKey ? t(fallbackTooltipKey) : void 0,
        calls,
        share: getShareOfTotal(calls, windowTotal),
        deltaRatio: previous == null || previous === 0 ? null : (calls - previous) / previous,
        isNewRow: previous === 0 && calls > 0,
        errorRate: calls === 0 ? null : row.measures.failed / calls,
        avgLatencyMs: row.measures.avgLatencyMs,
      };
    });
  }, [rows.data, previousRows.data, tab, view, windowTotal, hasComparison, rowLimit, t]);

  const buildColumnDefs = useCallback(
    (hasFilters: boolean): ColDef<BreakdownRowModel>[] => {
      const filterable = hasFilters ? FILTERABLE_COLUMN : {};
      const columns: ColDef<BreakdownRowModel>[] = [
        {
          ...BREAKDOWN_COLUMN_BASE,
          ...filterable,
          colId: 'dimension',
          field: 'displayLabel',
          headerName: t(BREAKDOWN_TAB_COLUMN_LABEL_KEY[tab]),
          flex: 2,
          minWidth: 200,
          cellRenderer: DimensionCell,
          cellRendererParams: { onOpenRow },
        },
        {
          ...BREAKDOWN_COLUMN_BASE,
          colId: 'share',
          headerName: t(AnalyticsUsageI18nKey.ColumnShareOfCalls),
          flex: 3,
          minWidth: 200,
          cellRenderer: ShareCell,
        },
        {
          ...BREAKDOWN_COLUMN_BASE,
          ...filterable,
          colId: 'calls',
          headerName: t(AnalyticsUsageI18nKey.ColumnCalls),
          width: 100,
          // Rows arrive ranked by the backend; the header states that order rather than offering another.
          sort: 'desc',
          cellClass: 'align-right',
          valueGetter: (params) => params.data?.calls ?? 0,
        },
        {
          ...BREAKDOWN_COLUMN_BASE,
          ...filterable,
          colId: 'errors',
          headerName: t(AnalyticsUsageI18nKey.ColumnErrorRate),
          width: 100,
          cellClass: 'align-right',
          valueGetter: (params) => (params.data?.errorRate == null ? '—' : formatPercent(params.data.errorRate, 1)),
        },
        {
          ...BREAKDOWN_COLUMN_BASE,
          ...filterable,
          colId: 'latency',
          headerName: t(AnalyticsUsageI18nKey.ColumnAvgLatency),
          width: 120,
          cellClass: 'align-right',
          valueGetter: (params) => {
            if (params.data?.avgLatencyMs == null) {
              return '—';
            }
            const formatted = formatDuration(params.data.avgLatencyMs);
            return `${formatted.value}${formatted.unit ?? ''}`;
          },
        },
      ];

      if (hasComparison) {
        columns.push({
          ...BREAKDOWN_COLUMN_BASE,
          colId: 'delta',
          headerName: t(AnalyticsUsageI18nKey.ColumnDeltaVsPrev),
          width: 110,
          cellClass: 'align-right',
          cellRenderer: DeltaCell,
        });
      }

      return columns;
    },
    [tab, hasComparison, onOpenRow, t],
  );

  const cardColumnDefs = useMemo(() => buildColumnDefs(false), [buildColumnDefs]);
  const dialogColumnDefs = useMemo(() => buildColumnDefs(true), [buildColumnDefs]);

  const columnLabel = t(BREAKDOWN_TAB_COLUMN_LABEL_KEY[tab]);
  const searchPlaceholder = t(AnalyticsUsageI18nKey.SearchPlaceholder, { dimension: columnLabel });
  const { from: windowFrom, to: windowTo } = getWindowBounds(window);
  const emptyTitle = searchTerm
    ? t(AnalyticsUsageI18nKey.SearchNoMatches, { term: searchTerm })
    : t(AnalyticsUsageI18nKey.BreakdownEmptyTitle);
  // The same pair the time series states, so the two widgets explain one empty window once.
  const emptyLines = searchTerm
    ? void 0
    : [
        t(AnalyticsUsageI18nKey.TimeSeriesEmptyIdle, { from: windowFrom, to: windowTo }),
        t(AnalyticsUsageI18nKey.TimeSeriesEmptyHint),
      ];

  const grid = (
    <BreakdownGrid
      rows={rowModels}
      columnDefs={cardColumnDefs}
      isLoading={rows.isLoading}
      hasFailed={rows.hasFailed}
      emptyTitle={emptyTitle}
      emptyLines={emptyLines}
      className="h-[320px]"
    />
  );

  return (
    <DashboardCard
      title={t(AnalyticsUsageI18nKey.BreakdownTitle)}
      titleActions={
        /* Search travels with the tabs, so a header that wraps keeps the two controls acting on the
           same rows together on the line below the title. */
        <div className="flex min-w-0 flex-nowrap items-center gap-3">
          {/* Shrinks ahead of the tabs, so the pair stays on one line on a narrow card. */}
          <div className="min-w-[120px] max-w-[220px] flex-1 basis-[220px]">
            <Search
              id="breakdown-search"
              size={ElementSize.Small}
              value={searchTerm}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              onChange={(next) => onSearchChange(next ?? '')}
            />
          </div>
          <div className="shrink-0">
            <TabSelector tabs={tabs} activeTab={tab} onChange={(next) => onTabChange(next as BreakdownTab)} />
          </div>
        </div>
      }
      headerActions={
        /* `self-start` keeps this on the title's line once the controls beside the title wrap. */
        rowModels.length > 0 && (
          <div className="shrink-0 self-start">
            {/* The card shows one page, the dialog the full list — a count here would name the page. */}
            <DialLinkButton label={t(AnalyticsUsageI18nKey.ViewAll)} onClick={onShowAll} />
          </div>
        )
      }
    >
      {grid}

      <Popup
        open={isShowingAll}
        size={PopupSize.Lg}
        header={t(AnalyticsUsageI18nKey.BreakdownFullListHeader, { dimension: columnLabel })}
        onClose={onHideAll}
      >
        <BreakdownGrid
          rows={rowModels}
          columnDefs={dialogColumnDefs}
          isLoading={rows.isLoading}
          hasFailed={rows.hasFailed}
          emptyTitle={emptyTitle}
          emptyLines={emptyLines}
          className="h-[70vh] px-6 pb-4"
        />
      </Popup>
    </DashboardCard>
  );
};

export default BreakdownTable;
