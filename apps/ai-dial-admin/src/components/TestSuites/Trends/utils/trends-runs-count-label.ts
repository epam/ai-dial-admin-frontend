import { TRENDS_RUN_WINDOW } from '@/src/components/TestSuites/Trends/constants';
import { TestSuitesI18nKey } from '@/src/constants/i18n';

type Translate = (key: string, values?: Record<string, string | number>) => string;

/**
 * Trends shows at most {@link TRENDS_RUN_WINDOW} runs. When the window is full,
 * the suite may have more runs, so the label is "Last N Runs" instead of "N Runs".
 */
export const getTrendsRunsCountI18nKey = (runCount: number): TestSuitesI18nKey =>
  runCount >= TRENDS_RUN_WINDOW ? TestSuitesI18nKey.TrendsLastNRuns : TestSuitesI18nKey.TrendsRunsCount;

export const formatTrendsRunsCountLabel = (t: Translate, runCount: number): string =>
  t(getTrendsRunsCountI18nKey(runCount), { count: runCount });
