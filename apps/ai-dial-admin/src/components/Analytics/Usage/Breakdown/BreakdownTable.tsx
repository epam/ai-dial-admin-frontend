'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { ColDef } from 'ag-grid-community';
import { DialLinkButton, ElementSize, Popup, PopupSize, Search } from '@epam/ai-dial-ui-kit';

import BreakdownGrid from '@/src/components/Analytics/Usage/Breakdown/BreakdownGrid';
import DimensionCell from '@/src/components/Analytics/Usage/Breakdown/cells/DimensionCell';
import MeasureCell, { MeasureCellParams } from '@/src/components/Analytics/Usage/Breakdown/cells/MeasureCell';
import ShareCell from '@/src/components/Analytics/Usage/Breakdown/cells/ShareCell';
import DashboardCard from '@/src/components/Analytics/Usage/Card/DashboardCard';
import { DIALOG_BLOCK_SIZE, SEARCH_DEBOUNCE_MS, VIEW_BREAKDOWN_TABS } from '@/src/components/Analytics/Usage/constants';
import {
  BreakdownRow,
  BreakdownRowModel,
  BreakdownTab,
  ComparedWindows,
  KpiMetric,
  RequestState,
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
} from '@/src/components/Analytics/Usage/utils/labels';
import TabSelector from '@/src/components/Common/TabSelector/TabSelector';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

/**
 * Neither surface offers column sorting or per-column filters. The card holds one ranked page, so
 * both would reorder or sift that page while hiding that the rest of the dimension was never
 * fetched. The dialog reads the whole dimension, but block by block — a filter there has to reach
 * the rows it has not read yet, which is what its search field does, once, over the dimension.
 */
const BREAKDOWN_COLUMN_BASE: ColDef<BreakdownRowModel> = {
  sortable: false,
  filter: false,
  floatingFilter: false,
  suppressHeaderMenuButton: true,
};

/** Decimals an exact reading states: enough for a rate or a price the column rounded to nothing. */
const EXACT_FRACTION_DIGITS = 4;

/**
 * Every column takes an equal share of the table. A measure now carries its own change beside it,
 * so the figures are of one kind and one width: the old fixed widths left the numeric columns
 * crowded against each other while the share bar took a third of the row.
 */
const MEASURE_COLUMN_BASE: ColDef<BreakdownRowModel> = {
  ...BREAKDOWN_COLUMN_BASE,
  flex: 1,
  minWidth: 150,
  // The pair the repo's own column configs use: a right-aligned figure needs its header on the same
  // edge, or the column reads as a label on the left with numbers under someone else's heading.
  cellClass: 'align-right',
  headerClass: 'align-right',
};

interface Props {
  view: UsageView;
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
  onOpenRow: (row: BreakdownRowModel) => void;
  /** The dialog reads its own blocks, so it reports its own failures. */
  notice: LoadFailureNotice;
}

const BreakdownTable: FC<Props> = ({
  view,
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
  onOpenRow,
  notice,
}) => {
  const t = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const settledTerm = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);
  const hasComparison = Boolean(windows.previous);

  const tabs = useMemo(
    () => VIEW_BREAKDOWN_TABS[view].map((option) => ({ id: option, label: t(BREAKDOWN_TAB_LABEL_KEY[option]) })),
    [view, t],
  );

  const fallbackLabelKey = getFallbackLabelKey(tab);
  const fallbackTooltipKey = getFallbackTooltipKey(tab, view);
  const fallbackLabel = fallbackLabelKey ? t(fallbackLabelKey) : void 0;
  const fallbackTooltip = fallbackTooltipKey ? t(fallbackTooltipKey) : void 0;
  const isFallbackPinnedLast = isFallbackRowPinnedLast(tab);

  /**
   * A tool row aggregates every server the tool was called on, and the name alone does not say
   * which: one server is named outright, several are counted, with the names it read in a tooltip.
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
  ]);

  const { datasource, datasourceKey, isLoadingBlock } = useBreakdownDialogRows({
    view,
    windows,
    tab,
    windowTotal,
    fallbackLabel,
    fallbackTooltip,
    readSubLabel,
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
        // The one column of text: it reads from the left, header included.
        cellClass: void 0,
        headerClass: void 0,
        cellRenderer: DimensionCell,
        cellRendererParams: { onOpenRow },
      },
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

    if (view === UsageView.Llm) {
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
  }, [tab, view, onOpenRow, t]);

  const columnLabel = t(BREAKDOWN_TAB_COLUMN_LABEL_KEY[tab]);
  const searchPlaceholder = t(AnalyticsUsageI18nKey.SearchPlaceholder, { dimension: columnLabel });

  const onCloseDialog = useCallback(() => {
    onHideAll();
    setSearchTerm('');
  }, [onHideAll]);
  const grid = (
    <BreakdownGrid
      rows={rowModels}
      columnDefs={columnDefs}
      isLoading={rows.isLoading}
      hasFailed={rows.hasFailed}
      className="h-[320px]"
    />
  );

  return (
    <DashboardCard
      title={t(AnalyticsUsageI18nKey.BreakdownTitle)}
      subtitle={t(BREAKDOWN_TAB_DESCRIPTION_KEY[tab])}
      headerActions={
        /* Both controls act on the same table, so they sit together at the header's right edge,
           centred against the title block rather than pinned to the title's own line. */
        <div className="flex shrink-0 items-center gap-4">
          <TabSelector tabs={tabs} activeTab={tab} onChange={(next) => onTabChange(next as BreakdownTab)} />
          {/* The card shows one page, the dialog the full list — a count here would name the page. */}
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
          columnDefs={columnDefs}
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
