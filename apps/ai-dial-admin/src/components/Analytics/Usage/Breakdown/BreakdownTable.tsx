'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { ColDef } from 'ag-grid-community';
import { DialLinkButton, ElementSize, Popup, PopupSize, Search } from '@epam/ai-dial-ui-kit';

import BreakdownGrid from '@/src/components/Analytics/Usage/Breakdown/BreakdownGrid';
import DimensionCell from '@/src/components/Analytics/Usage/Breakdown/cells/DimensionCell';
import MeasureCell, { MeasureCellParams } from '@/src/components/Analytics/Usage/Breakdown/cells/MeasureCell';
import ShareCell from '@/src/components/Analytics/Usage/Breakdown/cells/ShareCell';
import DashboardCard from '@/src/components/Analytics/Usage/Card/DashboardCard';
import {
  BREAKDOWN_CARD_HEIGHT,
  BREAKDOWN_CARD_SCROLL_AFTER_ROWS,
  DIALOG_BLOCK_SIZE,
  ROUTE_KIND_TABS,
  SEARCH_DEBOUNCE_MS,
} from '@/src/components/Analytics/Usage/constants';
import {
  BreakdownRow,
  BreakdownRowModel,
  BreakdownTab,
  ComparedWindows,
  KpiMetric,
  RequestState,
  RowScope,
  UsageView,
} from '@/src/components/Analytics/Usage/models';
import { useBreakdownDialogRows } from '@/src/components/Analytics/Usage/use-breakdown-dialog-rows';
import { useDebouncedValue } from '@/src/components/Analytics/Usage/use-debounced-value';
import { LoadFailureNotice } from '@/src/components/Analytics/Usage/use-load-failure-notice';
import {
  formatDuration,
  formatGroupedMoney,
  formatGroupedNumber,
  formatPercent,
} from '@/src/components/Analytics/Usage/utils/format';
import {
  readMissingPreviousEmpty,
  toPreviousMeasures,
  toRowModels,
} from '@/src/components/Analytics/Usage/utils/row-models';
import {
  BREAKDOWN_TAB_COLUMN_LABEL_KEY,
  BREAKDOWN_TAB_DESCRIPTION_KEY,
  BREAKDOWN_TAB_LABEL_KEY,
  formatDeploymentName,
  getFallbackLabelKey,
  getFallbackTooltipKey,
  isFallbackRowPinnedLast,
  ROUTE_KIND_LABEL_KEY,
} from '@/src/components/Analytics/Usage/utils/labels';
import { SORTABLE_DIALOG_COLUMNS } from '@/src/components/Analytics/Usage/utils/dialog-sort';
import { getRouteKind, getRowRouteOwner } from '@/src/components/Analytics/Usage/utils/routes';
import { isPricedView } from '@/src/components/Analytics/Usage/utils/views';
import TabSelector from '@/src/components/Common/TabSelector/TabSelector';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const BREAKDOWN_COLUMN_BASE: ColDef<BreakdownRowModel> = {
  sortable: false,
  filter: false,
  floatingFilter: false,
  suppressHeaderMenuButton: true,
  cellClass: 'column-divider',
};

const EXACT_FRACTION_DIGITS = 4;

const MEASURE_COLUMN_BASE: ColDef<BreakdownRowModel> = {
  ...BREAKDOWN_COLUMN_BASE,
  flex: 1,
  minWidth: 170,
  cellClass: ['align-right', 'column-divider'],
  headerClass: 'align-right',
};

interface Props {
  view: UsageView;
  /** The rows the active tab ranks; the full-list dialog reads the same. */
  rowScope: RowScope;
  /** The tabs offered, in order. */
  tabs: BreakdownTab[];
  tab: BreakdownTab;
  onTabChange: (tab: BreakdownTab) => void;
  rows: RequestState<BreakdownRow[]>;
  previousRows: RequestState<BreakdownRow[]>;
  windowTotal: number | null;
  /** The card's own window is named in the empty state; the previous one decides the delta column. */
  windows: ComparedWindows;
  rowLimit: number;
  isShowingAll: boolean;
  onShowAll: () => void;
  onHideAll: () => void;
  /** The dialog reads its own blocks, so it reports its own failures. */
  notice: LoadFailureNotice;
  /** Overrides the view's own answer; absent, a priced view states cost. */
  isCostOffered?: boolean;
}

const BreakdownTable: FC<Props> = ({
  view,
  rowScope,
  tabs: tabIds,
  tab,
  onTabChange,
  rows,
  previousRows,
  windowTotal,
  windows,
  rowLimit,
  isShowingAll,
  onShowAll,
  onHideAll,
  notice,
  isCostOffered: isCostOfferedOverride,
}) => {
  const t = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const settledTerm = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);
  const hasComparison = Boolean(windows.previous);
  const isCostOffered = isCostOfferedOverride ?? isPricedView(view);

  const tabs = useMemo(
    () => tabIds.map((option) => ({ id: option, label: t(BREAKDOWN_TAB_LABEL_KEY[option]) })),
    [tabIds, t],
  );

  const fallbackLabelKey = getFallbackLabelKey(tab);
  const fallbackTooltipKey = getFallbackTooltipKey(tab, view);
  const fallbackLabel = fallbackLabelKey ? t(fallbackLabelKey) : void 0;
  const fallbackTooltip = fallbackTooltipKey ? t(fallbackTooltipKey) : void 0;
  const isFallbackPinnedLast = isFallbackRowPinnedLast(tab);

  /**
   * The counted form is what the rows looked like before the tab grouped by server, and it is kept
   * for any tab that still aggregates names.
   */
  const readSubLabel = useCallback(
    (names: string[], count: number | null) => {
      const readable = names.map(formatDeploymentName);

      if (readable.length === 1 && (count ?? 1) === 1) {
        return { text: readable[0] };
      }

      return {
        text: t(AnalyticsUsageI18nKey.ToolServerCount, { count: String(count ?? readable.length) }),
        tooltip: readable.join(', '),
      };
    },
    [t],
  );

  /**
   * A route path's row is one path on one owner under one method; its sub-label names the last two.
   * The owner is stated as the `Owners` tab states it, so the two tabs name one owner alike.
   */
  const readQualifierSubLabel = useMemo(
    () => (tab === BreakdownTab.Paths ? ([owner, method]: string[]) => ({ text: `${method} · ${owner}` }) : void 0),
    [tab],
  );

  const readRouteKind = useMemo(() => {
    if (!ROUTE_KIND_TABS.includes(tab)) {
      return void 0;
    }

    return (row: BreakdownRow) => {
      const owner = getRowRouteOwner(tab, row);

      return owner ? getRouteKind(owner) : null;
    };
  }, [tab]);

  const rowModels = useMemo<BreakdownRowModel[]>(() => {
    const previousData = previousRows.data ?? [];

    return toRowModels(rows.data ?? [], {
      windowTotal,
      fallbackLabel,
      fallbackTooltip,
      hasComparison,
      previousMeasures: toPreviousMeasures(previousData),
      isMissingPreviousEmpty: readMissingPreviousEmpty(previousData, rowLimit),
      isFallbackPinnedLast,
      readSubLabel,
      readQualifierSubLabel,
      readRouteKind,
    });
  }, [
    rows.data,
    previousRows.data,
    windowTotal,
    hasComparison,
    rowLimit,
    fallbackLabel,
    fallbackTooltip,
    isFallbackPinnedLast,
    readSubLabel,
    readQualifierSubLabel,
    readRouteKind,
  ]);

  const { datasource, datasourceKey, isLoadingBlock } = useBreakdownDialogRows({
    view,
    rowScope,
    windows,
    tab,
    windowTotal,
    fallbackLabel,
    fallbackTooltip,
    readSubLabel,
    readQualifierSubLabel,
    readRouteKind,
    searchTerm: settledTerm,
    notice,
  });

  const columnDefs = useMemo<ColDef<BreakdownRowModel>[]>(() => {
    const columns: ColDef<BreakdownRowModel>[] = [
      {
        ...MEASURE_COLUMN_BASE,
        colId: 'dimension',
        field: 'displayLabel',
        headerName: t(BREAKDOWN_TAB_COLUMN_LABEL_KEY[tab]),
        cellClass: BREAKDOWN_COLUMN_BASE.cellClass,
        headerClass: void 0,
        cellRenderer: DimensionCell,
        tooltipValueGetter: () => null,
      },
      ...(ROUTE_KIND_TABS.includes(tab)
        ? [
            {
              ...BREAKDOWN_COLUMN_BASE,
              colId: 'routeKind',
              headerName: t(AnalyticsUsageI18nKey.ColumnRouteKind),
              // Text, not a badge colour: the kind is read, never inferred from a swatch.
              valueGetter: ({ data }: { data?: BreakdownRowModel }) =>
                data?.routeKind ? t(ROUTE_KIND_LABEL_KEY[data.routeKind]) : '',
              width: 130,
            } satisfies ColDef<BreakdownRowModel>,
          ]
        : []),
      {
        ...MEASURE_COLUMN_BASE,
        colId: 'share',
        headerName: t(AnalyticsUsageI18nKey.ColumnShareOfCalls),
        cellRenderer: ShareCell,
      },
      {
        ...MEASURE_COLUMN_BASE,
        colId: 'calls',
        headerName: t(AnalyticsUsageI18nKey.ColumnCalls),
        // Rows arrive ranked by the backend; the header states that order rather than offering another.
        sort: 'desc',
        cellRenderer: MeasureCell,
        cellRendererParams: {
          metric: KpiMetric.Requests,
          deltaKey: 'calls',
          format: (row: BreakdownRowModel) => formatGroupedNumber(row.calls),
        } satisfies MeasureCellParams,
      },
      {
        ...MEASURE_COLUMN_BASE,
        colId: 'errors',
        headerName: t(AnalyticsUsageI18nKey.ColumnErrorRate),
        cellRenderer: MeasureCell,
        cellRendererParams: {
          metric: KpiMetric.ErrorRate,
          deltaKey: 'errorRate',
          format: (row: BreakdownRowModel) => (row.errorRate == null ? null : formatPercent(row.errorRate, 1)),
          // A rate of one failure in thirty thousand prints `0.0%` while its change reads 150%, so
          // the exact reading states the counts it came from.
          formatExact: (row: BreakdownRowModel) =>
            row.errorRate == null
              ? null
              : t(AnalyticsUsageI18nKey.ExactErrorRate, {
                  failed: formatGroupedNumber(row.failed),
                  calls: formatGroupedNumber(row.calls),
                  rate: formatPercent(row.errorRate, EXACT_FRACTION_DIGITS),
                }),
        } satisfies MeasureCellParams,
      },
      {
        ...MEASURE_COLUMN_BASE,
        colId: 'latency',
        headerName: t(AnalyticsUsageI18nKey.ColumnAvgLatency),
        cellRenderer: MeasureCell,
        cellRendererParams: {
          metric: KpiMetric.AvgLatency,
          deltaKey: 'avgLatencyMs',
          format: (row: BreakdownRowModel) => {
            if (row.avgLatencyMs == null) {
              return null;
            }

            const formatted = formatDuration(row.avgLatencyMs);

            return `${formatted.value}${formatted.unit ?? ''}`;
          },
          // `2.5s` is a second and a half of rounding; the exact reading is in milliseconds.
          formatExact: (row: BreakdownRowModel) =>
            row.avgLatencyMs == null ? null : `${formatGroupedNumber(row.avgLatencyMs, 1)} ms`,
        } satisfies MeasureCellParams,
      },
    ];

    if (isCostOffered) {
      columns.push({
        ...MEASURE_COLUMN_BASE,
        colId: 'cost',
        headerName: t(AnalyticsUsageI18nKey.ColumnCost),
        cellRenderer: MeasureCell,
        cellRendererParams: {
          metric: KpiMetric.TotalSpend,
          deltaKey: 'spend',
          format: (row: BreakdownRowModel) => (row.spend == null ? null : formatGroupedMoney(row.spend)),
          // Cents hide a price of a few thousandths, which is what a cheap model's row costs.
          formatExact: (row: BreakdownRowModel) =>
            row.spend == null ? null : `$${formatGroupedNumber(row.spend, EXACT_FRACTION_DIGITS)}`,
        } satisfies MeasureCellParams,
      });
    }

    return columns;
  }, [tab, isCostOffered, t]);

  // The dialog reads the whole dimension, so its order can be the reader's: the backend takes it. The
  // card stays the ranked head it is cut from. The dialog opens on cost where the rows carry it, and
  // on calls where they do not, as an `initialSort` rather than a `sort`: AG Grid re-applies `sort`
  // whenever the definitions change, which put the opening column back beside the reader's pick.
  const dialogOpeningColumn = columnDefs.some((column) => column.colId === 'cost') ? 'cost' : 'calls';
  const dialogColumnDefs = useMemo<ColDef<BreakdownRowModel>[]>(
    () =>
      columnDefs.map(({ sort: _cardSort, ...column }) => ({
        ...column,
        sortable: SORTABLE_DIALOG_COLUMNS.includes(column.colId ?? ''),
        ...(column.colId === dialogOpeningColumn ? { initialSort: 'desc' as const } : {}),
      })),
    [columnDefs, dialogOpeningColumn],
  );

  const columnLabel = t(BREAKDOWN_TAB_COLUMN_LABEL_KEY[tab]);
  const searchPlaceholder = t(AnalyticsUsageI18nKey.SearchPlaceholder, { dimension: columnLabel });

  const onCloseDialog = useCallback(() => {
    onHideAll();
    setSearchTerm('');
  }, [onHideAll]);

  const isCardAutoHeight = rowModels.length > 0 && rowModels.length <= BREAKDOWN_CARD_SCROLL_AFTER_ROWS;

  const grid = (
    <BreakdownGrid
      rows={rowModels}
      columnDefs={columnDefs}
      isLoading={rows.isLoading}
      hasFailed={rows.hasFailed}
      isAutoHeight={isCardAutoHeight}
      className={isCardAutoHeight ? void 0 : BREAKDOWN_CARD_HEIGHT}
    />
  );

  return (
    <DashboardCard
      title={t(AnalyticsUsageI18nKey.BreakdownTitleTop, { count: String(rowLimit) })}
      subtitle={t(BREAKDOWN_TAB_DESCRIPTION_KEY[tab])}
      headerActions={
        <div className="flex shrink-0 items-center gap-4">
          <TabSelector tabs={tabs} activeTab={tab} onChange={(next) => onTabChange(next as BreakdownTab)} />
          {rowModels.length > 0 && <DialLinkButton label={t(AnalyticsUsageI18nKey.ViewAll)} onClick={onShowAll} />}
        </div>
      }
    >
      {grid}

      <Popup
        open={isShowingAll}
        size={PopupSize.Lg}
        header={t(AnalyticsUsageI18nKey.BreakdownFullListHeader, { dimension: columnLabel })}
        headerActions={
          <div className="w-[240px]">
            <Search
              id="breakdown-dialog-search"
              size={ElementSize.Small}
              value={searchTerm}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              onChange={(next) => setSearchTerm(next ?? '')}
            />
          </div>
        }
        onClose={onCloseDialog}
      >
        <BreakdownGrid
          rows={[]}
          columnDefs={dialogColumnDefs}
          isLoading={false}
          hasFailed={false}
          className="h-[70vh] px-6 pb-4"
          datasource={datasource}
          datasourceKey={datasourceKey}
          blockSize={DIALOG_BLOCK_SIZE}
          isLoadingBlock={isLoadingBlock}
        />
      </Popup>
    </DashboardCard>
  );
};

export default BreakdownTable;
