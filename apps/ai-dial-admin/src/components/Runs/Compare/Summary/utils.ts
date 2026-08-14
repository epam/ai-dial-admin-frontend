import { sortMetricStatistics } from '@/src/components/Common/MetricStatistics/utils';
import { MetricOption, MetricScoresData } from '@/src/components/Runs/Summary/models';
import { getMetricStatCards } from '@/src/components/Runs/Summary/utils';

import { CompareBarGroup, CompareMetricStatCard } from './models';

/** Statistics present on both runs, in canonical Metric Scores control order. */
export const intersectStatistics = (primary: string[], compared: string[]): string[] =>
  sortMetricStatistics(primary.filter((statistic) => compared.includes(statistic)));

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

/**
 * Aligns primary/compared bar groups for a statistic. Primary group order is preserved;
 * compared-only groups are appended. Empty bar maps are used when a side is missing a group.
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
    return {
      name,
      data: primaryGroup?.bars ?? {},
      compareData: comparedGroup?.bars ?? {},
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

export const maxBarValue = (data: Record<string, number>, compareData: Record<string, number>): number =>
  Math.max(1, ...Object.values(data), ...Object.values(compareData));
