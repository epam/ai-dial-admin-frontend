/** Number of Y ticks including 0 (Figma Cost / Runtime trend). */
export const COMBO_TREND_Y_TICK_COUNT = 5;

/** Width reserved left of the bordered plot for combo Y labels (Figma 48px). */
export const COMBO_TREND_Y_LABEL_WIDTH_PX = 48;

/** Bordered plot height from Figma 12405:243511 / 12405:243610. */
export const COMBO_TREND_PLOT_HEIGHT_PX = 211;

/**
 * Rounds `value` up to a "nice" magnitude (1 / 2 / 2.5 / 3 / 5 × 10^n) so axis ceilings
 * stay tight (e.g. 117 → 120 via step 30×4, not 200).
 */
export const niceCeil = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }
  const exp = Math.floor(Math.log10(value));
  const magnitude = 10 ** exp;
  const fraction = value / magnitude;
  let niceFraction: number;
  if (fraction <= 1) {
    niceFraction = 1;
  } else if (fraction <= 2) {
    niceFraction = 2;
  } else if (fraction <= 2.5) {
    niceFraction = 2.5;
  } else if (fraction <= 3) {
    niceFraction = 3;
  } else if (fraction <= 5) {
    niceFraction = 5;
  } else {
    niceFraction = 10;
  }
  return niceFraction * magnitude;
};

/**
 * Nice step for equal tick spacing: ceil the rough step, then multiply by tick gaps.
 * Keeps ceilings like 120 for max≈117 instead of jumping to 200.
 */
export const niceStep = (value: number): number => niceCeil(value);

/**
 * Five equally spaced ticks from a nice ceiling down to 0 for the combo trend Y axis.
 * When `maxValue` is 0 or missing, returns a unit scale `[1, 0.75, 0.5, 0.25, 0]`.
 */
export const buildComboYTicks = (maxValue: number): number[] => {
  if (!Number.isFinite(maxValue) || maxValue <= 0) {
    return [1, 0.75, 0.5, 0.25, 0];
  }
  const gaps = COMBO_TREND_Y_TICK_COUNT - 1;
  const step = niceStep(maxValue / gaps);
  const ceiling = step * gaps;
  return Array.from({ length: COMBO_TREND_Y_TICK_COUNT }, (_, index) => {
    const tick = ceiling - step * index;
    // Keep the bottom tick exact 0; snap near-zero float noise.
    return index === COMBO_TREND_Y_TICK_COUNT - 1 ? 0 : Math.round(tick * 1e9) / 1e9;
  });
};
