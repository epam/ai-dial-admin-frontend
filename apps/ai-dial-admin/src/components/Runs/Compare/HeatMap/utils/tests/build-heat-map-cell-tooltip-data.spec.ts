import { describe, expect, test } from 'vitest';

import {
  ACCURACY_COLOR_MAP,
  DELTA_NEUTRAL_SEGMENT,
  DELTA_POSITIVE_COLOR_MAP,
} from '@/src/components/Common/ColorScale/constants';
import { RUN_COMPARE_PRIMARY_INDEX, RUN_COMPARE_SECONDARY_INDEX } from '@/src/components/Runs/Compare/constants';
import { formatHeatMapTestCaseColId } from '@/src/components/Runs/Compare/HeatMap/constants';
import { HeatMapColorDisplayMode, HeatMapRowType } from '@/src/components/Runs/Compare/HeatMap/models';
import { buildHeatMapCellTooltipData } from '@/src/components/Runs/Compare/HeatMap/utils/build-heat-map-cell-tooltip-data';
import { RunsI18nKey } from '@/src/constants/i18n';

const colId = formatHeatMapTestCaseColId('tc-1');
const baseOptions = {
  testCaseLabel: 'Row 001',
  primaryRunName: 'Run #316',
  comparedRunName: 'Run #317',
  colId,
};

const metricRow = {
  id: 'metric-1',
  rowType: HeatMapRowType.Metric,
  groupKey: 'Context Appropriateness',
  metricKey: 'Recall',
  label: 'Recall',
  runIndex: RUN_COMPARE_SECONDARY_INDEX,
  values: { [colId]: 0.812 },
} as const;

describe('buildHeatMapCellTooltipData', () => {
  test('returns absolute tooltip with run and score', () => {
    const result = buildHeatMapCellTooltipData({ data: metricRow } as never, {
      ...baseOptions,
      colorDisplayMode: HeatMapColorDisplayMode.Absolute,
    });

    expect(result).toEqual({
      testCase: 'Row 001',
      metric: 'Context Appropriateness',
      input: 'Recall',
      runLabel: '[2] Run #317',
      valueRow: {
        value: '0.812',
        backgroundColor: ACCURACY_COLOR_MAP[0.9].bg,
        borderColor: ACCURACY_COLOR_MAP[0.9].border,
      },
      valueLabelKey: RunsI18nKey.RunCompareHeatMapTooltipScore,
    });
  });

  test('returns delta tooltip without run label', () => {
    const deltaRow = {
      ...metricRow,
      runIndex: undefined,
      values: { [colId]: 0.95 },
    };

    const result = buildHeatMapCellTooltipData({ data: deltaRow } as never, {
      ...baseOptions,
      colorDisplayMode: HeatMapColorDisplayMode.Delta,
    });

    expect(result).toMatchObject({
      testCase: 'Row 001',
      metric: 'Context Appropriateness',
      input: 'Recall',
      valueRow: {
        value: '+0.950',
        backgroundColor: DELTA_POSITIVE_COLOR_MAP[1.0].bg,
        borderColor: DELTA_POSITIVE_COLOR_MAP[1.0].border,
      },
      valueLabelKey: RunsI18nKey.RunCompareHeatMapTooltipDelta,
    });
    expect(result?.runLabel).toBeUndefined();
  });

  test('uses neutral swatch for zero delta', () => {
    const deltaRow = {
      ...metricRow,
      runIndex: undefined,
      values: { [colId]: 0 },
    };

    const result = buildHeatMapCellTooltipData({ data: deltaRow } as never, {
      ...baseOptions,
      colorDisplayMode: HeatMapColorDisplayMode.Delta,
    });

    expect(result?.valueRow).toEqual({
      value: '0',
      backgroundColor: DELTA_NEUTRAL_SEGMENT.bg,
      borderColor: DELTA_NEUTRAL_SEGMENT.border,
    });
  });

  test('formats primary run label in absolute mode', () => {
    const primaryRow = {
      ...metricRow,
      runIndex: RUN_COMPARE_PRIMARY_INDEX,
      values: { [colId]: 0.5 },
    };

    const result = buildHeatMapCellTooltipData({ data: primaryRow } as never, {
      ...baseOptions,
      colorDisplayMode: HeatMapColorDisplayMode.Absolute,
    });

    expect(result?.runLabel).toBe('[1] Run #316');
  });

  test('returns undefined for group rows', () => {
    const result = buildHeatMapCellTooltipData(
      {
        data: {
          id: 'group-1',
          rowType: HeatMapRowType.Group,
          groupKey: 'Accuracy',
          label: 'Accuracy',
          values: {},
        },
      } as never,
      { ...baseOptions, colorDisplayMode: HeatMapColorDisplayMode.Absolute },
    );

    expect(result).toBeUndefined();
  });

  test('returns undefined for undefined and null cell values', () => {
    const undefinedValueRow = { ...metricRow, values: { [colId]: undefined } };
    const nullValueRow = { ...metricRow, values: { [colId]: null } };

    expect(
      buildHeatMapCellTooltipData({ data: undefinedValueRow } as never, {
        ...baseOptions,
        colorDisplayMode: HeatMapColorDisplayMode.Absolute,
      }),
    ).toBeUndefined();

    expect(
      buildHeatMapCellTooltipData({ data: nullValueRow } as never, {
        ...baseOptions,
        colorDisplayMode: HeatMapColorDisplayMode.Absolute,
      }),
    ).toBeUndefined();
  });
});
