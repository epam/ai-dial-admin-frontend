import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationDetailRow,
  ConversationFeedbackRow,
  ConversationFieldDefinition,
  ConversationFieldFormat,
  ConversationFieldState,
  ConversationTitleSource,
  ConversationsField,
  RatingCounts,
  ResolvedConversationField,
} from '@/src/models/analytics/conversations-trace';
import {
  formatCompactNumber,
  formatConversationDuration,
  formatSignificantCost,
  toMillis,
} from '@/src/utils/analytics/conversation-formatting';
import { toNumber } from '@/src/utils/analytics/scalar';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

type FieldValue = ConversationDetailRow[keyof ConversationDetailRow];

const formatValue = (raw: FieldValue, format?: ConversationFieldFormat): string => {
  switch (format) {
    case ConversationFieldFormat.Count:
      return formatCompactNumber(raw as number | string | null);
    case ConversationFieldFormat.Cost:
      return formatSignificantCost(raw as number | string | null);
    case ConversationFieldFormat.DateTime:
      return formatDateTimeToLocalString(raw as number | string);
    case ConversationFieldFormat.Duration:
      return formatConversationDuration(raw as number | string | null);
    case ConversationFieldFormat.List:
      return ((raw as string[] | null) ?? []).join(', ');
    default:
      return String(raw);
  }
};

// The insight enrichment runs per conversation, so a title can be missing (never evaluated) or blank —
// null says so, and each caller states the absence in its own register. It deliberately does not fall back
// to the conversation id: both places that render a title show the id alongside it, so substituting one for
// the other prints the id twice and reads as though the conversation were named after its hash.
export const conversationTitle = (record: ConversationTitleSource): string | null =>
  record[ConversationsField.InsightTitle]?.trim() || null;

export const resolveConversationField = (
  definition: ConversationFieldDefinition,
  record: ConversationDetailRow,
): ResolvedConversationField => {
  const { labelKey, column, format, accentClassName, hintKey } = definition;
  // What every state carries: the label, the accent, and any caveat the figure needs. Only the state and the
  // text differ between the branches below.
  const base = { labelKey, accentClassName, hintKey };

  if (!column) {
    return { ...base, state: ConversationFieldState.Unavailable, text: UNAVAILABLE_VALUE };
  }

  const raw = record[column];
  // The service returns every projected column in every row, `null` where the cell is null — so a key the
  // row does not carry at all was never projected, because this deployment does not expose it. That is
  // "unavailable"; a key present and null is a record with no value, which is "empty".
  if (raw === undefined) {
    return { ...base, state: ConversationFieldState.Unavailable, text: UNAVAILABLE_VALUE };
  }
  if (raw === null || raw === '') {
    return { ...base, state: ConversationFieldState.Empty, text: '' };
  }

  const text = formatValue(raw, format);

  return text === ''
    ? { ...base, state: ConversationFieldState.Empty, text: '' }
    : { ...base, state: ConversationFieldState.Available, text };
};

export const feedbackRowCounts = (row: ConversationFeedbackRow): RatingCounts => ({
  rating_up: toNumber(row.rate_pos_count) ?? 0,
  rating_down: (toNumber(row.rate_zero_count) ?? 0) + (toNumber(row.rate_neg_count) ?? 0),
});

export const isFeedbackContested = (row: ConversationFeedbackRow): boolean =>
  (toNumber(row.rate_distinct_count) ?? 0) > 1;

export const isFeedbackReRated = (row: ConversationFeedbackRow): boolean => {
  const first = toMillis(row.first_rate_time);
  const last = toMillis(row.last_rate_time);

  return first !== null && last !== null && first !== last;
};

export const isFeedbackPartial = (rows: ConversationFeedbackRow[], total: number | null): boolean =>
  total !== null && total > rows.length;
