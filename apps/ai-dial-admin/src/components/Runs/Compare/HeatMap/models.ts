import { RUN_COMPARE_PRIMARY_INDEX, RUN_COMPARE_SECONDARY_INDEX } from '@/src/components/Runs/Compare/constants';
import { RunsI18nKey } from '@/src/constants/i18n';

export enum HeatMapColorDisplayMode {
  Absolute = 'absolute',
  Delta = 'delta',
}

export enum HeatMapRowType {
  Group = 'group',
  Metric = 'metric',
}

export type HeatMapRunIndex = typeof RUN_COMPARE_PRIMARY_INDEX | typeof RUN_COMPARE_SECONDARY_INDEX;

export interface HeatMapRow {
  id: string;
  rowType: HeatMapRowType;
  groupKey: string;
  metricKey?: string;
  runIndex?: HeatMapRunIndex;
  label: string;
  values: Record<string, number | null | undefined>;
}

export interface HeatMapCellTooltipSwatch {
  value: string;
  backgroundColor: string;
  borderColor: string;
}

export interface HeatMapCellTooltipData {
  testCase: string;
  metric: string;
  input: string;
  runLabel?: string;
  valueRow?: HeatMapCellTooltipSwatch;
  valueTextKey?: RunsI18nKey;
  valueLabelKey: RunsI18nKey;
}
