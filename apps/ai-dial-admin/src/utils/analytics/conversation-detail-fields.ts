import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationDetailRow,
  ConversationFeedbackRow,
  ConversationTurnRow,
  ConversationFieldDefinition,
  ConversationFieldFormat,
  ConversationFieldState,
  RatingCounts,
  ResolvedConversationField,
} from '@/src/models/analytics/conversations-trace';
import {
  formatCompactNumber,
  formatDurationMs,
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
      return formatDurationMs(raw as number | string | null);
    default:
      return String(raw);
  }
};

export const resolveConversationField = (
  definition: ConversationFieldDefinition,
  record: ConversationDetailRow,
): ResolvedConversationField => {
  const { labelKey, column, format, accentClassName } = definition;

  if (!column) {
    return { labelKey, state: ConversationFieldState.Unavailable, text: UNAVAILABLE_VALUE, accentClassName };
  }

  const raw = record[column];
  if (raw === null || raw === undefined || raw === '') {
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
