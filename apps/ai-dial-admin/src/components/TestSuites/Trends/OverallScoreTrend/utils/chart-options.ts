import { EChartsOption } from 'echarts-for-react';

import {
  OVERALL_SCORE_TREND_TOOLTIP_CLASS,
  TREND_OVERALL_SYMBOL_SIZE,
} from '@/src/components/TestSuites/Trends/constants';
import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import {
  buildThresholdMarkPlan,
  ThresholdHorizontalSegment,
  ThresholdMarkSegment,
} from '@/src/components/TestSuites/Trends/OverallScoreTrend/utils/threshold-segments';
import {
  TREND_TOOLTIP_EXTERNAL_LINK_ICON_SVG,
  TREND_TOOLTIP_TEXT_ACCENT,
  TREND_TOOLTIP_TEXT_PRIMARY,
  TREND_TOOLTIP_TEXT_SECONDARY,
} from '@/src/components/TestSuites/Trends/utils/chart-tooltip-styles';
import { formatMetricTrendTooltipDate, formatScore } from '@/src/components/TestSuites/Trends/utils/format';
import { TREND_SCORE_CHART_GRID } from '@/src/components/TestSuites/Trends/utils/score-axis';
import { ThemePalette } from '@/src/models/theme';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { CHART_TOOLTIP_STYLE } from '@/src/constants/chart-tooltip';

interface OverallChartLabels {
  score: string;
  /** Full threshold caption (e.g. "Threshold"); shown in the hover tooltip. */
  threshold?: string;
  /** Short caption drawn on the chart (e.g. "Thld"): the full one is clipped by the last run's short segment. */
  thresholdShort?: string;
}

/** Short dash / wide gap for vertical threshold transitions (sparser than horizontal). */
const THRESHOLD_VERTICAL_DASH: [number, number] = [2, 8];
const SCORE_AXIS_MAX = 1;

export interface OverallScorePlotPoint {
  /** Category index in `runOrder` (equal horizontal slots). */
  categoryIndex: number;
  score: number | null;
}

/** Series datum for Overall Score Trend; `runIndex` links clicks/tooltips to `runOrder`. */
export interface OverallScoreSeriesDatum {
  value: number | null;
  runIndex?: number;
  itemStyle?: { color: string; borderColor?: string };
}

/** Matches `grid` in {@link buildOverallScoreChartOptions}. */
export const OVERALL_SCORE_TREND_GRID = TREND_SCORE_CHART_GRID;

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

/** Category-index plot coords aligned with `runOrder` for nearest-point click mapping. */
export const buildOverallScorePlotPoints = (runOrder: TrendsRunPoint[]): OverallScorePlotPoint[] =>
  runOrder.map((point, index) => ({
    categoryIndex: index,
    score: point.overallScore,
  }));

const categoryXRatio = (index: number, count: number): number => {
  if (count <= 1) {
    return 0.5;
  }
  return index / (count - 1);
};

/**
 * Nearest scored run by pixel distance (category axis). Prefer convertToPixel; fall back to
 * equal-slot x mapping + score as y when convert fails (axis-label / outside-plot clicks).
 */
export const resolveNearestOverallScoreDataIndex = (
  convertToPixel: (finder: unknown, value: number | number[]) => unknown,
  offsetX: number,
  offsetY: number,
  points: OverallScorePlotPoint[],
  chartWidth?: number,
  chartHeight?: number,
): number | null => {
  if (points.length === 0) {
    return null;
  }

  const plotTop = OVERALL_SCORE_TREND_GRID.top;
  const plotBottom = (chartHeight ?? 220) - OVERALL_SCORE_TREND_GRID.bottom;
  const plotLeft = OVERALL_SCORE_TREND_GRID.left;
  const plotRight = (chartWidth ?? 0) - OVERALL_SCORE_TREND_GRID.right;
  const plotHeight = plotBottom - plotTop;
  const plotWidth = plotRight - plotLeft;
  const runCount = points.length;

  const toPixel = (categoryIndex: number, score: number): [number, number] | null => {
    const raw = convertToPixel('grid', [categoryIndex, score]);
    if (Array.isArray(raw) && typeof raw[0] === 'number' && typeof raw[1] === 'number') {
      return [raw[0], raw[1]];
    }
    if (chartWidth != null && chartHeight != null && plotWidth > 0 && plotHeight > 0) {
      const x = plotLeft + categoryXRatio(categoryIndex, runCount) * plotWidth;
      const y = plotBottom - score * plotHeight;
      return [x, y];
    }
    return null;
  };

  let bestIndex: number | null = null;
  let bestDist = Infinity;

  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    if (point.score == null) {
      continue;
    }
    const pixel = toPixel(point.categoryIndex, point.score);
    if (pixel == null) {
      continue;
    }
    const [px, py] = pixel;
    const dist = (px - offsetX) ** 2 + (py - offsetY) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
    }
  }

  return bestIndex;
};

const categoryAxisData = (runOrder: TrendsRunPoint[]): string[] => runOrder.map((point) => point.runId);

/** Rough 10px label metrics; deliberately a little generous so the caption is moved rather than clipped. */
const THRESHOLD_LABEL_CHAR_WIDTH_PX = 6;
const THRESHOLD_LABEL_PADDING_PX = 4;

/**
 * Whether the caption, drawn from the start of the segment, would run past the chart's right edge.
 * Only a segment that ends on the last run can: the last run owns just half a slot.
 */
const isLabelClippedAtRightEdge = (
  segment: ThresholdHorizontalSegment,
  caption: string,
  runCount: number,
  plotWidth?: number,
): boolean => {
  if (plotWidth == null || segment.x1 < runCount - 1) {
    return false;
  }
  const gridWidth = plotWidth - OVERALL_SCORE_TREND_GRID.left - OVERALL_SCORE_TREND_GRID.right;
  const segmentWidth = ((segment.x1 - segment.x0) / (runCount - 1)) * gridWidth;
  return caption.length * THRESHOLD_LABEL_CHAR_WIDTH_PX + THRESHOLD_LABEL_PADDING_PX > segmentWidth;
};

type ThresholdLabelPosition = 'insideStartTop' | 'insideStartBottom' | 'insideEndTop' | 'insideEndBottom';

const thresholdLabelPosition = (value: number, isAnchoredToEnd = false): ThresholdLabelPosition => {
  // `insideStartTop` draws the caption above the line. At the axis max the line
  // sits on grid.top (8px) and the 10px caption is clipped. Place it below the line.
  const side = value >= SCORE_AXIS_MAX ? 'Bottom' : 'Top';
  return `${isAnchoredToEnd ? 'insideEnd' : 'insideStart'}${side}`;
};

const thresholdCaption = (caption: string, value: number): string => `${caption} (${value})`;

/** Hover tooltip with the full caption; the on-chart label only carries the short one. */
const buildThresholdTooltip = (thresholdLabel: string, value: number) => ({
  formatter: thresholdCaption(thresholdLabel, value),
});

/** Not silent so hover reaches the mark line; see `createThresholdHoverHandlers`. */
const THRESHOLD_MARK_LINE_INTERACTION = { silent: false, emphasis: { disabled: true } };

const buildFullWidthThresholdMarkLine = (
  value: number,
  thresholdLabel: string,
  thresholdShortLabel: string,
  palette: ThemePalette,
  thresholdColor: string,
) => ({
  ...THRESHOLD_MARK_LINE_INTERACTION,
  symbol: 'none' as const,
  label: {
    show: true,
    position: thresholdLabelPosition(value),
    formatter: thresholdCaption(thresholdShortLabel, value),
    // Figma caption on the threshold line uses primary text (#EEF1F7 / theme text-primary).
    color: palette['text-primary'],
    fontSize: 10,
  },
  lineStyle: {
    color: thresholdColor,
    width: 1,
    type: 'dashed' as const,
  },
  data: [{ yAxis: value, tooltip: buildThresholdTooltip(thresholdLabel, value) }],
});

const buildSegmentThresholdMarkLine = (
  segments: ThresholdMarkSegment[],
  thresholdLabel: string,
  thresholdShortLabel: string,
  palette: ThemePalette,
  thresholdColor: string,
  runCount: number,
  plotWidth?: number,
) => {
  const labeledValues = new Set<number>();

  return {
    ...THRESHOLD_MARK_LINE_INTERACTION,
    symbol: 'none' as const,
    label: { show: false },
    lineStyle: {
      color: thresholdColor,
      width: 1,
      type: 'dashed' as const,
    },
    data: segments.map((segment) => {
      if (segment.kind === 'horizontal') {
        const shouldShowLabel = !labeledValues.has(segment.y);
        labeledValues.add(segment.y);
        const caption = thresholdCaption(thresholdShortLabel, segment.y);
        const isAnchoredToEnd = isLabelClippedAtRightEdge(segment, caption, runCount, plotWidth);
        return [
          {
            coord: [segment.x0, segment.y],
            label: {
              show: shouldShowLabel,
              position: thresholdLabelPosition(segment.y, isAnchoredToEnd),
              formatter: caption,
              color: palette['text-primary'],
              fontSize: 10,
            },
            tooltip: buildThresholdTooltip(thresholdLabel, segment.y),
          },
          { coord: [segment.x1, segment.y] },
        ];
      }
      return [
        {
          coord: [segment.x, segment.y0],
          label: { show: false },
          tooltip: { show: false },
          lineStyle: {
            color: thresholdColor,
            width: 1,
            type: THRESHOLD_VERTICAL_DASH,
          },
        },
        { coord: [segment.x, segment.y1] },
      ];
    }),
  };
};

export const buildOverallScoreChartOptions = (
  palette: ThemePalette,
  runOrder: TrendsRunPoint[],
  labels: OverallChartLabels,
  plotWidth?: number,
): EChartsOption => {
  const passedColor = palette['text-accent-primary'];
  const axisColor = palette['text-secondary'];
  const thresholdColor = palette['stroke-accent-secondary'];
  const scoreAxisMin = 0;
  const scoreAxisMax = SCORE_AXIS_MAX;

  const values: OverallScoreSeriesDatum[] = runOrder.map((point, index) => {
    if (point.overallScore == null) {
      return { value: null, runIndex: index };
    }
    const color = point.isFailed ? palette['text-error'] : passedColor;
    return {
      value: point.overallScore,
      runIndex: index,
      itemStyle: { color, borderColor: color },
    };
  });

  const thresholdLabel = labels.threshold;
  const thresholdShortLabel = labels.thresholdShort ?? thresholdLabel;
  const thresholdPlan =
    thresholdLabel != null
      ? buildThresholdMarkPlan(runOrder.map((point) => point.overallScoreThreshold))
      : { mode: 'none' as const };

  const categoryXAxis = {
    type: 'category' as const,
    data: categoryAxisData(runOrder),
    show: false,
    boundaryGap: false,
  };

  const scoreSeries = {
    type: 'line' as const,
    data: values,
    smooth: false,
    showSymbol: true,
    symbol: 'circle' as const,
    symbolSize: TREND_OVERALL_SYMBOL_SIZE,
    lineStyle: { color: passedColor, width: 2 },
    itemStyle: { color: passedColor },
    areaStyle: { color: passedColor, opacity: 0.2 },
    connectNulls: false,
  };

  const series: EChartsOption['series'] = [scoreSeries];
  let xAxis: EChartsOption['xAxis'] = categoryXAxis;

  if (thresholdPlan.mode === 'fullWidth' && thresholdLabel != null && thresholdShortLabel != null) {
    series[0] = {
      ...scoreSeries,
      markLine: buildFullWidthThresholdMarkLine(
        thresholdPlan.value,
        thresholdLabel,
        thresholdShortLabel,
        palette,
        thresholdColor,
      ),
    };
  } else if (thresholdPlan.mode === 'segments' && thresholdLabel != null && thresholdShortLabel != null) {
    const runCount = runOrder.length;
    xAxis = [
      categoryXAxis,
      {
        type: 'value',
        min: 0,
        // Segment plans require at least two runs; single-run thresholds use a full-width markLine.
        max: runCount - 1,
        show: false,
        axisLabel: { show: false },
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
      },
    ];
    series.push({
      type: 'line',
      xAxisIndex: 1,
      data: [],
      // Not silent: a silent series silences its markLine too, which would kill the hover tooltip.
      markLine: buildSegmentThresholdMarkLine(
        thresholdPlan.segments,
        thresholdLabel,
        thresholdShortLabel,
        palette,
        thresholdColor,
        runCount,
        plotWidth,
      ),
    });
  }

  return {
    title: { show: false },
    tooltip: {
      trigger: 'item',
      triggerOn: 'click',
      hideDelay: 0,
      transitionDuration: 0,
      enterable: true,
      appendTo: typeof document !== 'undefined' ? document.body : undefined,
      confine: false,
      className: OVERALL_SCORE_TREND_TOOLTIP_CLASS,
      ...CHART_TOOLTIP_STYLE,
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
      formatter: (
        params:
          | { dataIndex: number; data?: OverallScoreSeriesDatum }
          | { dataIndex: number; data?: OverallScoreSeriesDatum }[],
      ) => {
        const item = Array.isArray(params) ? params[0] : params;
        if (!item) {
          return '';
        }
        const runIndex = item.data?.runIndex;
        if (runIndex == null) {
          return '';
        }
        const point = runOrder[runIndex];
        if (!point || point.overallScore == null) {
          return '';
        }
        const href = getUrnForEntity(ApplicationRoute.Runs, { id: point.runId, testRunName: point.runName });
        const score = formatScore(point.overallScore);
        return `
          <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;min-width:140px;line-height:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;white-space:nowrap;">
              <a href="${href}" target="_blank" rel="noopener noreferrer"
                 style="display:inline-flex;align-items:center;gap:4px;color:${TREND_TOOLTIP_TEXT_ACCENT};font-weight:600;text-decoration:none;cursor:pointer;">
                <span>${point.runName}</span>
                ${TREND_TOOLTIP_EXTERNAL_LINK_ICON_SVG}
              </a>
              <span style="color:${TREND_TOOLTIP_TEXT_PRIMARY};font-weight:600;">${formatMetricTrendTooltipDate(point.computedAtMs)}</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
              <span style="color:${TREND_TOOLTIP_TEXT_SECONDARY};">${labels.score}</span>
              <span style="color:${TREND_TOOLTIP_TEXT_PRIMARY};font-weight:600;">${score}</span>
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
    xAxis,
    yAxis: {
      type: 'value',
      min: scoreAxisMin,
      max: scoreAxisMax,
      interval: 0.25,
      axisLabel: { show: false },
      splitLine: { lineStyle: { color: palette['bg-layer-1'], width: 1 } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series,
  };
};
