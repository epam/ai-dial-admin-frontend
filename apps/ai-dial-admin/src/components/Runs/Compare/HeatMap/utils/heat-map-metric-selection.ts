import { RunsI18nKey } from '@/src/constants/i18n';

export const isAllMetricGroupsSelected = (selected: Set<string>, available: string[]): boolean =>
  available.length > 0 && available.every((key) => selected.has(key));

export const toggleAllMetricGroups = (selected: Set<string>, available: string[]): Set<string> => {
  if (isAllMetricGroupsSelected(selected, available)) {
    return new Set();
  }

  return new Set(available);
};

export const toggleMetricGroup = (selected: Set<string>, groupKey: string): Set<string> => {
  const next = new Set(selected);

  if (next.has(groupKey)) {
    next.delete(groupKey);
  } else {
    next.add(groupKey);
  }

  return next;
};

export const formatHeatMapMetricsTriggerLabel = (
  selected: Set<string>,
  available: string[],
  t: (key: RunsI18nKey) => string,
): string => {
  if (available.length === 0 || isAllMetricGroupsSelected(selected, available)) {
    return t(RunsI18nKey.RunCompareHeatMapMetricsAll);
  }

  const selectedLabels = available.filter((key) => selected.has(key));
  return `${t(RunsI18nKey.RunCompareHeatMapMetricsPrefix)} ${selectedLabels.join(', ')}`;
};
