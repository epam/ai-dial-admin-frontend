import { RunsI18nKey } from '@/src/constants/i18n';

import { METRIC_STATISTIC_DESCRIPTIONS, METRIC_STATISTIC_ORDER } from './constants';
import { MetricStatistic } from './models';

/** Orders statistic names for Metric Scores / Metric Trends segmented controls. */
export const sortMetricStatistics = (statistics: string[]): string[] => {
  const rank = new Map(METRIC_STATISTIC_ORDER.map((name, index) => [name, index]));
  return [...statistics].sort((a, b) => {
    const rankA = rank.get(a as MetricStatistic) ?? Number.MAX_SAFE_INTEGER;
    const rankB = rank.get(b as MetricStatistic) ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return statistics.indexOf(a) - statistics.indexOf(b);
  });
};

/** i18n key for a statistic's Metric Scores description, if the name is a known statistic. */
export const getMetricStatisticDescriptionKey = (statistic: string | null | undefined): RunsI18nKey | undefined => {
  if (statistic == null) {
    return undefined;
  }
  return METRIC_STATISTIC_DESCRIPTIONS[statistic as MetricStatistic];
};
