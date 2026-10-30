import { ReactNode } from 'react';

import { sortMetricStatistics } from '@/src/components/Common/MetricStatistics/utils';
import { CompareRun } from '@/src/components/Runs/Compare/models';
import { MetricOption, MetricScoresData, RunAnalyticsSlice } from '@/src/components/Runs/Summary/models';
import {
  getCompletionRate,
  getMetricStatCards,
  hasOverallScoreThreshold,
  sumRunTimeParts,
  toCompletionBreakdown,
} from '@/src/components/Runs/Summary/utils';
import { Run } from '@/src/models/evaluation/run';

import { CompareBarGroup, CompareCardItems, CompareMetricStatCard, CompareSideFigures } from './models';

/** Titled values for a compare card, one per run, in the order the runs are displayed. */
export const toCompareCardItems = (runs: CompareRun[], getValue: (run: CompareRun) => ReactNode): CompareCardItems => {
  const [first, second] = runs.map((run) => ({ title: run.name, value: getValue(run) }));
  return [first, second];
};

/** Statistics present on either run, in canonical Metric Scores control order. */
export const unionStatistics = (primary: string[], compared: string[]): string[] =>
  sortMetricStatistics([...new Set([...primary, ...compared])]);

/** Unions metric dropdown options by name; primary options win on collision. Sorted A–Z to match Metric Scores. */
export const unionMetricOptions = (primary: MetricOption[], compared: MetricOption[]): MetricOption[] => {
  const byName = new Map<string, MetricOption>();
  for (const option of primary) {
    byName.set(option.name, option);
  }
  for (const option of compared) {
    if (!byName.has(option.name)) {
      byName.set(option.name, option);
    }
  }
  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
};

/** Unions bar keys; missing side gets explicit null so AnalyticsBar can show "—". */
const alignBarMaps = (
  primaryBars: Record<string, number | null>,
  comparedBars: Record<string, number | null>,
): { data: Record<string, number | null>; compareData: Record<string, number | null> } => {
  const keys = new Set([...Object.keys(primaryBars), ...Object.keys(comparedBars)]);
  const data: Record<string, number | null> = {};
  const compareData: Record<string, number | null> = {};

  for (const key of keys) {
    data[key] = key in primaryBars ? primaryBars[key] : null;
    compareData[key] = key in comparedBars ? comparedBars[key] : null;
  }

  return { data, compareData };
};

/**
 * Aligns primary/compared bar groups for a statistic. Primary group order is preserved;
 * compared-only groups are appended. Missing bar keys are filled with null on the other side.
 */
export const getCompareBarGroups = (
  primary: MetricScoresData | null,
  compared: MetricScoresData | null,
  statistic: string | null,
): CompareBarGroup[] => {
  if (!statistic || !primary) {
    return [];
  }

  const primaryGroups = primary.byStatistic[statistic] ?? [];
  const comparedGroups = compared?.byStatistic[statistic] ?? [];
  const comparedByName = new Map(comparedGroups.map((group) => [group.name, group]));

  const names = primaryGroups.map((group) => group.name);
  for (const group of comparedGroups) {
    if (!names.includes(group.name)) {
      names.push(group.name);
    }
  }

  return names.map((name) => {
    const primaryGroup = primaryGroups.find((group) => group.name === name);
    const comparedGroup = comparedByName.get(name);
    const { data, compareData } = alignBarMaps(primaryGroup?.bars ?? {}, comparedGroup?.bars ?? {});
    return {
      name,
      data,
      compareData,
      description: primaryGroup?.description ?? comparedGroup?.description,
      barDescriptions: primaryGroup?.barDescriptions ?? comparedGroup?.barDescriptions,
    };
  });
};

/** Dual per-statistic values for a selected metric, in primary statistics order then extras. */
export const getCompareMetricStatCards = (
  primary: MetricScoresData | null,
  compared: MetricScoresData | null,
  metricName: string | null,
): CompareMetricStatCard[] => {
  const primaryCards = getMetricStatCards(primary, metricName);
  const comparedCards = getMetricStatCards(compared, metricName);
  const comparedByName = new Map(comparedCards.map((card) => [card.name, card.value]));

  const names = primaryCards.map((card) => card.name);
  for (const card of comparedCards) {
    if (!names.includes(card.name)) {
      names.push(card.name);
    }
  }

  const primaryByName = new Map(primaryCards.map((card) => [card.name, card.value]));

  return names.map((name) => ({
    name,
    primaryValue: primaryByName.get(name) ?? null,
    comparedValue: comparedByName.get(name) ?? null,
  }));
};

export const maxBarValue = (
  data: Record<string, number | null>,
  compareData: Record<string, number | null>,
): number => {
  const values = [...Object.values(data), ...Object.values(compareData)].filter(
    (value): value is number => value != null,
  );
  return Math.max(1, ...values);
};

/** Per-run figures for the Summary KPI cards, from the run's snapshotted threshold and its analytics slice. */
export const toCompareSideFigures = (run: Run, slice: RunAnalyticsSlice): CompareSideFigures => {
  const threshold = run.suiteSnapshot?.overallScoreThreshold ?? null;
  const hasThreshold = hasOverallScoreThreshold(threshold);
  const breakdown = toCompletionBreakdown(slice.statusCounts, hasThreshold);

  return {
    threshold,
    hasThreshold,
    breakdown,
    rate: getCompletionRate(breakdown, hasThreshold),
    sourceMs: slice.totalRunTimeMs,
    metricsMs: slice.totalMetricEvalDurationMs,
    totalMs: sumRunTimeParts(slice.totalRunTimeMs, slice.totalMetricEvalDurationMs),
  };
};

/** A rate as a percentage with one decimal, the unit the rate card's diff badge is measured in. */
export const toRatePercent = (rate: number | null): number | null =>
  rate == null ? null : Math.round(rate * 1000) / 10;
