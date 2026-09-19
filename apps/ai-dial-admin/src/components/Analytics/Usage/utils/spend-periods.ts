import { SpendBucket, SpendPeriod, SpendScale, SpendScaleUnit } from '@/src/components/Analytics/Usage/models';
import {
  SPEND_DAY_COUNT,
  SPEND_MONTH_COUNT,
  SPEND_SCALE_THRESHOLD_DAYS,
} from '@/src/components/Analytics/Usage/constants';
import { TimeRange } from '@/src/models/time-range';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Spend is read on a calendar scale of its own, not on the page's window.
 *
 * A window of hours bucketed at the page's own resolution turns a month's budget into a row of
 * ten-minute bars: it says nothing about whether spending is unusual. Two weeks of days answers
 * that for any short window, and a window already spanning more than a week is asking a question
 * about months.
 */
export const getSpendScale = (window: TimeRange): SpendScale => {
  const lengthMs = window.endDate.getTime() - window.startDate.getTime();

  return lengthMs > SPEND_SCALE_THRESHOLD_DAYS * MS_PER_DAY
    ? { unit: SpendScaleUnit.Month, count: SPEND_MONTH_COUNT }
    : { unit: SpendScaleUnit.Day, count: SPEND_DAY_COUNT };
};

/**
 * The scale's periods are UTC calendar periods, because that is what the backend's `date_trunc`
 * produces — folding them into local days would split a bucket the query already closed.
 */
const startOfPeriod = (date: Date, unit: SpendScaleUnit): number =>
  unit === SpendScaleUnit.Month
    ? Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)
    : Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

const stepPeriod = (startMs: number, unit: SpendScaleUnit, amount: number): number => {
  const date = new Date(startMs);

  return unit === SpendScaleUnit.Month
    ? Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1)
    : Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + amount);
};

/** The range the spend query has to cover to fill the scale. */
export const getSpendRange = (window: TimeRange, scale: SpendScale): TimeRange => ({
  startDate: new Date(stepPeriod(startOfPeriod(window.endDate, scale.unit), scale.unit, -(scale.count - 1))),
  endDate: window.endDate,
});

/**
 * Lays the truncated buckets onto the scale, so a period with no spend is a gap in the row rather
 * than a missing bar. The last period is the one the window ends in — still filling up, and marked
 * so the chart can pick it out.
 */
export const buildSpendPeriods = (buckets: SpendBucket[], window: TimeRange, scale: SpendScale): SpendPeriod[] => {
  const anchor = startOfPeriod(window.endDate, scale.unit);

  const periods: SpendPeriod[] = Array.from({ length: scale.count }, (_, index) => {
    const offset = scale.count - 1 - index;
    const startMs = stepPeriod(anchor, scale.unit, -offset);

    return {
      startMs,
      endMs: stepPeriod(startMs, scale.unit, 1),
      spend: 0,
      isCurrent: offset === 0,
    };
  });

  const byStart = new Map(periods.map((period) => [period.startMs, period]));

  for (const bucket of buckets) {
    const period = byStart.get(startOfPeriod(new Date(bucket.bucketMs), scale.unit));

    if (period) {
      period.spend += bucket.spend;
    }
  }

  return periods;
};
