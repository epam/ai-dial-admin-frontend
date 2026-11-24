/**
 * One UTC week of the health distribution. `suiteCount` is always `healthyCount + failingCount`: the test
 * suites that had at least one run with a non-zero test case total in the week.
 */
export interface HealthDistributionWeek {
  /** Monday 00:00:00.000 UTC of the week, in epoch milliseconds. */
  weekStart: number;
  /** Suites whose pooled weekly pass rate is at or above the threshold. */
  healthyCount: number;
  /** Suites whose pooled weekly pass rate is below the threshold. */
  failingCount: number;
  suiteCount: number;
}

export interface HealthDistribution {
  /** The threshold the backend applied: the one requested, or its default. */
  threshold: number;
  /** Exactly the requested number of weeks, oldest first, the last holding the current time. */
  weeks: HealthDistributionWeek[];
}
