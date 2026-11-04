/**
 * Per-run Overall Score threshold geometry for the Trends chart.
 *
 * Each run `i` of `n` owns `[i === 0 ? 0 : i - 0.5, i === n - 1 ? n - 1 : i + 0.5]`
 * on a hidden value x-axis aligned with category slots (`boundaryGap: false`).
 * Neighboring runs with the same threshold merge into one horizontal segment;
 * a change adds a vertical join at the shared boundary; a missing threshold
 * breaks the line.
 */

export interface ThresholdHorizontalSegment {
  kind: 'horizontal';
  x0: number;
  x1: number;
  y: number;
}

export interface ThresholdVerticalJoin {
  kind: 'vertical';
  x: number;
  y0: number;
  y1: number;
}

export type ThresholdMarkSegment = ThresholdHorizontalSegment | ThresholdVerticalJoin;

export type ThresholdMarkPlan =
  | { mode: 'none' }
  | { mode: 'fullWidth'; value: number }
  | { mode: 'segments'; segments: ThresholdMarkSegment[] };

interface RunSpan {
  left: number;
  right: number;
}

interface ThresholdGroup {
  startIndex: number;
  endIndex: number;
  value: number;
}

/** Horizontal span owned by run `index` when there are `runCount` category slots. */
export const runThresholdSpan = (index: number, runCount: number): RunSpan => ({
  left: index === 0 ? 0 : index - 0.5,
  right: index === runCount - 1 ? runCount - 1 : index + 0.5,
});

const groupConsecutiveThresholds = (thresholds: (number | null | undefined)[]): ThresholdGroup[] => {
  const groups: ThresholdGroup[] = [];
  let current: ThresholdGroup | null = null;

  for (let i = 0; i < thresholds.length; i += 1) {
    const value = thresholds[i];
    if (value == null) {
      current = null;
      continue;
    }
    if (current != null && current.value === value && current.endIndex === i - 1) {
      current.endIndex = i;
      continue;
    }
    current = { startIndex: i, endIndex: i, value };
    groups.push(current);
  }

  return groups;
};

/**
 * Build the markLine plan for per-run snapshot thresholds.
 * A single run with a threshold uses a full-width `yAxis` line (a 0..0 value
 * axis would collapse). Multiple runs use value-axis segments.
 */
export const buildThresholdMarkPlan = (thresholds: (number | null | undefined)[]): ThresholdMarkPlan => {
  const runCount = thresholds.length;
  if (runCount === 0) {
    return { mode: 'none' };
  }

  if (runCount === 1) {
    const value = thresholds[0];
    return value == null ? { mode: 'none' } : { mode: 'fullWidth', value };
  }

  const groups = groupConsecutiveThresholds(thresholds);
  if (groups.length === 0) {
    return { mode: 'none' };
  }

  const segments: ThresholdMarkSegment[] = [];

  for (let g = 0; g < groups.length; g += 1) {
    const group = groups[g];
    const left = runThresholdSpan(group.startIndex, runCount).left;
    const right = runThresholdSpan(group.endIndex, runCount).right;
    segments.push({ kind: 'horizontal', x0: left, x1: right, y: group.value });

    const next = groups[g + 1];
    if (next != null && next.startIndex === group.endIndex + 1) {
      segments.push({
        kind: 'vertical',
        x: right,
        y0: group.value,
        y1: next.value,
      });
    }
  }

  return { mode: 'segments', segments };
};
