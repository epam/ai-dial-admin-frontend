import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/sessions-trace';
import {
  SessionDetailRow,
  SessionFeedbackRow,
  SessionFieldDefinition,
  SessionFieldFormat,
  SessionFieldState,
  SessionTitleSource,
  SessionsField,
  RatingCounts,
  ResolvedSessionField,
} from '@/src/models/analytics/sessions-trace';
import {
  formatCompactNumber,
  formatSessionDuration,
  formatSignificantCost,
  toMillis,
} from '@/src/utils/analytics/session-formatting';
import { toNumber } from '@/src/utils/analytics/scalar';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

type FieldValue = SessionDetailRow[keyof SessionDetailRow];

const formatValue = (raw: FieldValue, format?: SessionFieldFormat): string => {
  switch (format) {
    case SessionFieldFormat.Count:
      return formatCompactNumber(raw as number | string | null);
    case SessionFieldFormat.Cost:
      return formatSignificantCost(raw as number | string | null);
    case SessionFieldFormat.DateTime:
      return formatDateTimeToLocalString(raw as number | string);
    case SessionFieldFormat.Duration:
      return formatSessionDuration(raw as number | string | null);
    case SessionFieldFormat.List:
      return ((raw as string[] | null) ?? []).join(', ');
    default:
      return String(raw);
  }
};

// The insight enrichment runs per session, so a title can be missing (never evaluated) or blank —
// null says so, and each caller states the absence in its own register. It deliberately does not fall back
// to the session id: both places that render a title show the id alongside it, so substituting one for
// the other prints the id twice and reads as though the session were named after its hash.
export const sessionTitle = (record: SessionTitleSource): string | null =>
  record[SessionsField.InsightTitle]?.trim() || null;

export const resolveSessionField = (
  definition: SessionFieldDefinition,
  record: SessionDetailRow,
): ResolvedSessionField => {
  const { labelKey, column, format, accentClassName, hintKey } = definition;
  // What every state carries: the label, the accent, and any caveat the figure needs. Only the state and the
  // text differ between the branches below.
  const base = { labelKey, accentClassName, hintKey };

  if (!column) {
    return { ...base, state: SessionFieldState.Unavailable, text: UNAVAILABLE_VALUE };
  }

  const raw = record[column];
  // The service returns every projected column in every row, `null` where the cell is null — so a key the
  // row does not carry at all was never projected, because this deployment does not expose it. That is
  // "unavailable"; a key present and null is a record with no value, which is "empty".
  if (raw === undefined) {
    return { ...base, state: SessionFieldState.Unavailable, text: UNAVAILABLE_VALUE };
  }
  if (raw === null || raw === '') {
    return { ...base, state: SessionFieldState.Empty, text: '' };
  }

  const text = formatValue(raw, format);

  return text === ''
    ? { ...base, state: SessionFieldState.Empty, text: '' }
    : { ...base, state: SessionFieldState.Available, text };
};

export const feedbackRowCounts = (row: SessionFeedbackRow): RatingCounts => ({
  rating_up: toNumber(row.rate_pos_count) ?? 0,
  rating_down: (toNumber(row.rate_zero_count) ?? 0) + (toNumber(row.rate_neg_count) ?? 0),
});

export const isFeedbackContested = (row: SessionFeedbackRow): boolean => (toNumber(row.rate_distinct_count) ?? 0) > 1;

export const isFeedbackReRated = (row: SessionFeedbackRow): boolean => {
  const first = toMillis(row.first_rate_time);
  const last = toMillis(row.last_rate_time);

  return first !== null && last !== null && first !== last;
};

export const isFeedbackPartial = (rows: SessionFeedbackRow[], total: number | null): boolean =>
  total !== null && total > rows.length;
