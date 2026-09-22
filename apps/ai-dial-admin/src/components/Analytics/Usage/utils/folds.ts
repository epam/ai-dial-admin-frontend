import {
  BreakdownRow,
  BucketPoint,
  DimensionBucketPoint,
  SpendBucket,
  UsageMeasures,
} from '@/src/components/Analytics/Usage/models';
import { UNDEFINED_VALUE } from '@/src/components/Analytics/Usage/constants';
import {
  AVG_LATENCY_ALIAS,
  BUCKET_ALIAS,
  CALLS_ALIAS,
  COMPLETION_TOKENS_ALIAS,
  FAILED_ALIAS,
  P50_LATENCY_ALIAS,
  P95_LATENCY_ALIAS,
  PROMPT_TOKENS_ALIAS,
  SPEND_ALIAS,
  TOOL_CALLS_ALIAS,
  CALLERS_ALIAS,
} from '@/src/components/Analytics/Usage/queries';
import { StructuredQueryResult } from '@/src/models/analytics/query';

export const isMissingValue = (value: unknown): boolean => {
  const text = typeof value === 'string' ? value.trim() : value;
  return text == null || text === '' || text === UNDEFINED_VALUE;
};

/** ADAS answers with typed rows, so a number arrives as a number — but a decimal may come as text. */
export const toNumber = (value: unknown): number | null => {
  if (value == null || value === '') {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const readMeasures = (row: Record<string, unknown>): UsageMeasures => ({
  calls: toNumber(row[CALLS_ALIAS]) ?? 0,
  callers: toNumber(row[CALLERS_ALIAS]) ?? 0,
  failed: toNumber(row[FAILED_ALIAS]) ?? 0,
  avgLatencyMs: toNumber(row[AVG_LATENCY_ALIAS]),
  spend: toNumber(row[SPEND_ALIAS]),
  promptTokens: toNumber(row[PROMPT_TOKENS_ALIAS]),
  completionTokens: toNumber(row[COMPLETION_TOKENS_ALIAS]),
  toolCalls: toNumber(row[TOOL_CALLS_ALIAS]),
  p50LatencyMs: toNumber(row[P50_LATENCY_ALIAS]),
  p95LatencyMs: toNumber(row[P95_LATENCY_ALIAS]),
});

export const EMPTY_MEASURES: UsageMeasures = {
  calls: 0,
  callers: 0,
  failed: 0,
  avgLatencyMs: null,
  spend: null,
  promptTokens: null,
  completionTokens: null,
  toolCalls: null,
  p50LatencyMs: null,
  p95LatencyMs: null,
};

export const foldBucketPoints = (result?: StructuredQueryResult | null): BucketPoint[] =>
  (result?.rows ?? [])
    .map((row) => ({
      bucketMs: new Date(String(row[BUCKET_ALIAS])).getTime(),
      measures: readMeasures(row),
    }))
    .filter((point) => !Number.isNaN(point.bucketMs))
    .sort((left, right) => left.bucketMs - right.bucketMs);

export const foldSpendBuckets = (result?: StructuredQueryResult | null): SpendBucket[] =>
  (result?.rows ?? [])
    .map((row) => ({
      bucketMs: new Date(String(row[BUCKET_ALIAS])).getTime(),
      spend: toNumber(row[SPEND_ALIAS]) ?? 0,
    }))
    .filter((point) => !Number.isNaN(point.bucketMs));

export const foldDimensionBuckets = (
  result: StructuredQueryResult | null | undefined,
  column: string,
): DimensionBucketPoint[] =>
  (result?.rows ?? [])
    .map((row) => ({
      bucketMs: new Date(String(row[BUCKET_ALIAS])).getTime(),
      seriesId: isMissingValue(row[column]) ? `${column}:missing` : String(row[column]),
      calls: toNumber(row[CALLS_ALIAS]) ?? 0,
    }))
    .filter((point) => !Number.isNaN(point.bucketMs));

export const foldBreakdownRows = (result: StructuredQueryResult | null | undefined, column: string): BreakdownRow[] =>
  (result?.rows ?? []).map((row) => {
    const raw = row[column];
    const isMissing = isMissingValue(raw);

    return {
      id: isMissing ? `${column}:missing` : String(raw),
      label: isMissing ? '' : String(raw),
      isFallbackLabel: isMissing,
      measures: readMeasures(row),
    };
  });
