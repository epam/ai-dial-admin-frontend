import { EChartsOption } from 'echarts-for-react';

import {
  OVERALL_SCORE_TREND_TOOLTIP_CLASS,
  TREND_OVERALL_SYMBOL_SIZE,
} from '@/src/components/TestSuites/Trends/constants';
import { MetricTrendSeries, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import {
  buildCenteredTimelineLabels,
  formatScore,
  formatTrendAxisDate,
  formatTrendTooltipDate,
} from '@/src/components/TestSuites/Trends/utils/format';
import { ThemePalette } from '@/src/models/theme';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

// The tooltip is a DOM node and resolves the theme's variables; the axes and series are painted on the
// canvas and take the palette's concrete values.
const TOOLTIP_BACKGROUND = 'color-mix(in srgb, var(--bg-layer-base, #10151E) 90%, transparent)';
const TOOLTIP_TEXT_PRIMARY = 'var(--text-primary, #FCFCFC)';
const TOOLTIP_TEXT_SECONDARY = 'var(--text-secondary, #ACB3C3)';

interface OverallChartLabels {
  date: string;
  run: string;
  score: string;
}

/** Matches `grid` in {@link buildOverallScoreChartOptions}. */
export const OVERALL_SCORE_TREND_GRID = { left: 48, right: 16, bottom: 28, top: 16 } as const;

/** Matches `grid` in {@link buildMetricTrendChartOptions}; left reserves space for Y-axis labels. */
export const METRIC_TREND_GRID = { left: 28, right: 0, bottom: 10, top: 10 } as const;

/**
 * Keep the sticky click tooltip away from the pointer and inside the chart view.
 * Low-score points sit near the x-axis; default placement puts the tooltip under the
 * cursor, which immediately hides it. Right-edge points also need horizontal clamping.
 */
export const resolveOverallScoreTooltipPosition = (
  point: number[],
  size: { contentSize: number[]; viewSize: number[] },
): [number, number] => {
  const [mouseX, mouseY] = point;
  const [boxW, boxH] = size.contentSize;
  const [viewW, viewH] = size.viewSize;
  const gap = 12;

  let x = mouseX + gap;
  let y = mouseY - boxH - gap;

  if (y < 0) {
    y = mouseY + gap;
  }
  if (y + boxH > viewH) {
    y = Math.max(0, viewH - boxH);
  }
  if (x + boxW > viewW) {
    x = mouseX - boxW - gap;
  }
  if (x < 0) {
    x = 0;
  }

  return [x, y];
};

/**
 * Layout fallback when convertFromPixel fails (clicks below the plot / on axis labels).
 * Assumes `boundaryGap: false` category axis.
 */
export const resolveCategoryDataIndexFromLayout = (
  offsetX: number,
  chartWidth: number,
  categoryCount: number,
  grid: { left: number; right: number } = OVERALL_SCORE_TREND_GRID,
): number | null => {
  if (categoryCount <= 0 || chartWidth <= 0) {
    return null;
  }
  if (categoryCount === 1) {
    return 0;
  }

  const plotWidth = chartWidth - grid.left - grid.right;
  if (plotWidth <= 0) {
    return null;
  }

  const dataIndex = Math.round(((offsetX - grid.left) / plotWidth) * (categoryCount - 1));
  if (dataIndex < 0 || dataIndex >= categoryCount) {
    return null;
  }
  return dataIndex;
};

/** Map a chart-pixel click to a category dataIndex (works below the plot / on axis labels). */
export const resolveCategoryDataIndexFromPixel = (
  convertFromPixel: (finder: unknown, value: number | number[]) => unknown,
  offsetX: number,
  offsetY: number,
  categoryCount: number,
  chartWidth?: number,
  chartHeight?: number,
): number | null => {
  if (categoryCount <= 0) {
    return null;
  }

  const toIndex = (raw: unknown): number | null => {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return null;
    }
    const dataIndex = Math.round(value);
    if (dataIndex < 0 || dataIndex >= categoryCount) {
      return null;
    }
    return dataIndex;
  };

  // Clamp Y into the plot so grid conversion still works for axis-label clicks.
  const plotTop = OVERALL_SCORE_TREND_GRID.top;
  const plotBottom = (chartHeight ?? 220) - OVERALL_SCORE_TREND_GRID.bottom;
  const clampedY = Math.min(plotBottom - 1, Math.max(plotTop + 1, offsetY));

  return (
    toIndex(convertFromPixel('grid', [offsetX, clampedY])) ??
    toIndex(convertFromPixel({ xAxisIndex: 0 }, offsetX)) ??
    (chartWidth != null ? resolveCategoryDataIndexFromLayout(offsetX, chartWidth, categoryCount) : null)
  );
};

export const buildOverallScoreChartOptions = (
  palette: ThemePalette,
  runOrder: TrendsRunPoint[],
  labels: OverallChartLabels,
): EChartsOption => {
  const passedColor = palette['text-accent-primary'];
  const axisColor = palette['text-secondary'];
  const categories = runOrder.map((point) => formatTrendAxisDate(point.computedAtMs));
  const centeredCategories = buildCenteredTimelineLabels(categories);

  const values = runOrder.map((point) => {
    if (point.overallScore == null) {
      return null;
    }
    const color = point.isFailed ? palette['text-error'] : passedColor;
    return {
      value: point.overallScore,
      itemStyle: { color, borderColor: color },
    };
  });

  return {
    title: { show: false },
    tooltip: {
      trigger: 'axis',
      triggerOn: 'click',
      alwaysShowContent: true,
      transitionDuration: 0,
      enterable: true,
      appendTo: typeof document !== 'undefined' ? document.body : undefined,
      confine: false,
      className: OVERALL_SCORE_TREND_TOOLTIP_CLASS,
      backgroundColor: TOOLTIP_BACKGROUND,
      borderColor: 'var(--stroke-primary, #848E9C)',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: TOOLTIP_TEXT_PRIMARY, fontSize: 12 },
      axisPointer: {
        type: 'line',
        snap: true,
        lineStyle: { color: axisColor, width: 1 },
      },
      position: (
        point: number[],
        _params: unknown,
        _dom: HTMLElement,
        _rect: unknown,
        size: { contentSize: number[]; viewSize: number[] },
      ) => resolveOverallScoreTooltipPosition(point, size),
      formatter: (params: { dataIndex: number; value: number | null }[]) => {
        const item = params[0];
        if (!item) {
          return '';
        }
        const point = runOrder[item.dataIndex];
        if (!point) {
          return '';
        }
        const href = getUrnForEntity(ApplicationRoute.Runs, { id: point.runId, testRunName: point.runName });
        const score = point.overallScore != null ? formatScore(point.overallScore) : '—';
        return `
          <div style="display:flex;gap:12px;align-items:flex-start;">
            <div style="display:flex;flex-direction:column;gap:4px;color:${TOOLTIP_TEXT_SECONDARY};">
              <span>${labels.date}</span>
              <span>${labels.run}</span>
              <span>${labels.score}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;color:${TOOLTIP_TEXT_PRIMARY};">
              <span>${formatTrendTooltipDate(point.computedAtMs)}</span>
              <a href="${href}" target="_blank" rel="noopener noreferrer"
                 style="color:var(--text-accent, #6E8AF7);font-weight:600;text-decoration:none;cursor:pointer;">
                ${point.runName} ↗
              </a>
              <span>${score}</span>
            </div>
          </div>`;
      },
    },
    grid: {
      left: OVERALL_SCORE_TREND_GRID.left,
      right: OVERALL_SCORE_TREND_GRID.right,
      bottom: OVERALL_SCORE_TREND_GRID.bottom,
      top: OVERALL_SCORE_TREND_GRID.top,
    },
    xAxis: {
      type: 'category',
      data: categories,
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: axisColor,
        fontSize: 12,
        formatter: (_value: string, index: number) => centeredCategories[index] ?? '',
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1,
      interval: 0.25,
      axisLabel: { color: axisColor, fontSize: 12 },
      splitLine: { lineStyle: { color: palette['bg-layer-1'], width: 1 } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'line',
        data: values,
        smooth: false,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: TREND_OVERALL_SYMBOL_SIZE,
        lineStyle: { color: passedColor, width: 2 },
        itemStyle: { color: passedColor },
        areaStyle: { color: passedColor, opacity: 0.2 },
        connectNulls: false,
      },
    ],
  };
};

export const buildMetricTrendChartOptions = (
  palette: ThemePalette,
  runOrder: TrendsRunPoint[],
  series: MetricTrendSeries[],
  hiddenSeries: Set<string>,
  runLabel: string,
): EChartsOption => {
  const axisColor = palette['text-secondary'];
  const categories = runOrder.map((point) => formatTrendAxisDate(point.computedAtMs));
  const visible = series.filter((item) => !hiddenSeries.has(item.name));

  return {
    title: { show: false },
    tooltip: {
      trigger: 'axis',
      appendTo: typeof document !== 'undefined' ? document.body : undefined,
      confine: false,
      backgroundColor: TOOLTIP_BACKGROUND,
      borderColor: 'var(--stroke-primary, #848E9C)',
      borderWidth: 1,
      padding: [4, 8],
      textStyle: { color: TOOLTIP_TEXT_PRIMARY, fontSize: 12 },
      axisPointer: {
        type: 'line',
        lineStyle: { color: axisColor, width: 1 },
      },
      formatter: (params: { seriesName: string; value: number | null; color: string; dataIndex: number }[]) => {
        if (!params.length) {
          return '';
        }
        const point = runOrder[params[0].dataIndex];
        const metricParams = params.filter((param) => param.value != null);
        const labels = metricParams
          .map(
            (param) => `
              <div style="display:flex;align-items:center;gap:4px;line-height:16px;">
                <span style="width:6px;height:6px;border-radius:50%;background:${param.color};flex-shrink:0;"></span>
                <span>${param.seriesName}:</span>
              </div>`,
          )
          .join('');
        const values = metricParams
          .map(
            (param) => `
              <div style="line-height:16px;color:${TOOLTIP_TEXT_PRIMARY};">${formatScore(Number(param.value))}</div>`,
          )
          .join('');
        return `
          <div style="display:flex;gap:12px;align-items:flex-start;font-size:12px;">
            <div style="display:flex;flex-direction:column;gap:2px;color:${TOOLTIP_TEXT_SECONDARY};">
              <div style="line-height:16px;">${runLabel}</div>
              ${labels}
            </div>
            <div style="display:flex;flex-direction:column;gap:2px;color:${TOOLTIP_TEXT_PRIMARY};">
              <div style="line-height:16px;">${point?.runName ?? ''}</div>
              ${values}
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
      type: 'category',
      data: categories,
      show: false,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1,
      interval: 0.25,
      axisLabel: { show: true, color: axisColor, fontSize: 10 },
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
      data: item.values,
      smooth: false,
      showSymbol: false,
      clip: false,
      lineStyle: { color: item.color, width: 2 },
      itemStyle: { color: item.color },
      connectNulls: false,
    })),
  };
};
