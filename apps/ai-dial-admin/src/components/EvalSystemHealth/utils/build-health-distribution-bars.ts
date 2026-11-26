import { HealthDistributionBar } from '@/src/components/EvalSystemHealth/models';
import { GROUPING_LOCALE } from '@/src/components/Analytics/Usage/utils/format';
import { HealthDistributionWeek } from '@/src/models/evaluation/health-distribution';

/** Weeks are bucketed in UTC by the backend, so they are named in UTC: the viewer's zone would rename a Monday. */
const WEEK_LABEL_FORMAT = new Intl.DateTimeFormat(GROUPING_LOCALE, { month: 'short', day: 'numeric', timeZone: 'UTC' });

const roundToTenth = (value: number): number => Math.round(value * 10) / 10;

/**
 * Turns the backend's weeks into the chart's bars, in the order given. The failing share is what the healthy
 * share leaves of 100, not a second rounding: two independently rounded shares can add to 99.9 or 100.1.
 */
export const buildHealthDistributionBars = (weeks: HealthDistributionWeek[]): HealthDistributionBar[] =>
  weeks.map(({ weekStart, healthyCount, failingCount, suiteCount }) => {
    const healthyShare = suiteCount > 0 ? roundToTenth((healthyCount / suiteCount) * 100) : null;

    return {
      weekStart,
      label: WEEK_LABEL_FORMAT.format(weekStart),
      healthyCount,
      failingCount,
      suiteCount,
      healthyShare,
      failingShare: healthyShare == null ? null : roundToTenth(100 - healthyShare),
    };
  });
