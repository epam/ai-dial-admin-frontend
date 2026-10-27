'use client';

import { FC, useMemo, useState } from 'react';

import ReactECharts from 'echarts-for-react';

import { METRIC_TREND_TOOLTIP_CLASS } from '@/src/components/TestSuites/Trends/constants';
import MetricTrendTags from '@/src/components/TestSuites/Trends/MetricTrends/MetricTrendTags';
import {
  METRIC_TREND_GRID,
  buildMetricTrendChartOptions,
  resolveNearestMetricTrendCategoryIndex,
} from '@/src/components/TestSuites/Trends/MetricTrends/utils/chart-options';
import { getTrendTagPalette } from '@/src/components/TestSuites/Trends/MetricTrends/utils/trend-tag-palette';
import TrendRunAxisLabels from '@/src/components/TestSuites/Trends/TrendRunAxisLabels';
import TrendScoreAxis from '@/src/components/TestSuites/Trends/TrendScoreAxis';
import { MetricTrendGroup, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { useStickyEchartsTooltip } from '@/src/components/TestSuites/Trends/utils/use-sticky-echarts-tooltip';
import { useTheme } from '@/src/context/ThemeContext';
import { useThemePalette } from '@/src/hooks/use-theme-palette';

const METRIC_TREND_PLOT_HEIGHT_PX = 111;

interface Props {
  group: MetricTrendGroup;
  runOrder: TrendsRunPoint[];
}

const MetricTrendCard: FC<Props> = ({ group, runOrder }) => {
  const { currentTheme } = useTheme();
  const palette = useThemePalette();
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(() => new Set());
  const { chartRef, onChartReady } = useStickyEchartsTooltip(METRIC_TREND_TOOLTIP_CLASS, runOrder.length > 0, {
    runCount: runOrder.length,
    resolveCategoryIndex: resolveNearestMetricTrendCategoryIndex,
  });

  const tagPalette = useMemo(() => getTrendTagPalette(currentTheme), [currentTheme]);

  const themedSeries = useMemo(
    () =>
      group.series.map((item, index) => ({
        ...item,
        color: tagPalette[index % tagPalette.length].stroke,
      })),
    [group.series, tagPalette],
  );

  const options = useMemo(
    () => buildMetricTrendChartOptions(palette, runOrder, themedSeries, hiddenSeries),
    [themedSeries, hiddenSeries, runOrder, palette],
  );

  const onToggleSeries = (name: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-secondary bg-layer-2 p-4">
      <p className="dial-small-text text-primary">{group.name}</p>
      <MetricTrendTags
        series={themedSeries}
        tagPalette={tagPalette}
        hiddenSeries={hiddenSeries}
        onToggleSeries={onToggleSeries}
      />
      <div className="flex w-full gap-2">
        <TrendScoreAxis height={METRIC_TREND_PLOT_HEIGHT_PX} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div
            className="w-full overflow-hidden rounded border border-secondary bg-layer-2"
            style={{ height: METRIC_TREND_PLOT_HEIGHT_PX }}
          >
            <ReactECharts
              ref={chartRef}
              option={options}
              onChartReady={onChartReady}
              className="h-full w-full"
              opts={{ renderer: 'canvas' }}
              notMerge
            />
          </div>
          <TrendRunAxisLabels
            runOrder={runOrder}
            paddingLeft={METRIC_TREND_GRID.left}
            paddingRight={METRIC_TREND_GRID.right}
          />
        </div>
      </div>
    </div>
  );
};

export default MetricTrendCard;
