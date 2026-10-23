'use client';

import { FC, useId, useMemo } from 'react';

import { ColDef } from 'ag-grid-community';
import { Spinner, NoDataContent, SegmentedControl, GhostButton } from '@epam/ai-dial-ui-kit';
import type { SegmentedControlItem } from '@epam/ai-dial-ui-kit';
import { IconDownload } from '@tabler/icons-react';

import GridView from '@/src/components/Grid/GridView/GridView';
import ResultChart from '@/src/components/Analytics/QueryBuilder/Result/ResultChart';
import { getValueClassColumn } from '@/src/components/Analytics/QueryBuilder/Result/result-column-format';
import ResultValueCell from '@/src/components/Analytics/QueryBuilder/Result/ResultValueCell';
import StatChip from '@/src/components/Analytics/QueryBuilder/Result/StatChip';
import { getResultColumns, getResultTotal } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { EXPORT_ROW_LIMIT } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { StructuredQueryResult } from '@/src/models/analytics/query';
import {
  ChartConfig,
  ExecutedQueryMeta,
  QueryRequestKind,
  QueryResultView,
} from '@/src/models/analytics/query-builder';

interface Props {
  result: StructuredQueryResult | null;
  meta: ExecutedQueryMeta | null;
  isRunning: boolean;
  // Controlled by the orchestrator: both are members of a saved query's payload, so they have to be
  // readable at save time and restorable when a stored query opens.
  view: QueryResultView;
  onChangeView: (view: QueryResultView) => void;
  chartConfig: ChartConfig;
  onChangeChartConfig: (config: ChartConfig) => void;
  isExporting?: boolean;
  onExportCsv?: () => void;
}

const ResultArea: FC<Props> = ({
  result,
  meta,
  isRunning,
  view,
  onChangeView,
  chartConfig,
  onChangeChartConfig,
  isExporting = false,
  onExportCsv,
}) => {
  const t = useI18n();
  const exportHintId = useId();

  // Attached here rather than in the column builder, which stays a pure description of the columns.
  const columns = useMemo(
    () =>
      getResultColumns(result, meta?.columnLabels).map((col) => ({
        ...col,
        ...getValueClassColumn(meta?.columnValueClasses?.[col.field ?? '']),
        cellRenderer: ResultValueCell,
      })),
    [result, meta?.columnLabels, meta?.columnValueClasses],
  );
  const rows = result?.rows ?? [];
  const total = getResultTotal(result);

  const chartAvailable =
    !!meta && rows.length > 0 && meta.dimensionColumns.length > 0 && meta.aggregateColumns.length > 0;

  const chartUnavailableKey = (): QueryBuilderI18nKey => {
    if (!rows.length) return QueryBuilderI18nKey.ChartNoRows;
    if (!meta?.dimensionColumns.length) return QueryBuilderI18nKey.ChartNoDimension;
    return QueryBuilderI18nKey.ChartNoValueColumn;
  };

  const viewOptions: SegmentedControlItem<QueryResultView>[] = [
    { value: QueryResultView.Table, label: t(QueryBuilderI18nKey.ViewTable) },
    { value: QueryResultView.Chart, label: t(QueryBuilderI18nKey.ViewChart) },
  ];

  const hasResult = !!result;
  const exportHint = t(
    meta?.kind === QueryRequestKind.Sql ? QueryBuilderI18nKey.ExportCsvSqlHint : QueryBuilderI18nKey.ExportCsvHint,
    { limit: EXPORT_ROW_LIMIT.toLocaleString() },
  );
  const isChartView = view === QueryResultView.Chart;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          aria-label={t(QueryBuilderI18nKey.ResultViewSwitcher)}
          items={viewOptions}
          value={view}
          onChange={onChangeView}
        />
        {hasResult && (
          <div className="flex items-center gap-2">
            <StatChip value={rows.length} label={t(QueryBuilderI18nKey.RowsReturned)} />
            <StatChip value={columns.length} label={t(QueryBuilderI18nKey.Fields)} />
            {total != null && <StatChip value={total.toLocaleString()} label={t(QueryBuilderI18nKey.Total)} />}
          </div>
        )}
        {hasResult && onExportCsv && (
          <>
            <GhostButton
              className="ml-auto"
              label={t(QueryBuilderI18nKey.ExportCsv)}
              iconBefore={
                isExporting ? (
                  <span aria-hidden>
                    <Spinner fullWidth={false} size={BASE_BUTTON_ICON_PROPS.size} />
                  </span>
                ) : (
                  <IconDownload {...BASE_BUTTON_ICON_PROPS} aria-hidden />
                )
              }
              aria-busy={isExporting}
              tooltipProps={{ tooltip: exportHint }}
              aria-describedby={exportHintId}
              disabled={isRunning || isExporting}
              onClick={onExportCsv}
            />
            {/* The kit's tooltip names the button only while it is open; this keeps the ceiling announced. */}
            <span id={exportHintId} className="sr-only">
              {exportHint}
            </span>
          </>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {isRunning ? (
          <Spinner size={40} fullWidth />
        ) : !hasResult ? (
          <NoDataContent title={t(QueryBuilderI18nKey.ResultsEmptyDescription)} />
        ) : isChartView ? (
          chartAvailable && meta ? (
            <ResultChart result={result} meta={meta} config={chartConfig} onChangeConfig={onChangeChartConfig} />
          ) : (
            <NoDataContent title={t(chartUnavailableKey())} />
          )
        ) : !rows.length ? (
          <NoDataContent title={t(QueryBuilderI18nKey.NoRows)} />
        ) : (
          <div className="min-h-0 flex-1">
            <GridView columnDefs={columns as ColDef[]} rowData={rows} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultArea;
