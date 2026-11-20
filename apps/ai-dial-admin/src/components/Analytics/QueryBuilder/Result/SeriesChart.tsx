'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts-for-react/src/types';
import classNames from 'classnames';

import ChartLegend from '@/src/components/Analytics/Usage/Charts/ChartLegend';
import { buildSeriesLegend, fitCategoryLabels } from '@/src/components/Analytics/QueryBuilder/Result/chart-options';
import { DEFAULT_CHART_LEGEND } from '@/src/constants/analytics/query-builder';
import { ChartLegendConfig, ChartLegendPosition } from '@/src/models/analytics/query-builder';

interface Props {
  option: EChartsOption;
  ariaLabel?: string;
  legendConfig?: ChartLegendConfig;
}

const LAYOUT_BY_POSITION: Record<ChartLegendPosition, string> = {
  [ChartLegendPosition.Above]: 'flex-col-reverse',
  [ChartLegendPosition.Below]: 'flex-col',
  [ChartLegendPosition.Left]: 'flex-row-reverse',
  [ChartLegendPosition.Right]: 'flex-row',
};

const SeriesChart: FC<Props> = ({ option, ariaLabel, legendConfig = DEFAULT_CHART_LEGEND }) => {
  const chartRef = useRef<ReactECharts>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameWidth, setFrameWidth] = useState(0);
  const [pinnedSeriesIndex, setPinnedSeriesIndex] = useState<number | null>(null);
  const legend = useMemo(() => buildSeriesLegend(option), [option]);

  const focusSeries = useCallback((seriesIndex: number | null) => {
    const instance = chartRef.current?.getEchartsInstance();
    if (!instance) return;
    instance.dispatchAction({ type: 'downplay' });
    if (seriesIndex != null) instance.dispatchAction({ type: 'highlight', seriesIndex });
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => setFrameWidth(Math.round(entry.contentRect.width)));
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const fittedOption = useMemo(() => fitCategoryLabels(option, frameWidth), [option, frameWidth]);

  const legendKey = legend.map((entry) => entry.id).join('|');
  useEffect(() => {
    setPinnedSeriesIndex(null);
  }, [legendKey]);

  useEffect(() => {
    focusSeries(pinnedSeriesIndex);
  }, [fittedOption, pinnedSeriesIndex, focusSeries]);

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

  const isSide =
    legendConfig.position === ChartLegendPosition.Left || legendConfig.position === ChartLegendPosition.Right;
  const isLegendShown = legendConfig.isVisible && legend.length > 0;

  return (
    <div className={classNames('flex size-full min-h-0 gap-3', LAYOUT_BY_POSITION[legendConfig.position])}>
      <div
        ref={frameRef}
        role={ariaLabel ? 'img' : undefined}
        aria-label={ariaLabel}
        className="min-h-0 min-w-0 flex-1"
      >
        <ReactECharts ref={chartRef} option={fittedOption} style={{ height: '100%', width: '100%' }} notMerge />
      </div>
      {isLegendShown && (
        <ChartLegend
          entries={legend}
          onPreviewSeries={onPreviewSeries}
          onToggleSeries={onToggleSeries}
          pinnedSeriesIndex={pinnedSeriesIndex}
          className={classNames(
            'shrink-0',
            isSide
              ? 'max-w-[40%] flex-col flex-nowrap items-stretch self-center overflow-y-auto [&>li]:w-full'
              : 'max-h-[40%] justify-center overflow-y-auto [&>li]:max-w-60',
          )}
        />
      )}
    </div>
  );
};

export default SeriesChart;
