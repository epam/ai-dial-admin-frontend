import { EChartsOption } from 'echarts-for-react';

import { METRIC_TREND_TOOLTIP_CLASS, TREND_METRIC_SYMBOL_SIZE } from '@/src/components/TestSuites/Trends/constants';
import { MetricTrendSeries, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import {
  TREND_TOOLTIP_BACKGROUND,
  TREND_TOOLTIP_BORDER_COLOR,
  TREND_TOOLTIP_BORDER_RADIUS,
  TREND_TOOLTIP_BORDER_WIDTH,
  TREND_TOOLTIP_EXTERNAL_LINK_ICON_SVG,
  TREND_TOOLTIP_PADDING,
  TREND_TOOLTIP_TEXT_ACCENT,
  TREND_TOOLTIP_TEXT_PRIMARY,
  TREND_TOOLTIP_TEXT_SECONDARY,
} from '@/src/components/TestSuites/Trends/utils/chart-tooltip-styles';
import { formatMetricTrendTooltipDate, formatScore } from '@/src/components/TestSuites/Trends/utils/format';
import { TREND_SCORE_CHART_GRID } from '@/src/components/TestSuites/Trends/utils/score-axis';
import { ThemePalette } from '@/src/models/theme';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

/** Matches `grid` in {@link buildMetricTrendChartOptions}. */
export const METRIC_TREND_GRID = TREND_SCORE_CHART_GRID;

/** Series datum for Metric Trends; category value + runIndex for tooltips. */
interface MetricTrendSeriesDatum {
  value: number | null;
  runIndex: number;
}

const categoryAxisData = (runOrder: TrendsRunPoint[]): string[] => runOrder.map((point) => point.runId);

const metricTrendPointScore = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return value;
  }
  if (value != null && typeof value === 'object' && 'value' in value) {
    return metricTrendPointScore((value as MetricTrendSeriesDatum).value);
  }
  return null;
};

const resolveMetricTrendRunIndex = (params: { data?: MetricTrendSeriesDatum; dataIndex: number }[]): number | null => {
  for (const param of params) {
    if (param.data?.runIndex != null) {
      return param.data.runIndex;
    }
  }
  return null;
};

export const resolveNearestMetricTrendCategoryIndex = (
  convertFromPixel: (finder: unknown, value: number | number[]) => unknown,
  offsetX: number,
  offsetY: number,
  runCount: number,
  chartWidth?: number,
  _chartHeight?: number,
): number | null => {
  if (runCount <= 0) {
    return null;
  }

  const raw = convertFromPixel('grid', [offsetX, offsetY]);
  if (Array.isArray(raw) && typeof raw[0] === 'number' && Number.isFinite(raw[0])) {
    return Math.max(0, Math.min(runCount - 1, Math.round(raw[0])));
  }

  if (chartWidth == null) {
    return null;
  }

  const plotLeft = METRIC_TREND_GRID.left;
  const plotRight = chartWidth - METRIC_TREND_GRID.right;
  const plotWidth = plotRight - plotLeft;
  if (plotWidth <= 0) {
    return null;
  }
  if (runCount === 1) {
    return 0;
  }

  const ratio = (offsetX - plotLeft) / plotWidth;
  return Math.max(0, Math.min(runCount - 1, Math.round(ratio * (runCount - 1))));
};

export const buildMetricTrendChartOptions = (
  palette: ThemePalette,
  runOrder: TrendsRunPoint[],
  series: MetricTrendSeries[],
  hiddenSeries: Set<string>,
): EChartsOption => {
  const axisColor = palette['text-secondary'];
  const visible = series.filter((item) => !hiddenSeries.has(item.name));

  return {
    title: { show: false },
    tooltip: {
      trigger: 'axis',
      // Click-to-stick + enterable so the run link stays reachable (hover tips die in the canvas→bubble gap).
      triggerOn: 'click',
      enterable: true,
      hideDelay: 0,
      transitionDuration: 0,
      className: METRIC_TREND_TOOLTIP_CLASS,
      appendTo: typeof document !== 'undefined' ? document.body : undefined,
      confine: false,
      backgroundColor: TREND_TOOLTIP_BACKGROUND,
      borderColor: TREND_TOOLTIP_BORDER_COLOR,
      borderWidth: TREND_TOOLTIP_BORDER_WIDTH,
      borderRadius: TREND_TOOLTIP_BORDER_RADIUS,
      padding: TREND_TOOLTIP_PADDING,
      textStyle: { color: TREND_TOOLTIP_TEXT_PRIMARY, fontSize: 12 },
      axisPointer: {
        type: 'line',
        lineStyle: { color: axisColor, width: 1 },
      },
      formatter: (
        params: {
          seriesName: string;
          value: unknown;
          color: string;
          dataIndex: number;
          data?: MetricTrendSeriesDatum;
        }[],
      ) => {
        if (!params.length) {
          return '';
        }
        const runIndex = resolveMetricTrendRunIndex(params);
        if (runIndex == null) {
          return '';
        }
        const point = runOrder[runIndex];
        if (!point) {
          return '';
        }
        const metricParams = params.filter((param) => metricTrendPointScore(param.value) != null);
        const metricRows = metricParams
          .map((param) => {
            const score = metricTrendPointScore(param.value);
            return `
              <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;line-height:16px;">
                <div style="display:flex;align-items:center;gap:4px;color:${TREND_TOOLTIP_TEXT_SECONDARY};">
                  <span style="width:6px;height:6px;border-radius:50%;background:${param.color};flex-shrink:0;"></span>
                  <span>${param.seriesName}:</span>
                </div>
                <span style="color:${TREND_TOOLTIP_TEXT_PRIMARY};">${score != null ? formatScore(score) : '—'}</span>
              </div>`;
          })
          .join('');
        const href = getUrnForEntity(ApplicationRoute.Runs, { id: point.runId, testRunName: point.runName });
        return `
          <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;min-width:140px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;line-height:16px;color:${TREND_TOOLTIP_TEXT_PRIMARY};white-space:nowrap;">
              <a href="${href}" target="_blank" rel="noopener noreferrer"
                 style="display:inline-flex;align-items:center;gap:4px;color:${TREND_TOOLTIP_TEXT_ACCENT};font-weight:600;text-decoration:none;cursor:pointer;">
                <span>${point.runName}</span>
                ${TREND_TOOLTIP_EXTERNAL_LINK_ICON_SVG}
              </a>
              <span style="font-weight:600;">${formatMetricTrendTooltipDate(point.computedAtMs)}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:2px;">
              ${metricRows}
            </div>
          </div>`;
      },
    },
    legend: { show: false },
    grid: {
      left: METRIC_TREND_GRID.left,
      right: METRIC_TREND_GRID.right,
      top: METRIC_TREND_GRID.top,
      bottom: METRIC_TREND_GRID.bottom,
    },
    xAxis: {
      type: 'category' as const,
      data: categoryAxisData(runOrder),
      show: false,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1,
      interval: 0.25,
      // Labels render left of the bordered plot (Figma 11947:325167).
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: true,
        lineStyle: { color: palette['bg-layer-4'], width: 1 },
      },
    },
    series: visible.map((item) => ({
      name: item.name,
      type: 'line',
      data: item.values.map((value, index) => ({ value, runIndex: index })),
      smooth: false,
      showSymbol: true,
      symbol: 'circle',
      symbolSize: TREND_METRIC_SYMBOL_SIZE,
      clip: false,
      lineStyle: { color: item.color, width: 2 },
      itemStyle: { color: item.color },
      connectNulls: false,
    })),
  };
};
