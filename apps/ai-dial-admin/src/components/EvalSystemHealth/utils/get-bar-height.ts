/** Share of the chart height a bar never goes below, so a pass rate of 0% is still a visible mark. */
export const MIN_BAR_HEIGHT_PERCENT = 4;

/** Height of a run's bar as a percentage of the chart: its 0–1 pass rate on a fixed 0–100% scale. */
export const getBarHeightPercent = (rate: number): number =>
  Math.max(MIN_BAR_HEIGHT_PERCENT, Math.min(100, rate * 100));
