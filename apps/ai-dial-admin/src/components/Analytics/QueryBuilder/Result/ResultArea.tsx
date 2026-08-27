'use client';

import { FC, useMemo } from 'react';

import { ColDef } from 'ag-grid-community';
import { DialLoader, DialNoDataContent, DialSegmentedControl } from '@epam/ai-dial-ui-kit';
import type { SegmentedControlOption } from '@epam/ai-dial-ui-kit';

import GridView from '@/src/components/Grid/GridView/GridView';
import ResultChart from '@/src/components/Analytics/QueryBuilder/Result/ResultChart';
import StatChip from '@/src/components/Analytics/QueryBuilder/Result/StatChip';
import { getResultColumns, getResultTotal } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { StructuredQueryResult } from '@/src/models/analytics/query';
import { ChartConfig, ExecutedQueryMeta, QueryResultView } from '@/src/models/analytics/query-builder';

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
}

const ResultArea: FC<Props> = ({ result, meta, isRunning, view, onChangeView, chartConfig, onChangeChartConfig }) => {
  const t = useI18n();

  const columns = useMemo(() => getResultColumns(result, meta?.columnLabels), [result, meta?.columnLabels]);
  const rows = result?.rows ?? [];
  const total = getResultTotal(result);

  const chartAvailable =
    !!meta && rows.length > 0 && meta.dimensionColumns.length > 0 && meta.aggregateColumns.length > 0;

  const chartUnavailableKey = (): QueryBuilderI18nKey => {
    if (!rows.length) return QueryBuilderI18nKey.ChartNoRows;
    if (!meta?.dimensionColumns.length) return QueryBuilderI18nKey.ChartNoDimension;
    return QueryBuilderI18nKey.ChartNoValueColumn;
  };

  const viewOptions: SegmentedControlOption<QueryResultView>[] = [
    { value: QueryResultView.Table, label: t(QueryBuilderI18nKey.ViewTable) },
    { value: QueryResultView.Chart, label: t(QueryBuilderI18nKey.ViewChart) },
  ];

  const hasResult = !!result;
  const isChartView = view === QueryResultView.Chart;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <DialSegmentedControl
          ariaLabel={t(QueryBuilderI18nKey.ResultViewSwitcher)}
          options={viewOptions}
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
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {isRunning ? (
          <DialLoader size={40} />
        ) : !hasResult ? (
          <DialNoDataContent title={t(QueryBuilderI18nKey.ResultsEmptyDescription)} />
        ) : isChartView ? (
          chartAvailable && meta ? (
            <ResultChart result={result} meta={meta} config={chartConfig} onChangeConfig={onChangeChartConfig} />
          ) : (
            <DialNoDataContent title={t(chartUnavailableKey())} />
          )
        ) : !rows.length ? (
          <DialNoDataContent title={t(QueryBuilderI18nKey.NoRows)} />
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
