'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ColDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
import { DialGhostButton, DialLoader, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

import DashboardCard from '@/src/components/Analytics/Usage/Card/DashboardCard';
import {
  HEATMAP_BODY_HEIGHT,
  HEATMAP_HEADER_HEIGHT,
  HEATMAP_FLAT_COLUMN_WIDTH,
  HEATMAP_NARROW_ROW_HEIGHT,
} from '@/src/components/Analytics/Usage/constants';
import { HeatmapMetric, UsageView } from '@/src/components/Analytics/Usage/models';
import { HeatmapWeek } from '@/src/components/Analytics/Usage/use-heatmap-week';
import HeatmapScale from '@/src/components/Analytics/Usage/Charts/HeatmapScale';
import { formatGroupedMoney, formatGroupedNumber } from '@/src/components/Analytics/Usage/utils/format';
import {
  HEATMAP_COL_PREFIX,
  HEATMAP_DAYS,
  HEATMAP_HOURS,
  HeatmapRow,
  buildHeatmapMatrix,
  getHeatmapCellColor,
  getHeatmapCellOpacity,
  getHeatmapHourColId,
  isFutureCell,
} from '@/src/components/Analytics/Usage/utils/heatmap';
import { formatWeekLabel } from '@/src/components/Analytics/Usage/utils/weeks';
import {
  HEAT_MAP_LABEL_COL_ID,
  HEAT_MAP_VALUE_COL_MIN_WIDTH,
  getHeatMapDefaultCellStyle,
  getHeatMapGridCellBorderStyle,
} from '@/src/components/Analytics/Common/HeatMap/constants';
import HeatMapAxisHeader from '@/src/components/Analytics/Common/HeatMap/HeatMapAxisHeader';
import HeatMapGrid from '@/src/components/Analytics/Common/HeatMap/HeatMapGrid';
import HeatMapLabelCellRenderer from '@/src/components/Analytics/Common/HeatMap/HeatMapLabelCellRenderer';
import TabSelector from '@/src/components/Common/TabSelector/TabSelector';
import { AnalyticsUsageI18nKey, BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  heatmap: HeatmapWeek;
  /** An MCP row carries no price, so there is nothing to paint in that view. */
  view: UsageView;
}

const PAGER_ICON_PROPS = { size: 16, stroke: 2 };

const formatDayLabel = (dayStartMs: number): string =>
  new Date(dayStartMs).toLocaleDateString(void 0, { weekday: 'short', day: 'numeric' });

const formatHourLabel = (hour: number): string => String(hour).padStart(2, '0');

/**
 * The shared label column is sized for run names; a weekday and a date need a fraction of it, and
 * at the shared width the text sat alone against a hand's breadth of empty cell.
 */
const DAY_LABEL_COL_WIDTH = 88;

const ActivityHeatmap: FC<Props> = ({ heatmap, view }) => {
  const t = useI18n();
  const [metric, setMetric] = useState<HeatmapMetric>(HeatmapMetric.Calls);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [bodyWidth, setBodyWidth] = useState(0);

  useEffect(() => {
    const body = bodyRef.current;

    if (!body || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(([entry]) => setBodyWidth(entry.contentRect.width));
    observer.observe(body);

    return () => observer.disconnect();
  }, []);

  const hourColumnWidth = bodyWidth ? (bodyWidth - DAY_LABEL_COL_WIDTH) / HEATMAP_HOURS : 0;
  const rowHeight = hourColumnWidth && hourColumnWidth < HEATMAP_FLAT_COLUMN_WIDTH ? HEATMAP_NARROW_ROW_HEIGHT : void 0;
  const { buckets, week, weekOffset, onPreviousWeek, onNextWeek, onCurrentWeek } = heatmap;

  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const isCostOffered = view === UsageView.Llm;
  const activeMetric = isCostOffered ? metric : HeatmapMetric.Calls;

  const matrix = useMemo(
    () => buildHeatmapMatrix(buckets.data ?? [], week, formatDayLabel, activeMetric),
    [buckets.data, week, activeMetric],
  );

  const metricTabs = useMemo(
    () => [
      { id: HeatmapMetric.Calls, label: t(AnalyticsUsageI18nKey.HeatmapMetricCalls) },
      { id: HeatmapMetric.Cost, label: t(AnalyticsUsageI18nKey.HeatmapMetricCost) },
    ],
    [t],
  );

  const readCellLabel = useCallback(
    (day: string, hour: string, value: number) =>
      activeMetric === HeatmapMetric.Cost
        ? t(AnalyticsUsageI18nKey.HeatmapCellCostLabel, { day, hour, cost: formatGroupedMoney(value) })
        : t(AnalyticsUsageI18nKey.HeatmapCellLabel, { day, hour, calls: formatGroupedNumber(value) }),
    [activeMetric, t],
  );

  // The grid always draws its seven days, so an empty week is stated in the subtitle rather than by
  // replacing the grid with a message.
  const isEmptyWeek = !buckets.isLoading && (buckets.hasFailed || matrix.maxValue === 0);

  const columnDefs = useMemo<ColDef<HeatmapRow>[]>(() => {
    const labelColumn: ColDef<HeatmapRow> = {
      colId: HEAT_MAP_LABEL_COL_ID,
      field: 'label',
      headerName: t(AnalyticsUsageI18nKey.HeatmapDayColumn),
      pinned: 'left',
      width: DAY_LABEL_COL_WIDTH,
      minWidth: DAY_LABEL_COL_WIDTH,
      maxWidth: DAY_LABEL_COL_WIDTH,
      sortable: false,
      filter: false,
      resizable: false,
      suppressMovable: true,
      cellRenderer: HeatMapLabelCellRenderer,
      cellStyle: () => getHeatMapDefaultCellStyle(),
    };

    const hourColumns = Array.from({ length: HEATMAP_HOURS }, (_, hour): ColDef<HeatmapRow> => {
      const colId = getHeatmapHourColId(hour);
      const headerLabel = formatHourLabel(hour);

      return {
        colId,
        headerName: headerLabel,
        headerComponent: HeatMapAxisHeader,
        headerComponentParams: { label: headerLabel },
        minWidth: HEAT_MAP_VALUE_COL_MIN_WIDTH,
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        // The cell draws colour and nothing else, so its day, hour and count reach a pointer
        // through the tooltip and a screen reader through a visually hidden label — a cell with
        // neither is an unnamed square to anyone not looking at the shade.
        valueGetter: (params: ValueGetterParams<HeatmapRow>) => Number(params.data?.values?.[colId] ?? 0),
        cellRenderer: (params: ICellRendererParams<HeatmapRow>) => {
          if (!params.data || isFutureCell(params.data.dayStartMs, hour)) {
            return null;
          }

          return (
            <span className="sr-only">
              {readCellLabel(params.data.label ?? '', headerLabel, params.data.values?.[colId] ?? 0)}
            </span>
          );
        },
        tooltipValueGetter: (params) => {
          if (!params.data || isFutureCell(params.data.dayStartMs, hour)) {
            return void 0;
          }

          return readCellLabel(params.data.label ?? '', headerLabel, params.data.values?.[colId] ?? 0);
        },
        cellStyle: (params) => {
          if (!params.data || isFutureCell(params.data.dayStartMs, hour)) {
            return getHeatMapGridCellBorderStyle();
          }

          const value = Number(params.data.values?.[colId] ?? 0);
          const opacity = getHeatmapCellOpacity(value, matrix.maxValue);
          return getHeatMapGridCellBorderStyle(opacity === 0 ? void 0 : getHeatmapCellColor(opacity));
        },
      };
    });

    return [labelColumn, ...hourColumns];
  }, [matrix.maxValue, readCellLabel, t]);

  const renderGrid = () => {
    if (buckets.isLoading) {
      return (
        <div className="flex justify-center">
          <DialLoader size={24} />
        </div>
      );
    }

    return (
      <HeatMapGrid
        columnDefs={columnDefs}
        rowData={matrix.rows}
        headerLabels={Array.from({ length: HEATMAP_HOURS }, (_, hour) => formatHourLabel(hour))}
        emptyTitle={t(BasicI18nKey.NoData)}
        valueColumnIdPrefix={HEATMAP_COL_PREFIX}
        rowHeight={rowHeight}
        showColorScale={false}
        className="flex min-h-0 flex-col"
      />
    );
  };

  return (
    <DashboardCard
      title={t(AnalyticsUsageI18nKey.HeatmapTitle)}
      subtitle={
        isEmptyWeek
          ? t(AnalyticsUsageI18nKey.HeatmapEmptySubtitle, { timezone })
          : t(AnalyticsUsageI18nKey.HeatmapSubtitle, { timezone })
      }
      headerActions={
        <div className="flex items-center gap-3">
          {/* Beside the pager: both control what the grid shows, one the week and one the figure. */}
          {isCostOffered && (
            <TabSelector tabs={metricTabs} activeTab={metric} onChange={(next) => setMetric(next as HeatmapMetric)} />
          )}
          {/* Rendered only when it does something. The group is pinned to the header's right edge,
              so the button appears to its left without moving the pager under the cursor — the
              reserved gap it used to sit in read as a control that had gone missing. */}
          {weekOffset !== 0 && (
            <DialGhostButton
              size={ElementSize.Small}
              label={t(AnalyticsUsageI18nKey.HeatmapCurrentWeek)}
              onClick={onCurrentWeek}
            />
          )}
          <DialGhostButton
            size={ElementSize.Small}
            className="px-1"
            iconBefore={<IconChevronLeft {...PAGER_ICON_PROPS} aria-hidden />}
            title={t(AnalyticsUsageI18nKey.HeatmapPreviousWeek)}
            onClick={onPreviousWeek}
          />
          <span className="dial-tiny-text min-w-[84px] whitespace-nowrap text-center text-primary">
            {formatWeekLabel(week)}
          </span>
          <DialGhostButton
            size={ElementSize.Small}
            className="px-1"
            iconBefore={<IconChevronRight {...PAGER_ICON_PROPS} aria-hidden />}
            title={t(AnalyticsUsageI18nKey.HeatmapNextWeek)}
            disabled={weekOffset === 0}
            onClick={onNextWeek}
          />
        </div>
      }
    >
      <div
        ref={bodyRef}
        className="flex flex-col justify-center"
        style={{ minHeight: rowHeight ? HEATMAP_DAYS * rowHeight + HEATMAP_HEADER_HEIGHT : HEATMAP_BODY_HEIGHT }}
      >
        {renderGrid()}
      </div>

      <HeatmapScale className="mt-3 justify-start" />
    </DashboardCard>
  );
};

export default ActivityHeatmap;
