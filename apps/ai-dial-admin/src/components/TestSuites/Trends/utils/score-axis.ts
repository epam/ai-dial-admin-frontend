export const TREND_SCORE_CHART_GRID = { left: 4, right: 8, bottom: 4, top: 8 } as const;

export const TREND_SCORE_Y_TICKS = [1, 0.75, 0.5, 0.25, 0] as const;

export const TREND_SCORE_Y_LABEL_WIDTH_PX = 32;

export const formatTrendScoreYTick = (value: number): string =>
  value === 0 || value === 1 ? String(value) : value.toFixed(2);
