'use client';

import { FC, useMemo } from 'react';

import { ColDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
import { DialGhostButton, DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import classNames from 'classnames';

import DashboardCard from '@/src/components/Analytics/Usage/Card/DashboardCard';
import { HEATMAP_BODY_HEIGHT } from '@/src/components/Analytics/Usage/constants';
import { HeatmapWeek } from '@/src/components/Analytics/Usage/use-heatmap-week';
import HeatmapScale from '@/src/components/Analytics/Usage/Charts/HeatmapScale';
import {
  HEATMAP_COL_PREFIX,
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
  HEAT_MAP_LABEL_COL_WIDTH,
  HEAT_MAP_VALUE_COL_MIN_WIDTH,
  getHeatMapDefaultCellStyle,
  getHeatMapGridCellBorderStyle,
} from '@/src/components/Common/HeatMap/constants';
import HeatMapAxisHeader from '@/src/components/Common/HeatMap/HeatMapAxisHeader';
import HeatMapGrid from '@/src/components/Common/HeatMap/HeatMapGrid';
import HeatMapLabelCellRenderer from '@/src/components/Common/HeatMap/HeatMapLabelCellRenderer';
import { AnalyticsUsageI18nKey, BasicI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  heatmap: HeatmapWeek;
}

const formatDayLabel = (dayStartMs: number): string =>
  new Date(dayStartMs).toLocaleDateString(void 0, { weekday: 'short', day: 'numeric' });

const formatHourLabel = (hour: number): string => String(hour).padStart(2, '0');

const ActivityHeatmap: FC<Props> = ({ heatmap }) => {
  const t = useI18n();
  const { buckets, week, weekOffset, onPreviousWeek, onNextWeek, onCurrentWeek } = heatmap;

  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const matrix = useMemo(() => buildHeatmapMatrix(buckets.data ?? [], week, formatDayLabel), [buckets.data, week]);

  // The grid always draws its seven days, so an empty week is stated in the subtitle rather than by
  // replacing the grid with a message.
  const isEmptyWeek = !buckets.isLoading && !buckets.hasFailed && matrix.maxValue === 0;

  const columnDefs = useMemo<ColDef<HeatmapRow>[]>(() => {
    const labelColumn: ColDef<HeatmapRow> = {
      colId: HEAT_MAP_LABEL_COL_ID,
      field: 'label',
      headerName: ' ',
      pinned: 'left',
      width: HEAT_MAP_LABEL_COL_WIDTH,
      minWidth: HEAT_MAP_LABEL_COL_WIDTH,
      maxWidth: HEAT_MAP_LABEL_COL_WIDTH,
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
              {t(AnalyticsUsageI18nKey.HeatmapCellLabel, {
                day: params.data.label ?? '',
                hour: headerLabel,
                calls: String(params.data.values?.[colId] ?? 0),
              })}
            </span>
          );
        },
        tooltipValueGetter: (params) => {
          if (!params.data || isFutureCell(params.data.dayStartMs, hour)) {
            return void 0;
          }

          return t(AnalyticsUsageI18nKey.HeatmapCellLabel, {
            day: params.data.label,
            hour: headerLabel,
            calls: String(params.data.values?.[colId] ?? 0),
          });
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
  }, [matrix.maxValue, t]);

  const renderGrid = () => {
    if (buckets.isLoading) {
      return (
        <div className="flex justify-center">
          <DialLoader size={24} />
        </div>
      );
    }

    if (buckets.hasFailed) {
      return <DialNoDataContent title={buckets.error ?? t(BasicI18nKey.NoData)} />;
    }

    return (
      <HeatMapGrid
        columnDefs={columnDefs}
        rowData={matrix.rows}
        headerLabels={Array.from({ length: HEATMAP_HOURS }, (_, hour) => formatHourLabel(hour))}
        emptyTitle={t(BasicI18nKey.NoData)}
        valueColumnIdPrefix={HEATMAP_COL_PREFIX}
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
        <div className="flex flex-wrap items-center gap-2">
          <div className={classNames(weekOffset === 0 && 'invisible')} inert={weekOffset === 0}>
            <DialGhostButton label={t(AnalyticsUsageI18nKey.HeatmapCurrentWeek)} onClick={onCurrentWeek} />
          </div>
          <DialGhostButton
            iconBefore={<IconChevronLeft {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
            title={t(AnalyticsUsageI18nKey.HeatmapPreviousWeek)}
            onClick={onPreviousWeek}
          />
          <span className="dial-tiny-text min-w-[150px] text-center text-primary">{formatWeekLabel(week)}</span>
          <DialGhostButton
            iconBefore={<IconChevronRight {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
            title={t(AnalyticsUsageI18nKey.HeatmapNextWeek)}
            disabled={weekOffset === 0}
            onClick={onNextWeek}
          />
        </div>
      }
    >
      <div className="flex flex-col justify-center" style={{ minHeight: HEATMAP_BODY_HEIGHT }}>
        {renderGrid()}
      </div>

      <HeatmapScale className="mt-3 justify-start" />
    </DashboardCard>
  );
};

export default ActivityHeatmap;
