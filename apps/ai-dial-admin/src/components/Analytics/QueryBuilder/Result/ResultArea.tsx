'use client';

import { FC, ReactNode, useId, useMemo } from 'react';

import { ColDef, GetRowIdParams } from 'ag-grid-community';
import { Spinner, NoDataContent, SegmentedControl, GhostButton } from '@epam/ai-dial-ui-kit';
import type { SegmentedControlItem } from '@epam/ai-dial-ui-kit';
import { IconChartBar, IconDownload, IconTable } from '@tabler/icons-react';
import classNames from 'classnames';

import ReadyToRunIllustration from '@/public/images/query-ready-to-run.svg';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ResultGridRow, ScorecardTrendSource } from '@/src/components/Analytics/QueryBuilder/Result/models';
import ResultChart from '@/src/components/Analytics/QueryBuilder/Result/ResultChart';
import { getValueClassColumn } from '@/src/components/Analytics/QueryBuilder/Result/result-column-format';
import ResultValueCell from '@/src/components/Analytics/QueryBuilder/Result/ResultValueCell';
import { useRowsRestricted } from '@/src/components/Analytics/QueryBuilder/Result/use-rows-restricted';
import { getScorecardColumns } from '@/src/components/Analytics/QueryBuilder/utils/chart-types';
import { getResultColumns, getResultTotal } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { EXPORT_ROW_LIMIT } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey, QueryChipsI18nKey } from '@/src/constants/i18n';
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
  isQueryChanged?: boolean;
  // Controlled by the orchestrator: both are members of a saved query's payload, so they have to be
  // readable at save time and restorable when a stored query opens.
  view: QueryResultView;
  onChangeView: (view: QueryResultView) => void;
  chartConfig: ChartConfig;
  onChangeChartConfig: (config: ChartConfig) => void;
  isExporting?: boolean;
  onExportCsv?: () => void;
  actions?: ReactNode;
  trendSource?: ScorecardTrendSource;
}

const getRowId = ({ data }: GetRowIdParams<ResultGridRow>): string => String(data.index);

const ResultArea: FC<Props> = ({
  result,
  meta,
  isRunning,
  isQueryChanged = false,
  view,
  onChangeView,
  chartConfig,
  onChangeChartConfig,
  isExporting = false,
  onExportCsv,
  actions,
  trendSource,
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
  const rows = useMemo(() => result?.rows ?? [], [result]);
  const gridRows = useMemo(() => rows.map((values, index): ResultGridRow => ({ index, values })), [rows]);
  const total = getResultTotal(result);
  const isRowsRestricted = useRowsRestricted(meta?.source, !!result && !rows.length && !isRunning);

  const chartAvailable =
    !!meta &&
    rows.length > 0 &&
    ((meta.dimensionColumns.length > 0 && meta.aggregateColumns.length > 0) ||
      getScorecardColumns(rows, meta).length > 0);

  const chartUnavailableKey = (): QueryBuilderI18nKey => {
    if (!rows.length) return QueryBuilderI18nKey.ChartNoRows;
    if (!meta?.dimensionColumns.length) return QueryBuilderI18nKey.ChartNoDimension;
    return QueryBuilderI18nKey.ChartNoValueColumn;
  };

  const viewOptions: SegmentedControlItem<QueryResultView>[] = [
    {
      value: QueryResultView.Table,
      label: t(QueryBuilderI18nKey.ViewTable),
      icon: <IconTable size={16} stroke={2} aria-hidden />,
    },
    {
      value: QueryResultView.Chart,
      label: t(QueryBuilderI18nKey.ViewChart),
      icon: <IconChartBar size={16} stroke={2} aria-hidden />,
    },
  ];

  const hasResult = !!result;
  const exportHint = t(
    meta?.kind === QueryRequestKind.Sql ? QueryBuilderI18nKey.ExportCsvSqlHint : QueryBuilderI18nKey.ExportCsvHint,
    { limit: EXPORT_ROW_LIMIT.toLocaleString() },
  );
  const resultCount =
    total == null
      ? t(QueryChipsI18nKey.ResultsCount, { count: rows.length.toLocaleString() })
      : t(QueryChipsI18nKey.ResultsCountOfTotal, {
          count: rows.length.toLocaleString(),
          total: total.toLocaleString(),
        });
  const isChartView = view === QueryResultView.Chart;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 pb-4">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          aria-label={t(QueryBuilderI18nKey.ResultViewSwitcher)}
          items={viewOptions}
          value={view}
          onChange={onChangeView}
        />
        {hasResult && (
          <span role="status" className="text-secondary dial-small-text">
            {isQueryChanged ? t(QueryBuilderI18nKey.ResultsQueryChanged) : resultCount}
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          {actions}
          {hasResult && onExportCsv && (
            <>
              <GhostButton
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
      </div>

      <div
        className={classNames(
          'flex min-h-0 flex-1 flex-col transition-opacity',
          isQueryChanged && !isRunning && 'opacity-60',
        )}
      >
        {isRunning ? (
          <Spinner size={40} fullWidth />
        ) : !hasResult ? (
          <NoDataContent
            icon={<ReadyToRunIllustration />}
            title={t(QueryBuilderI18nKey.ResultsReadyTitle)}
            description={t(QueryBuilderI18nKey.ResultsReadyDescription)}
          />
        ) : isChartView ? (
          chartAvailable && meta ? (
            <ResultChart
              result={result}
              meta={meta}
              config={chartConfig}
              onChangeConfig={onChangeChartConfig}
              trendSource={trendSource}
            />
          ) : (
            <NoDataContent title={t(chartUnavailableKey())} />
          )
        ) : !rows.length ? (
          <NoDataContent
            title={t(QueryBuilderI18nKey.NoRows)}
            description={t(
              isRowsRestricted ? QueryBuilderI18nKey.NoRowsForAccess : QueryBuilderI18nKey.NoRowsDescription,
            )}
          />
        ) : (
          <div className="min-h-0 flex-1">
            <GridView columnDefs={columns as ColDef[]} rowData={gridRows} getRowId={getRowId} isLiveData />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultArea;
