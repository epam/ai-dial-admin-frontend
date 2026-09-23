import {
  BreakdownDeltas,
  BreakdownRow,
  BreakdownRowModel,
  UsageMeasures,
} from '@/src/components/Analytics/Usage/models';
import { getShareOfTotal } from '@/src/components/Analytics/Usage/utils/kpi-cards';

/**
 * Everything a response does not carry about its own rows: the window they are a share of, what the
 * previous window said, and the words a fallback bucket is shown under. The card and the dialog
 * read rows from different requests, so this stays a function of its inputs — one mapping, not two
 * that drift.
 */
export interface RowModelContext {
  windowTotal: number | null;
  /** Already localized; absent when the tab has no fallback bucket. */
  fallbackLabel?: string;
  fallbackTooltip?: string;
  hasComparison: boolean;
  previousMeasures: Map<string, UsageMeasures>;
  /** Whether a row the previous window did not answer for counts as new rather than uncompared. */
  isMissingPreviousEmpty: boolean;
  isFallbackPinnedLast: boolean;
  /**
   * States what a row's own name leaves out, where its tab aggregates more than one deployment.
   * The words and their formatting live with the caller, which has the translator.
   */
  readSubLabel?: (names: string[], count: number | null) => { text: string; tooltip?: string } | null;
}

/**
 * Whether a row absent from the previous response was absent from the window itself.
 *
 * Only when that response is the whole dimension. A window that recorded nothing at all makes every
 * row look new, and a response cut at the page size hides a row that was merely ranked below the
 * cut — in both cases the honest answer is that there is no comparison, not that the row appeared
 * for the first time.
 */
export const readMissingPreviousEmpty = (previousRows: BreakdownRow[], rowLimit: number): boolean =>
  previousRows.length > 0 && previousRows.length < rowLimit;

export const toPreviousMeasures = (previousRows: BreakdownRow[]): Map<string, UsageMeasures> =>
  new Map(previousRows.map((row) => [row.id, row.measures]));

const toDelta = (current: number | null, previous: number | null | undefined): number | null => {
  if (current == null || previous == null || previous === 0) {
    return null;
  }

  return (current - previous) / previous;
};

const toErrorRate = (measures: UsageMeasures | undefined): number | null => {
  if (!measures || measures.calls === 0) {
    return null;
  }

  return measures.failed / measures.calls;
};

export const toRowModels = (rows: BreakdownRow[], context: RowModelContext): BreakdownRowModel[] => {
  const models = rows.map((row) => {
    const calls = row.measures.calls;
    const errorRate = toErrorRate(row.measures);
    const previous = context.hasComparison ? context.previousMeasures.get(row.id) : void 0;
    // A row the previous window is known to have missed is new, not uncompared — but it has no
    // previous figure to divide by either, so every measure states no change and the row says so.
    const isNewRow = context.hasComparison && !previous && context.isMissingPreviousEmpty && calls > 0;

    const deltas: BreakdownDeltas = {
      calls: toDelta(calls, previous?.calls),
      errorRate: toDelta(errorRate, toErrorRate(previous)),
      avgLatencyMs: toDelta(row.measures.avgLatencyMs, previous?.avgLatencyMs),
      spend: toDelta(row.measures.spend, previous?.spend),
    };

    const subLabel = row.groupNames?.length ? context.readSubLabel?.(row.groupNames, row.groupCount ?? null) : null;

    return {
      id: row.id,
      displayLabel: row.isFallbackLabel && context.fallbackLabel ? context.fallbackLabel : row.label,
      isFallbackLabel: row.isFallbackLabel,
      fallbackTooltip: context.fallbackTooltip,
      subLabel: subLabel?.text,
      subLabelTooltip: subLabel?.tooltip,
      calls,
      failed: row.measures.failed,
      share: getShareOfTotal(calls, context.windowTotal),
      deltas,
      isNewRow,
      errorRate,
      avgLatencyMs: row.measures.avgLatencyMs,
      spend: row.measures.spend,
    };
  });

  if (!context.isFallbackPinnedLast) {
    return models;
  }

  // The response is ranked by calls, and on this tab the fallback bucket wins that ranking without
  // being what the tab is about. It keeps its own figures and moves to the end.
  return [...models.filter((model) => !model.isFallbackLabel), ...models.filter((model) => model.isFallbackLabel)];
};
