'use client';

import { FC, useEffect, useMemo, useRef, useState } from 'react';

import { ColDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
import { Spinner } from '@epam/ai-dial-ui-kit';

import HeatmapScale from '@/src/components/Analytics/Usage/Charts/HeatmapScale';
import {
  HEATMAP_BODY_HEIGHT,
  HEATMAP_HEADER_HEIGHT,
  HEATMAP_FLAT_COLUMN_WIDTH,
  HEATMAP_NARROW_ROW_HEIGHT,
} from '@/src/components/Analytics/Usage/constants';
import {
  HEATMAP_COL_PREFIX,
  HEATMAP_DAYS,
  HEATMAP_HOURS,
  HeatmapMatrix,
  HeatmapRow,
  getHeatmapCellColor,
  getHeatmapCellOpacity,
  getHeatmapHourColId,
  isFutureCell,
} from '@/src/components/Analytics/Usage/utils/heatmap';
import {
  HEAT_MAP_LABEL_COL_ID,
  HEAT_MAP_VALUE_COL_MIN_WIDTH,
  getHeatMapDefaultCellStyle,
  getHeatMapGridCellBorderStyle,
} from '@/src/components/Common/HeatMap/constants';
import HeatMapAxisHeader from '@/src/components/Common/HeatMap/HeatMapAxisHeader';
import HeatMapGrid from '@/src/components/Common/HeatMap/HeatMapGrid';
import HeatMapLabelCellRenderer from '@/src/components/Common/HeatMap/HeatMapLabelCellRenderer';
import { AnalyticsUsageI18nKey, BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  matrix: HeatmapMatrix;
  isLoading: boolean;
  /** What a cell says to a pointer and a screen reader: its day, hour and figure. */
  readCellLabel: (day: string, hour: string, value: number) => string;
}

export const formatHeatmapDayLabel = (dayStartMs: number): string =>
  new Date(dayStartMs).toLocaleDateString(void 0, { weekday: 'short', day: 'numeric' });

const formatHourLabel = (hour: number): string => String(hour).padStart(2, '0');

/**
 * The shared label column is sized for run names; a weekday and a date need a fraction of it, and
 * at the shared width the text sat alone against a hand's breadth of empty cell.
 */
const DAY_LABEL_COL_WIDTH = 88;

/** A week of hours, one shaded cell each, with its scale: the body of the usage dashboard's heatmap card. */
const HeatmapWeekGrid: FC<Props> = ({ matrix, isLoading, readCellLabel }) => {
  const t = useI18n();
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
    if (isLoading) {
      return (
        <div className="flex justify-center">
          <Spinner size={24} fullWidth />
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
    <>
      <div
        ref={bodyRef}
        className="flex flex-col justify-center"
        style={{ minHeight: rowHeight ? HEATMAP_DAYS * rowHeight + HEATMAP_HEADER_HEIGHT : HEATMAP_BODY_HEIGHT }}
      >
        {renderGrid()}
      </div>

      <HeatmapScale className="mt-3 justify-start" />
    </>
  );
};

export default HeatmapWeekGrid;
