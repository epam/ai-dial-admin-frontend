import { NumericGridFilter, TextGridFilter } from '@/src/components/Grid/Filter/models';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';

export type RowDetailFieldFilter = TextGridFilter;

export type RowDetailValueFilter = TextGridFilter;

export type RowDetailDeltaFilter = NumericGridFilter;

/**
 * What a metric's `metricInfos` entry says about one run's value for a field. `error` is the leaf's own message
 * (`metricInfos[group][leaf].error`), or the group-level one written beside the leaf entries when the leaf has none.
 */
export interface MetricFieldInfo {
  reason: string | null;
  logs: string | null;
  error: string | null;
}

export interface RowDetailField {
  fieldKey: string;
  label: string;
  primaryRaw: string | null;
  secondaryRaw: string | null;
  primaryFailed?: boolean;
  secondaryFailed?: boolean;
  primaryInfo?: MetricFieldInfo;
  secondaryInfo?: MetricFieldInfo;
  diffKind: MetricDeltaKind;
  isNumeric: boolean;
  isScoreIndicator: boolean;
  isMetric: boolean;
}

export interface RowDetailSection {
  key: string;
  label: string;
  rows: RowDetailField[];
}

/** Run-wide field union used so the pivot matches the grid schema on every row. */
export interface RowDetailFieldSchema {
  metricValues?: Record<string, Record<string, unknown>>;
  testCaseData?: Record<string, unknown>;
  extractedColumns?: Record<string, unknown>;
}

export enum PivotColumnWidthTier {
  Status = 'status',
  RunNumber = 'runNumber',
  Http = 'http',
  Duration = 'duration',
  Score = 'score',
  Default = 'default',
  Text = 'text',
}
