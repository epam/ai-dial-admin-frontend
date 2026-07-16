import { describe, expect, test } from 'vitest';

import { HeatMapRowType } from '@/src/components/Runs/Compare/HeatMap/models';
import { filterHeatMapRowsByMetricGroups } from '@/src/components/Runs/Compare/HeatMap/utils/build-heat-map-rows';
import {
  filterMetricGroupsBySearch,
  formatHeatMapMetricsTriggerLabel,
  getMetricGroupsCheckState,
  isAllMetricGroupsSelected,
  MetricGroupsCheckState,
  resolveMetricGroupsSelection,
  toggleAllMetricGroups,
  toggleMetricGroup,
} from '@/src/components/Runs/Compare/HeatMap/utils/heat-map-metric-selection';
import { RunsI18nKey } from '@/src/constants/i18n';

const t = (key: RunsI18nKey) => key;

describe('filterHeatMapRowsByMetricGroups', () => {
  test('keeps only rows for selected metric groups', () => {
    const rows = [
      { id: 'g1', rowType: HeatMapRowType.Group, groupKey: 'Accuracy', label: 'Accuracy', values: {} },
      { id: 'm1', rowType: HeatMapRowType.Metric, groupKey: 'Accuracy', label: 'precision', values: {} },
      { id: 'g2', rowType: HeatMapRowType.Group, groupKey: 'Quality', label: 'Quality', values: {} },
      { id: 'm2', rowType: HeatMapRowType.Metric, groupKey: 'Quality', label: 'score', values: {} },
    ];

    const filtered = filterHeatMapRowsByMetricGroups(rows, new Set(['Accuracy']));

    expect(filtered.map((row) => row.id)).toEqual(['g1', 'm1']);
  });

  test('keeps all rows when selection is empty (All sentinel)', () => {
    const rows = [
      { id: 'g1', rowType: HeatMapRowType.Group, groupKey: 'Accuracy', label: 'Accuracy', values: {} },
      { id: 'm1', rowType: HeatMapRowType.Metric, groupKey: 'Accuracy', label: 'precision', values: {} },
      { id: 'g2', rowType: HeatMapRowType.Group, groupKey: 'Quality', label: 'Quality', values: {} },
    ];

    expect(filterHeatMapRowsByMetricGroups(rows, new Set()).map((row) => row.id)).toEqual(['g1', 'm1', 'g2']);
  });
});

describe('isAllMetricGroupsSelected', () => {
  test('returns true when every available group is selected', () => {
    expect(isAllMetricGroupsSelected(new Set(['A', 'B']), ['A', 'B'])).toBe(true);
  });

  test('returns true for empty selection (All sentinel)', () => {
    expect(isAllMetricGroupsSelected(new Set(), ['A', 'B'])).toBe(true);
  });

  test('returns false when available is empty or selection is partial', () => {
    expect(isAllMetricGroupsSelected(new Set(['A']), ['A', 'B'])).toBe(false);
    expect(isAllMetricGroupsSelected(new Set(), [])).toBe(false);
  });
});

describe('getMetricGroupsCheckState', () => {
  test('returns checked when every group is selected', () => {
    expect(getMetricGroupsCheckState(new Set(['A', 'B']), ['A', 'B'])).toBe(MetricGroupsCheckState.Checked);
  });

  test('returns checked for empty selection (All sentinel)', () => {
    expect(getMetricGroupsCheckState(new Set(), ['A', 'B'])).toBe(MetricGroupsCheckState.Checked);
  });

  test('returns unchecked when available is empty', () => {
    expect(getMetricGroupsCheckState(new Set(['A']), [])).toBe(MetricGroupsCheckState.Unchecked);
  });

  test('returns indeterminate for partial selection', () => {
    expect(getMetricGroupsCheckState(new Set(['A']), ['A', 'B'])).toBe(MetricGroupsCheckState.Indeterminate);
  });
});

describe('filterMetricGroupsBySearch', () => {
  const groups = ['Overall Accuracy', 'Context Appropriateness', 'Precision Score'];

  test('returns all groups when query is empty', () => {
    expect(filterMetricGroupsBySearch('', groups)).toEqual(groups);
    expect(filterMetricGroupsBySearch('   ', groups)).toEqual(groups);
  });

  test('filters groups case-insensitively', () => {
    expect(filterMetricGroupsBySearch('accuracy', groups)).toEqual(['Overall Accuracy']);
    expect(filterMetricGroupsBySearch('PRECISION', groups)).toEqual(['Precision Score']);
  });
});

describe('toggleAllMetricGroups', () => {
  test('selects all (empty sentinel) when not all are selected', () => {
    expect(toggleAllMetricGroups(new Set(['A']), ['A', 'B'])).toEqual(new Set());
  });

  test('keeps all (empty sentinel) when all groups are already selected', () => {
    expect(toggleAllMetricGroups(new Set(['A', 'B']), ['A', 'B'])).toEqual(new Set());
    expect(toggleAllMetricGroups(new Set(), ['A', 'B'])).toEqual(new Set());
  });
});

describe('toggleMetricGroup', () => {
  test('unchecking from All expands to remaining groups', () => {
    expect(toggleMetricGroup(new Set(), 'A', ['A', 'B'])).toEqual(new Set(['B']));
  });

  test('adds and removes a group from an explicit selection', () => {
    expect(toggleMetricGroup(new Set(['A']), 'B', ['A', 'B'])).toEqual(new Set());
    expect(toggleMetricGroup(new Set(['A', 'B']), 'B', ['A', 'B'])).toEqual(new Set(['A']));
  });
});

describe('formatHeatMapMetricsTriggerLabel', () => {
  test('returns all label when every group is selected', () => {
    expect(formatHeatMapMetricsTriggerLabel(new Set(['A', 'B']), ['A', 'B'], t)).toBe(
      RunsI18nKey.RunCompareHeatMapMetricsAll,
    );
  });

  test('returns count format for partial selection', () => {
    expect(formatHeatMapMetricsTriggerLabel(new Set(['B']), ['A', 'B'], t)).toBe(
      `${RunsI18nKey.RunCompareHeatMapMetricsPrefix} 1/2`,
    );
  });

  test('returns all label for empty selection (All sentinel)', () => {
    expect(formatHeatMapMetricsTriggerLabel(new Set(), ['A', 'B'], t)).toBe(RunsI18nKey.RunCompareHeatMapMetricsAll);
  });
});

describe('resolveMetricGroupsSelection', () => {
  test('defaults to All (empty sentinel) on first initialization', () => {
    expect(resolveMetricGroupsSelection(['A', 'B'], new Set(), false)).toEqual({
      selection: new Set(),
      isInitialized: true,
    });
  });

  test('preserves partial selection after initialization', () => {
    expect(resolveMetricGroupsSelection(['A', 'B'], new Set(['A']), true)).toEqual({
      selection: new Set(['A']),
      isInitialized: true,
    });
  });

  test('preserves All (empty sentinel) after initialization', () => {
    expect(resolveMetricGroupsSelection(['A', 'B'], new Set(), true)).toEqual({
      selection: new Set(),
      isInitialized: true,
    });
  });

  test('drops groups that are no longer available', () => {
    expect(resolveMetricGroupsSelection(['A'], new Set(['A', 'B']), true)).toEqual({
      selection: new Set(),
      isInitialized: true,
    });
  });

  test('ignores empty available groups without initializing', () => {
    expect(resolveMetricGroupsSelection([], new Set(['A']), false)).toEqual({
      selection: new Set(['A']),
      isInitialized: false,
    });
  });
});
