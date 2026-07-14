'use client';

import { FC, useMemo } from 'react';

import ReactECharts from 'echarts-for-react';
import { DialNoDataContent, DialSegmentedControl, DialSelect } from '@epam/ai-dial-ui-kit';
import type { SegmentedControlOption } from '@epam/ai-dial-ui-kit';

import { buildChartOptions } from '@/src/components/Analytics/QueryBuilder/Result/chart-options';
import { CHART_TYPE_OPTIONS } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { StructuredQueryResult } from '@/src/models/analytics/query';
import { ChartConfig, ChartType, ExecutedQueryMeta } from '@/src/models/analytics/query-builder';

interface Props {
  result: StructuredQueryResult;
  meta: ExecutedQueryMeta;
  config: ChartConfig;
  onChangeConfig: (config: ChartConfig) => void;
}

const ResultChart: FC<Props> = ({ result, meta, config, onChangeConfig }) => {
  const t = useI18n();

  // Config fields are null until the user picks — defaults follow the executed query.
  const xField = config.xField ?? meta.dimensionColumns[0] ?? null;
  const yField = config.yField ?? meta.aggregateColumns[0] ?? null;

  const typeOptions: SegmentedControlOption<ChartType>[] = CHART_TYPE_OPTIONS.map((o) => ({
    value: o.value as ChartType,
    label: o.label,
  }));

  const options = useMemo(
    () => (xField && yField ? buildChartOptions(config.type, result.rows, xField, yField) : null),
    [config.type, result.rows, xField, yField],
  );

  if (!options) {
    return <DialNoDataContent title={t(QueryBuilderI18nKey.ChartUnavailable)} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <DialSegmentedControl
          ariaLabel={t(QueryBuilderI18nKey.ChartTypeSwitcher)}
          options={typeOptions}
          value={config.type}
          onChange={(type) => onChangeConfig({ ...config, type })}
        />
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <div className="w-[200px]">
            <DialSelect
              prefix={`${t(QueryBuilderI18nKey.ChartXAxis)}: `}
              options={meta.dimensionColumns.map((c) => ({ value: c, label: c }))}
              value={xField ?? undefined}
              onChange={(v) => onChangeConfig({ ...config, xField: v as string })}
            />
          </div>
          <div className="w-[200px]">
            <DialSelect
              prefix={`${t(QueryBuilderI18nKey.ChartYAxis)}: `}
              options={meta.aggregateColumns.map((c) => ({ value: c, label: c }))}
              value={yField ?? undefined}
              onChange={(v) => onChangeConfig({ ...config, yField: v as string })}
            />
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <ReactECharts option={options} style={{ height: '100%', width: '100%' }} notMerge />
      </div>
    </div>
  );
};

export default ResultChart;
