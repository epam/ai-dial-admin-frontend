/**
 * Max distinct suite ids per `POST /api/v1/analytics/test-suites/pass-rate` request
 * (backend ValidationConstants.MAX_BATCH_SUITE_IDS).
 */
export const SUITE_PASS_RATE_BATCH_SIZE = 100;

/** Response from `POST /api/v1/analytics/test-suites/pass-rate`. Rates are 0–1. */
export interface SuitePassRateSummary {
  /** Mean latest-run pass rate; null when no suite contributed. */
  passRate: number | null;
  /** Mean previous-run pass rate; null when no suite contributed a previous run. */
  previousPassRate: number | null;
  /** Suites behind `passRate`. */
  suiteCount: number;
  /** Suites behind `previousPassRate`. */
  previousSuiteCount: number;
}

export type PassRateTrend = 'up' | 'down';

export const EMPTY_SUITE_PASS_RATE_SUMMARY: SuitePassRateSummary = {
  passRate: null,
  previousPassRate: null,
  suiteCount: 0,
  previousSuiteCount: 0,
};

export const chunkSuiteIds = (suiteIds: string[], size: number = SUITE_PASS_RATE_BATCH_SIZE): string[][] => {
  const ids = [...new Set(suiteIds.filter(Boolean))];
  const batches: string[][] = [];
  for (let offset = 0; offset < ids.length; offset += size) {
    batches.push(ids.slice(offset, offset + size));
  }
  return batches;
};

const weightedMean = (parts: { rate: number | null; count: number }[]): number | null => {
  let weightedSum = 0;
  let totalCount = 0;
  for (const part of parts) {
    if (part.rate == null || part.count <= 0) {
      continue;
    }
    weightedSum += part.rate * part.count;
    totalCount += part.count;
  }
  if (totalCount === 0) {
    return null;
  }
  return weightedSum / totalCount;
};

/**
 * Combines batch summaries with a suite-weighted mean so each suite still counts once across batches.
 */
export const combineSuitePassRateSummaries = (summaries: SuitePassRateSummary[]): SuitePassRateSummary => {
  if (summaries.length === 0) {
    return { ...EMPTY_SUITE_PASS_RATE_SUMMARY };
  }

  const suiteCount = summaries.reduce((sum, item) => sum + item.suiteCount, 0);
  const previousSuiteCount = summaries.reduce((sum, item) => sum + item.previousSuiteCount, 0);

  return {
    passRate: weightedMean(summaries.map((item) => ({ rate: item.passRate, count: item.suiteCount }))),
    previousPassRate: weightedMean(
      summaries.map((item) => ({ rate: item.previousPassRate, count: item.previousSuiteCount })),
    ),
    suiteCount,
    previousSuiteCount,
  };
};

/** Higher pass rate is better; null when either side is missing or the rates are equal. */
export const getPassRateTrend = (passRate: number | null, previousPassRate: number | null): PassRateTrend | null => {
  if (passRate == null || previousPassRate == null || passRate === previousPassRate) {
    return null;
  }
  return passRate > previousPassRate ? 'up' : 'down';
};
