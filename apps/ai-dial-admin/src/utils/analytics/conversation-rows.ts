import { Big } from 'big.js';

import { CONVERSATION_PAGE_SIZE, SUMMARY_COST_PRECISION } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationRatingRow,
  ConversationRow,
  ConversationSummary,
  RatingCounts,
} from '@/src/models/analytics/conversations-trace';
import { toBig, toNumber } from '@/src/utils/analytics/scalar';

const UNRESOLVED: RatingCounts = { rating_up: null, rating_down: null };

const countsByChatId = (ratingRows: ConversationRatingRow[]): Map<string, number> =>
  new Map(ratingRows.map((row) => [row.chat_id, toNumber(row.rating_count) ?? 0]));

// Each direction is counted by its own query, since `rate` is signed (-1 for a dislike, 0 for a
// normalized boolean false) and the language has no conditional aggregation to split one result.
export const attachRatings = (
  rows: ConversationRow[],
  upRows: ConversationRatingRow[],
  downRows: ConversationRatingRow[],
): ConversationRow[] => {
  const up = countsByChatId(upRows);
  const down = countsByChatId(downRows);

  return rows.map((row) => ({
    ...row,
    rating_up: up.get(row.chat_id) ?? 0,
    rating_down: down.get(row.chat_id) ?? 0,
  }));
};

export const unresolvedRatings = (rows: ConversationRow[]): ConversationRow[] =>
  rows.map((row) => ({ ...row, ...UNRESOLVED }));

export const summariseConversations = (rows: ConversationRow[]): ConversationSummary => {
  let rated = 0;
  let negative = 0;
  let cost = new Big(0);

  rows.forEach((row) => {
    const up = row.rating_up ?? 0;
    const down = row.rating_down ?? 0;
    if (up + down > 0) {
      rated += 1;
    }
    if (down > 0) {
      negative += 1;
    }
    cost = cost.plus(toBig(row.cost) ?? 0);
  });

  return {
    conversations: rows.length,
    isTruncated: rows.length >= CONVERSATION_PAGE_SIZE,
    rated,
    negative,
    cost: cost.round(SUMMARY_COST_PRECISION).toString(),
  };
};
