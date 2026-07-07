import { RUN_COMPARE_PRIMARY_INDEX, RUN_COMPARE_SECONDARY_INDEX } from '@/src/components/Runs/Compare/constants';

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
