import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';

export interface RowDetailField {
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

export interface RowDetailSection {
  key: string;
  label: string;
  rows: RowDetailField[];
}

export enum PivotColumnWidthTier {
  Status = 'status',
  RunNumber = 'runNumber',
  Http = 'http',
  Duration = 'duration',
  Score = 'score',
  Default = 'default',
}
