import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationDetailRow,
  ConversationFeedbackRow,
  ConversationTurnRow,
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

// The insight enrichment runs per conversation, so a title can be missing (never evaluated) or blank. The
// conversation id is what identifies the row everywhere else, so it is the fallback rather than an empty
// cell — and both the header and the grid's title column read this, so they cannot state different names
// for one conversation.
export const conversationTitle = (record: ConversationTitleSource): string =>
  record[ConversationsField.InsightTitle]?.trim() || record.chat_id;

export const resolveConversationField = (
  definition: ConversationFieldDefinition,
  record: ConversationDetailRow,
): ResolvedConversationField => {
  const { labelKey, column, format, accentClassName } = definition;

  if (!column) {
    return { labelKey, state: ConversationFieldState.Unavailable, text: UNAVAILABLE_VALUE, accentClassName };
  }

  const raw = record[column];
  // The service returns every projected column in every row, `null` where the cell is null — so a key the
  // row does not carry at all was never projected, because this deployment does not expose it. That is
  // "unavailable"; a key present and null is a record with no value, which is "empty".
  if (raw === undefined) {
    return { labelKey, state: ConversationFieldState.Unavailable, text: UNAVAILABLE_VALUE, accentClassName };
  }
  if (raw === null || raw === '') {
    return { labelKey, state: ConversationFieldState.Empty, text: '', accentClassName };
  }

  const text = formatValue(raw, format);

  return text === ''
    ? { labelKey, state: ConversationFieldState.Empty, text: '', accentClassName }
    : { labelKey, state: ConversationFieldState.Available, text, accentClassName };
};

export const countFeedbackDirections = (rows: ConversationFeedbackRow[]): RatingCounts =>
  rows.reduce<RatingCounts>(
    (counts, { rate }) => {
      if (rate === null) {
        return counts;
      }
      return rate > 0
        ? { ...counts, rating_up: (counts.rating_up ?? 0) + 1 }
        : { ...counts, rating_down: (counts.rating_down ?? 0) + 1 };
    },
    { rating_up: 0, rating_down: 0 },
  );

export const attributeRatingsToTurns = (
  turns: ConversationTurnRow[],
  rows: ConversationFeedbackRow[],
): RatingCounts[] => {
  const startedAt = turns.map(({ started }) => toMillis(started));
  const counts: RatingCounts[] = turns.map(() => ({ rating_up: 0, rating_down: 0 }));

  for (const { rate, request_time } of rows) {
    const ratedAt = toMillis(request_time);
    if (rate === null || ratedAt === null) {
      continue;
    }

    const index = startedAt.reduce<number>(
      (latest, start, at) => (start !== null && start <= ratedAt ? at : latest),
      -1,
    );
    if (index < 0) {
      continue;
    }

    const bucket = counts[index];
    counts[index] =
      rate > 0
        ? { ...bucket, rating_up: (bucket.rating_up ?? 0) + 1 }
        : { ...bucket, rating_down: (bucket.rating_down ?? 0) + 1 };
  }

  return counts;
};

export const isFeedbackPartial = (rows: ConversationFeedbackRow[], total: number | null): boolean =>
  total !== null && total > rows.length;
