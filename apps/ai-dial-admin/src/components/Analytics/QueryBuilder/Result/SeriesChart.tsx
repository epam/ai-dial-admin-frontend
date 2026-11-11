'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts-for-react/src/types';

import ChartLegend from '@/src/components/Analytics/Usage/Charts/ChartLegend';
import { buildSeriesLegend } from '@/src/components/Analytics/QueryBuilder/Result/chart-options';

interface Props {
  option: EChartsOption;
  ariaLabel?: string;
}

const SeriesChart: FC<Props> = ({ option, ariaLabel }) => {
  const chartRef = useRef<ReactECharts>(null);
  const [pinnedSeriesIndex, setPinnedSeriesIndex] = useState<number | null>(null);
  const legend = useMemo(() => buildSeriesLegend(option), [option]);

  const focusSeries = useCallback((seriesIndex: number | null) => {
    const instance = chartRef.current?.getEchartsInstance();
    if (!instance) return;
    instance.dispatchAction({ type: 'downplay' });
    if (seriesIndex != null) instance.dispatchAction({ type: 'highlight', seriesIndex });
  }, []);

  useEffect(() => {
    focusSeries(pinnedSeriesIndex);
  }, [option, pinnedSeriesIndex, focusSeries]);

  const onPreviewSeries = useCallback(
    (seriesIndex: number | null) => focusSeries(seriesIndex ?? pinnedSeriesIndex),
    [focusSeries, pinnedSeriesIndex],
  );

  const onToggleSeries = useCallback(
    (seriesIndex: number) => {
      setPinnedSeriesIndex(pinnedSeriesIndex === seriesIndex ? null : seriesIndex);
    },
    [pinnedSeriesIndex],
  );

  return (
    <div className="flex size-full min-h-0 flex-col">
      <div role={ariaLabel ? 'img' : undefined} aria-label={ariaLabel} className="min-h-0 flex-1">
        <ReactECharts ref={chartRef} option={option} style={{ height: '100%', width: '100%' }} notMerge />
      </div>
      {legend.length > 0 && (
        <ChartLegend
          entries={legend}
          onPreviewSeries={onPreviewSeries}
          onToggleSeries={onToggleSeries}
          pinnedSeriesIndex={pinnedSeriesIndex}
          className="mt-3 shrink-0"
        />
      )}
    </div>
  );
};

export default SeriesChart;
