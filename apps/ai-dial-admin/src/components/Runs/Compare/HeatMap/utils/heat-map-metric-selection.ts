import { RunsI18nKey } from '@/src/constants/i18n';

export enum MetricGroupsCheckState {
  Checked = 'checked',
  Unchecked = 'unchecked',
  Indeterminate = 'indeterminate',
}

/** Empty selection is the default and means All. */
export const isAllMetricGroupsSelected = (selected: Set<string>, available: string[]): boolean =>
  available.length > 0 && (selected.size === 0 || available.every((key) => selected.has(key)));

export const getMetricGroupsCheckState = (selected: Set<string>, available: string[]): MetricGroupsCheckState => {
  if (available.length === 0) {
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
  // Empty set is the All sentinel. From All, stay on All; from a subset, reset to All.
  if (isAllMetricGroupsSelected(selected, available)) {
    return new Set();
  }

  return new Set();
};

export const normalizeMetricGroupsSelection = (selected: Set<string>, available: string[]): Set<string> => {
  if (selected.size === 0 || isAllMetricGroupsSelected(selected, available)) {
    return new Set();
  }

  return selected;
};

export const toggleMetricGroup = (selected: Set<string>, groupKey: string, available: string[] = []): Set<string> => {
  const base = selected.size === 0 ? new Set(available) : new Set(selected);

  if (base.has(groupKey)) {
    base.delete(groupKey);
  } else {
    base.add(groupKey);
  }

  return normalizeMetricGroupsSelection(base, available);
};

export const isMetricGroupSelected = (selected: Set<string>, groupKey: string): boolean =>
  selected.size === 0 || selected.has(groupKey);

/**
 * Default selection is All (empty set sentinel).
 * First availability report marks selection initialized without forcing keys.
 * Later reports keep the user's selection, dropping groups that are no longer available.
 */
export const resolveMetricGroupsSelection = (
  availableGroups: string[],
  previousSelection: Set<string>,
  isInitialized: boolean,
): { selection: Set<string>; isInitialized: boolean } => {
  if (!availableGroups.length) {
    return { selection: previousSelection, isInitialized };
  }

  if (!isInitialized) {
    return { selection: new Set(), isInitialized: true };
  }

  const available = new Set(availableGroups);
  const next = new Set([...previousSelection].filter((groupKey) => available.has(groupKey)));
  return {
    selection: normalizeMetricGroupsSelection(next, availableGroups),
    isInitialized: true,
  };
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
