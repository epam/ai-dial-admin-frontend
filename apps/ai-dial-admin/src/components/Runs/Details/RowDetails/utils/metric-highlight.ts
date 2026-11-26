import { ScoreColorMode } from '@/src/components/Common/ScoreCell/models';
import { getScoreCellBucketClasses, getScoreCellBucketKey } from '@/src/components/Common/ScoreCell/utils';
import { METRIC_INFO_HIGHLIGHT_KEY } from '@/src/components/Runs/Details/RowDetails/constants';
import {
  MetricHighlight,
  MetricHighlightChunk,
  MetricHighlightSource,
} from '@/src/components/Runs/Details/RowDetails/models';
import { serializeValue } from '@/src/utils/serialize';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === 'object' && !Array.isArray(value);

/**
 * Reads `metricInfos[group][leaf].highlight` for a pivot column. Returns `null` when the leaf has no highlight
 * key, so the column is omitted.
 */
export const getMetricInfoHighlightRaw = (
  infoGroup: Record<string, unknown> | undefined,
  fieldKey: string,
): string | null => {
  if (!infoGroup) return null;
  const entry = infoGroup[fieldKey];
  if (!isRecord(entry) || !(METRIC_INFO_HIGHLIGHT_KEY in entry)) return null;
  return serializeValue(entry[METRIC_INFO_HIGHLIGHT_KEY]);
};

const clampScore = (score: number): number => Math.min(1, Math.max(-1, score));

const parseChunk = (value: unknown): MetricHighlightChunk | null => {
  if (!isRecord(value) || typeof value.text !== 'string' || typeof value.score !== 'number') {
    return null;
  }
  if (!Number.isFinite(value.score)) return null;

  const chunk: MetricHighlightChunk = { text: value.text, score: value.score };
  if (typeof value.title === 'string') {
    chunk.title = value.title;
  }
  return chunk;
};

const parseChunkArray = (value: unknown): MetricHighlightChunk[] | null => {
  if (!Array.isArray(value)) return null;

  const chunks: MetricHighlightChunk[] = [];
  for (const item of value) {
    const chunk = parseChunk(item);
    if (chunk == null) return null;
    chunks.push(chunk);
  }
  return chunks;
};

const buildHighlight = (sources: MetricHighlightSource[]): MetricHighlight | null =>
  sources.length > 0 ? { sources } : null;

/**
 * Detects a metric `highlight` leaf: an object of chunk arrays (`{ corpus: [{ text, score }] }`) or a bare
 * chunk array. Returns `null` for any other shape so numbers, prose and unrelated JSON keep today's rendering.
 */
export const parseMetricHighlight = (raw: string | null): MetricHighlight | null => {
  if (raw == null) return null;

  const trimmed = raw.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }

  if (Array.isArray(parsed)) {
    const chunks = parseChunkArray(parsed);
    return chunks && chunks.length > 0 ? buildHighlight([{ key: null, chunks }]) : null;
  }

  if (!isRecord(parsed)) return null;

  const sources: MetricHighlightSource[] = [];
  for (const [key, value] of Object.entries(parsed)) {
    const chunks = parseChunkArray(value);
    if (chunks && chunks.length > 0) {
      sources.push({ key, chunks });
    }
  }

  return buildHighlight(sources);
};

/** Tailwind classes for a chunk's score, or `undefined` when the score is neutral (0) or not finite. */
export const getHighlightChunkClass = (score: number): string | undefined => {
  if (!Number.isFinite(score) || score === 0) return undefined;

  const classes = getScoreCellBucketClasses(getScoreCellBucketKey(clampScore(score), ScoreColorMode.Delta));
  return classes ? `${classes.background} ${classes.text}` : undefined;
};
