'use client';

import { FC, useCallback, useMemo } from 'react';

import { NoDataContent, Spinner } from '@epam/ai-dial-ui-kit';
import type { EChartsType } from 'echarts';
import ReactECharts from 'echarts-for-react';

import SummarySection from '@/src/components/Runs/Summary/SummarySection';
import TrendRunAxisLabels from '@/src/components/TestSuites/Trends/TrendRunAxisLabels';
import TrendScoreAxis from '@/src/components/TestSuites/Trends/TrendScoreAxis';
import { OVERALL_SCORE_TREND_TOOLTIP_CLASS } from '@/src/components/TestSuites/Trends/constants';
import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import {
  OVERALL_SCORE_TREND_GRID,
  buildOverallScoreChartOptions,
  buildOverallScorePlotPoints,
  resolveNearestOverallScoreDataIndex,
} from '@/src/components/TestSuites/Trends/OverallScoreTrend/utils/chart-options';
import { TREND_SCORE_Y_LABEL_WIDTH_PX } from '@/src/components/TestSuites/Trends/utils/score-axis';
import { useStickyEchartsTooltip } from '@/src/components/TestSuites/Trends/utils/use-sticky-echarts-tooltip';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useThemePalette } from '@/src/hooks/use-theme-palette';
import { useI18n } from '@/src/locales/client';

/** Bordered plot min height from Figma 12369:104140. */
const OVERALL_SCORE_PLOT_MIN_HEIGHT_PX = 220;

interface Props {
  runOrder: TrendsRunPoint[];
  overallScoreThreshold?: number | null;
  isLoading?: boolean;
}

const OverallScoreTrend: FC<Props> = ({ runOrder, overallScoreThreshold, isLoading }) => {
  const t = useI18n();
  const palette = useThemePalette();
  const hasData = runOrder.some((point) => point.overallScore != null);
  const plotPoints = useMemo(() => buildOverallScorePlotPoints(runOrder), [runOrder]);

  const resolveTipTarget = useCallback(
    (chart: EChartsType, offsetX: number, offsetY: number) => {
      const convertToPixel = (finder: unknown, value: number | number[]) =>
        chart.convertToPixel(finder as never, value as never);

      const dataIndex = resolveNearestOverallScoreDataIndex(
        convertToPixel,
        offsetX,
        offsetY,
        plotPoints,
        chart.getWidth(),
        chart.getHeight(),
      );

      if (dataIndex == null) {
        return null;
      }

      const seriesData = (chart.getOption() as { series?: { data?: { runIndex?: number }[] }[] }).series?.[0]?.data;
      const seriesDataIndex = seriesData?.findIndex((datum) => datum?.runIndex === dataIndex) ?? -1;
      if (seriesDataIndex < 0) {
        return null;
      }

      return { seriesIndex: 0, dataIndex: seriesDataIndex };
    },
    [plotPoints],
  );

  const { chartRef, onChartReady } = useStickyEchartsTooltip(OVERALL_SCORE_TREND_TOOLTIP_CLASS, hasData && !isLoading, {
    resolveTipTarget,
  });

  const options = useMemo(
    () =>
      buildOverallScoreChartOptions(
        palette,
        runOrder,
        {
          score: t(TestSuitesI18nKey.TrendsOverallScoreTooltipScore),
          threshold: t(TestSuitesI18nKey.OverallScoreThresholdLabel),
        },
        overallScoreThreshold,
      ),
    [runOrder, t, palette, overallScoreThreshold],
  );

  return (
    <SummarySection isFillHeight className="h-full min-h-0 flex-1" title={t(TestSuitesI18nKey.OverallScoreTrend)}>
      {isLoading ? (
        <div className="flex h-full min-h-[220px] items-center justify-center">
          <Spinner size={32} />
        </div>
      ) : !hasData ? (
        <div className="flex h-full min-h-[220px] items-center justify-center">
          <NoDataContent title={t(BasicI18nKey.NoData)} />
        </div>
      ) : (
        <div className="flex h-full min-h-[220px] w-full flex-col gap-2 overflow-hidden">
          <div className="flex min-h-0 w-full flex-1 gap-2">
            <TrendScoreAxis />
            <div
              className="min-h-0 min-w-0 flex-1 overflow-hidden rounded border border-secondary bg-layer-2"
              style={{ minHeight: OVERALL_SCORE_PLOT_MIN_HEIGHT_PX }}
            >
              <ReactECharts
                ref={chartRef}
                option={options}
                onChartReady={onChartReady}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            </div>
          </div>
          <div className="flex w-full gap-2">
            <div className="shrink-0" style={{ width: TREND_SCORE_Y_LABEL_WIDTH_PX }} aria-hidden />
            <div className="min-w-0 flex-1">
              <TrendRunAxisLabels
                runOrder={runOrder}
                paddingLeft={OVERALL_SCORE_TREND_GRID.left}
                paddingRight={OVERALL_SCORE_TREND_GRID.right}
              />
            </div>
          </div>
        </div>
      )}
    </SummarySection>
  );
};

export default OverallScoreTrend;
