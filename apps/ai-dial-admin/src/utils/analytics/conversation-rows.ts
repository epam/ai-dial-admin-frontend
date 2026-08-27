import {
  ConversationRatingCounts,
  ConversationRatingRow,
  ConversationRow,
} from '@/src/models/analytics/conversations-trace';
import { toNumber } from '@/src/utils/analytics/scalar';

const UNRESOLVED: ConversationRatingCounts = {
  rating_up: null,
  rating_down: null,
  provable_down: null,
  captured_form: null,
  rate_events: null,
};

const NONE: ConversationRatingCounts = {
  rating_up: 0,
  rating_down: 0,
  provable_down: 0,
  captured_form: 0,
  rate_events: 0,
};

const sum = (...values: (number | string | null)[]): number =>
  values.reduce<number>((total, value) => total + (toNumber(value) ?? 0), 0);

export const conversationRatingCounts = (row?: ConversationRatingRow): ConversationRatingCounts =>
  row
    ? {
        rating_up: sum(row.rating_up),
        rating_down: sum(row.rate_zero, row.rate_negative),
        provable_down: sum(row.rate_bool_false, row.rate_negative),
        captured_form: sum(row.rate_raw),
        rate_events: sum(row.rate_events),
      }
    : NONE;

export const negativeRatingGap = ({ rating_down: down, provable_down: provable }: ConversationRatingCounts): number =>
  down == null || provable == null ? 0 : Math.max(down - provable, 0);

export const hasNegativeRatingCaveat = (counts: ConversationRatingCounts): boolean => negativeRatingGap(counts) > 0;

const countsByChatId = (ratingRows: ConversationRatingRow[]): Map<string, ConversationRatingCounts> =>
  new Map(ratingRows.map((row) => [row.chat_id, conversationRatingCounts(row)]));

export const attachRatings = (rows: ConversationRow[], ratingRows: ConversationRatingRow[]): ConversationRow[] => {
  const counts = countsByChatId(ratingRows);

  return rows.map((row) => ({ ...row, ...(counts.get(row.chat_id) ?? NONE) }));
};

export const unresolvedRatings = (rows: ConversationRow[]): ConversationRow[] =>
  rows.map((row) => ({ ...row, ...UNRESOLVED }));
