import { RunsI18nKey } from '@/src/constants/i18n';

import { MetricStatistic } from './models';

/** Section description copy per statistic (Run Summary / Compare Metric Scores). */
export const METRIC_STATISTIC_DESCRIPTIONS: Record<MetricStatistic, RunsI18nKey> = {
  [MetricStatistic.Avg]: RunsI18nKey.MetricScoresDescriptionAvg,
  [MetricStatistic.P90]: RunsI18nKey.MetricScoresDescriptionP90,
  [MetricStatistic.P10]: RunsI18nKey.MetricScoresDescriptionP10,
  [MetricStatistic.Max]: RunsI18nKey.MetricScoresDescriptionMax,
  [MetricStatistic.Min]: RunsI18nKey.MetricScoresDescriptionMin,
  [MetricStatistic.Med]: RunsI18nKey.MetricScoresDescriptionMed,
  [MetricStatistic.Count]: RunsI18nKey.MetricScoresDescriptionCount,
};

/**
 * Segmented-control order for Metric Scores / Metric Trends (Figma Run Summary:
 * avg → p90 → p10 → max → med → min; COUNT follows known product stats).
 */
export const METRIC_STATISTIC_ORDER: readonly MetricStatistic[] = [
  MetricStatistic.Avg,
  MetricStatistic.P90,
  MetricStatistic.P10,
  MetricStatistic.Max,
  MetricStatistic.Med,
  MetricStatistic.Min,
  MetricStatistic.Count,
];
