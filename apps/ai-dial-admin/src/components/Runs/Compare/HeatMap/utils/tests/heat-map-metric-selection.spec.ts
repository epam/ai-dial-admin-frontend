import { describe, expect, test } from 'vitest';

import { HeatMapRowType } from '@/src/components/Runs/Compare/HeatMap/models';
import { filterHeatMapRowsByMetricGroups } from '@/src/components/Runs/Compare/HeatMap/utils/build-heat-map-rows';
import {
  formatHeatMapMetricsTriggerLabel,
  isAllMetricGroupsSelected,
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
});

describe('isAllMetricGroupsSelected', () => {
  test('returns true when every available group is selected', () => {
    expect(isAllMetricGroupsSelected(new Set(['A', 'B']), ['A', 'B'])).toBe(true);
  });

  test('returns false when available is empty or selection is partial', () => {
    expect(isAllMetricGroupsSelected(new Set(['A']), ['A', 'B'])).toBe(false);
    expect(isAllMetricGroupsSelected(new Set(), [])).toBe(false);
  });
});

describe('toggleAllMetricGroups', () => {
  test('selects all groups when not all are selected', () => {
    expect(toggleAllMetricGroups(new Set(['A']), ['A', 'B'])).toEqual(new Set(['A', 'B']));
  });

  test('clears selection when all groups are selected', () => {
    expect(toggleAllMetricGroups(new Set(['A', 'B']), ['A', 'B'])).toEqual(new Set());
  });
});

describe('toggleMetricGroup', () => {
  test('adds and removes a group from selection', () => {
    expect(toggleMetricGroup(new Set(['A']), 'B')).toEqual(new Set(['A', 'B']));
    expect(toggleMetricGroup(new Set(['A', 'B']), 'B')).toEqual(new Set(['A']));
  });
});

describe('formatHeatMapMetricsTriggerLabel', () => {
  test('returns all label when every group is selected', () => {
    expect(formatHeatMapMetricsTriggerLabel(new Set(['A', 'B']), ['A', 'B'], t)).toBe(
      RunsI18nKey.RunCompareHeatMapMetricsAll,
    );
  });

  test('returns prefix with selected group names for partial selection', () => {
    expect(formatHeatMapMetricsTriggerLabel(new Set(['B']), ['A', 'B'], t)).toBe(
      `${RunsI18nKey.RunCompareHeatMapMetricsPrefix} B`,
    );
  });
});
