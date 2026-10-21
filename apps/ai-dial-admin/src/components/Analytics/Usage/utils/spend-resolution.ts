import { TimeRange } from '@/src/models/time-range';
import { ChartResolution } from '@/src/utils/time-filter/get-chart-resolution';

/**
 * Bars the spend plot aims for. The page's own resolution targets up to 200 points, which reads as a
 * line but not as a row of bars: at that density a month of spend is a comb, and the eye has nothing
 * to compare. Around a dozen and a half is where a bar has width and the row still shows a trend.
 */
export const SPEND_TARGET_BARS = 16;

/**
 * Steps a bin may take, in minutes, ascending. Each is a size a reader recognizes — a quarter hour,
 * a day, a week — rather than the window divided by the target, which would label the axis with
 * 37-minute bins. Every step is expressible as `date_bin`'s own unit and amount, which keeps a
 * padded bucket on the timestamp the backend would have given it.
 */
const NICE_STEPS_MINUTES = [1, 5, 15, 30, 60, 120, 180, 360, 720, 1440, 2880, 10080, 20160, 43200];

const MINUTES_PER_DAY = 1440;
const MINUTES_PER_HOUR = 60;

const toResolution = (minutes: number): ChartResolution => {
  if (minutes % MINUTES_PER_DAY === 0) {
    return { value: minutes / MINUTES_PER_DAY, unit: 'd' };
  }

  if (minutes % MINUTES_PER_HOUR === 0) {
    return { value: minutes / MINUTES_PER_HOUR, unit: 'h' };
  }

  return { value: minutes, unit: 'm' };
};

/**
 * The bin that cuts this window into a full-looking row of bars.
 *
 * The window is the page's, so spend answers the same question as every other plot on it; only the
 * bin differs. It is the smallest recognizable step at or above the window divided by the target
 * count, so the row holds about that many bars and never many more. A window shorter than the
 * smallest step gets that step and a single bar; one longer than the largest gets the largest,
 * which is the widest cut this axis can label.
 */
export const getSpendResolution = (window: TimeRange): ChartResolution => {
  const durationMinutes = (window.endDate.getTime() - window.startDate.getTime()) / (60 * 1000);
  const targetStep = durationMinutes / SPEND_TARGET_BARS;
  const step = NICE_STEPS_MINUTES.find((candidate) => candidate >= targetStep);

  return toResolution(step ?? NICE_STEPS_MINUTES[NICE_STEPS_MINUTES.length - 1]);
};
