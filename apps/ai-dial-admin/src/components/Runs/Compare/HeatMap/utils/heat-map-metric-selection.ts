import { RunsI18nKey } from '@/src/constants/i18n';

export enum MetricGroupsCheckState {
  Checked = 'checked',
  Unchecked = 'unchecked',
  Indeterminate = 'indeterminate',
}

export const isAllMetricGroupsSelected = (selected: Set<string>, available: string[]): boolean =>
  available.length > 0 && available.every((key) => selected.has(key));

export const getMetricGroupsCheckState = (selected: Set<string>, available: string[]): MetricGroupsCheckState => {
  if (available.length === 0 || selected.size === 0) {
    return MetricGroupsCheckState.Unchecked;
  }

  if (isAllMetricGroupsSelected(selected, available)) {
    return MetricGroupsCheckState.Checked;
  }

  return MetricGroupsCheckState.Indeterminate;
};

export const filterMetricGroupsBySearch = (query: string, groups: string[]): string[] => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return groups;
  }

  return groups.filter((groupKey) => groupKey.toLowerCase().includes(normalizedQuery));
};

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

  const selectedCount = available.filter((key) => selected.has(key)).length;
  return `${t(RunsI18nKey.RunCompareHeatMapMetricsPrefix)} ${selectedCount}/${available.length}`;
};
