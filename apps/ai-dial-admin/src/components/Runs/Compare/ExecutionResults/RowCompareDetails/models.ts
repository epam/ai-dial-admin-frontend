import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { NumericGridFilter, TextGridFilter } from '@/src/components/Grid/Filter/models';

export interface CompareRowDetailField {
  fieldKey: string;
  label: string;
  primaryRaw: string | null;
  secondaryRaw: string | null;
  primaryFailed?: boolean;
  secondaryFailed?: boolean;
  diffKind: MetricDeltaKind;
  isNumeric: boolean;
  isScoreIndicator: boolean;
  isMetric: boolean;
}

export interface CompareRowDetailSection {
  key: string;
  label: string;
  rows: CompareRowDetailField[];
}

export type RowDetailFieldFilter = TextGridFilter;

export type RowDetailDeltaFilter = NumericGridFilter;

export enum RowDetailViewMode {
  Table = 'table',
  Pivot = 'pivot',
}

export enum PivotColumnWidthTier {
  Status = 'status',
  RunNumber = 'runNumber',
  Http = 'http',
  Duration = 'duration',
  Score = 'score',
  Default = 'default',
}
