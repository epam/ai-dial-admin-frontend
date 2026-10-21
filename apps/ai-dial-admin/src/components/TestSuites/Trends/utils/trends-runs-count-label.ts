import { TRENDS_RUN_WINDOW } from '@/src/components/TestSuites/Trends/constants';
import { TestSuitesI18nKey } from '@/src/constants/i18n';

type Translate = (key: string, values?: Record<string, string | number>) => string;

/**
 * Trends shows at most {@link TRENDS_RUN_WINDOW} runs. A full window uses "Last N Runs";
 * fewer runs use the plain "{count} Run(s)" label (singular when count is 1).
 */
export const getTrendsRunsCountI18nKey = (runCount: number): TestSuitesI18nKey =>
  runCount >= TRENDS_RUN_WINDOW ? TestSuitesI18nKey.TrendsLastNRuns : TestSuitesI18nKey.TrendsRunsCount;

export const formatTrendsRunsCountLabel = (t: Translate, runCount: number): string => {
  const key = getTrendsRunsCountI18nKey(runCount);
  const count = key === TestSuitesI18nKey.TrendsLastNRuns ? TRENDS_RUN_WINDOW : runCount;
  return t(key, { count });
};
