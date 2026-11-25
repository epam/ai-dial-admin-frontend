import { NumericGridFilter, TextGridFilter } from '@/src/components/Grid/Filter/models';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';

export type RowDetailFieldFilter = TextGridFilter;

export type RowDetailValueFilter = TextGridFilter;

export type RowDetailDeltaFilter = NumericGridFilter;

/**
 * What a metric's `metricInfos` entry says about one run's value for a field. `error` is the leaf's own message
 * (`metricInfos[group][leaf].error`), or the group-level one written beside the leaf entries when the leaf has none.
 * `details` is whatever else the leaf entry holds — the keys a metric defines for itself, such as Set Comparison's
 * `true_positives` — serialized as text.
 */
export interface MetricFieldInfo {
  reason: string | null;
  logs: string | null;
  error: string | null;
  details: string | null;
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
  /** Only the overall score row carries these: each run's snapshotted threshold, for the above/below icon. */
  primaryThreshold?: number | null;
  secondaryThreshold?: number | null;
  diffKind: MetricDeltaKind;
  isNumeric: boolean;
  isScoreIndicator: boolean;
  isMetric: boolean;
}

/** The snapshotted score threshold of the opened row's run, and of the compared run in a comparison. */
export interface RowDetailScoreThresholds {
  primary?: number | null;
  compared?: number | null;
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

/** One scored text chunk of a metric's `highlight` leaf. */
export interface MetricHighlightChunk {
  text: string;
  score: number;
  title?: string;
}

/** One named source (e.g. `corpus`) inside a highlight value, or an unnamed bare array. */
export interface MetricHighlightSource {
  key: string | null;
  chunks: MetricHighlightChunk[];
}

/** Parsed shape of a metric `highlight` value: one or more chunk arrays under optional keys. */
export interface MetricHighlight {
  sources: MetricHighlightSource[];
}
