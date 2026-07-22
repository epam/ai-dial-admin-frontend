'use client';

import { FC, useEffect, useMemo, useState } from 'react';

import { ColDef } from 'ag-grid-community';
import { DialLoader, DialNoDataContent, DialSegmentedControl } from '@epam/ai-dial-ui-kit';
import type { SegmentedControlOption } from '@epam/ai-dial-ui-kit';

import GridView from '@/src/components/Grid/GridView/GridView';
import ResultChart from '@/src/components/Analytics/QueryBuilder/Result/ResultChart';
import StatChip from '@/src/components/Analytics/QueryBuilder/Result/StatChip';
import { getResultColumns, getResultTotal } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { DEFAULT_CHART_CONFIG } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { QueryMode, StructuredQueryResult } from '@/src/models/analytics/query';
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
}

const ResultArea: FC<Props> = ({ result, meta, isRunning }) => {
  const t = useI18n();

  const [view, setView] = useState<QueryResultView>(QueryResultView.Table);
  const [chartConfig, setChartConfig] = useState<ChartConfig>(DEFAULT_CHART_CONFIG);

  // Axis picks belong to one result: a new run gets fresh defaults derived from its own query.
  useEffect(() => {
    setChartConfig(DEFAULT_CHART_CONFIG);
  }, [result]);

  const columns = useMemo(() => getResultColumns(result), [result]);
  const rows = result?.rows ?? [];
  const total = getResultTotal(result);

  // A chart needs an X (a group-by dimension) and a Y (an aggregate column): a grouped query with
  // no aggregates returns only dimension columns and has nothing to plot.
  const chartAvailable =
    !!meta &&
    meta.kind === QueryRequestKind.Structured &&
    meta.mode === QueryMode.Aggregate &&
    meta.dimensionColumns.length > 0 &&
    meta.aggregateColumns.length > 0;

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
          onChange={setView}
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
            <ResultChart result={result} meta={meta} config={chartConfig} onChangeConfig={setChartConfig} />
          ) : (
            <DialNoDataContent title={t(QueryBuilderI18nKey.ChartUnavailable)} />
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
