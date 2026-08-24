import { describe, expect, test } from 'vitest';

import { ConversationRatingRow, ConversationRow } from '@/src/models/analytics/conversations-trace';
import {
  attachRatings,
  conversationRatingCounts,
  hasNegativeRatingCaveat,
  negativeRatingGap,
  summariseConversations,
  unresolvedRatings,
} from '@/src/utils/analytics/conversation-rows';

const ratingRow = (chat_id: string, overrides: Partial<ConversationRatingRow> = {}): ConversationRatingRow => ({
  chat_id,
  rating_up: 0,
  rate_zero: 0,
  rate_negative: 0,
  rate_bool_false: 0,
  rate_raw: 0,
  rate_events: 0,
  ...overrides,
});

const row = (overrides: Partial<ConversationRow> = {}): ConversationRow => ({
  chat_id: 'chat-1',
  project_id: 'data-team',
  user_hash: 'db7327ba3decd351',
  turn_count: 3,
  total_tokens: 10,
  total_price: '0.100000000000',
  last_request_time: 1,
  first_request_time: 0,
  rating_up: 0,
  rating_down: 0,
  provable_down: 0,
  captured_form: 0,
  rate_events: 0,
  ...overrides,
});

const rows = (count: number, overrides: Partial<ConversationRow> = {}) =>
  Array.from({ length: count }, (_, index) => row({ chat_id: `chat-${index}`, ...overrides }));

describe('conversationRatingCounts', () => {
  test('composes the negative figure from the zero and negative counts', () => {
    expect(
      conversationRatingCounts(ratingRow('chat-1', { rating_up: 2, rate_zero: 3, rate_negative: 1 })),
    ).toMatchObject({ rating_up: 2, rating_down: 4 });
  });

  // The case the previous count-and-sum split got wrong: one like and one dislike summed to zero.
  test('reports one like and one dislike as one each', () => {
    expect(conversationRatingCounts(ratingRow('chat-1', { rating_up: 1, rate_negative: 1 }))).toMatchObject({
      rating_up: 1,
      rating_down: 1,
    });
  });

  test('counts a provable negative from the boolean-false and negative columns', () => {
    expect(
      conversationRatingCounts(ratingRow('chat-1', { rate_zero: 5, rate_negative: 2, rate_bool_false: 3 })),
    ).toMatchObject({ rating_down: 7, provable_down: 5 });
  });

  test('reads a count returned as a string, as a ClickHouse aggregate may', () => {
    expect(conversationRatingCounts(ratingRow('chat-1', { rating_up: '4', rate_zero: '2' }))).toMatchObject({
      rating_up: 4,
      rating_down: 2,
    });
  });

  test.each([
    ['a null count', null],
    ['an unparseable count', 'nonsense'],
  ])('treats %s as zero rather than as a rating', (_label, count) => {
    expect(conversationRatingCounts(ratingRow('chat-1', { rating_up: count }))).toMatchObject({ rating_up: 0 });
  });

  test('reports a resolved zero where the rollup returned no row', () => {
    expect(conversationRatingCounts(undefined)).toEqual({
      rating_up: 0,
      rating_down: 0,
      provable_down: 0,
      captured_form: 0,
      rate_events: 0,
    });
  });
});

describe('negativeRatingGap', () => {
  test('is the part of the negative figure no captured form accounts for', () => {
    expect(
      negativeRatingGap({ rating_up: 0, rating_down: 7, provable_down: 5, captured_form: 5, rate_events: 7 }),
    ).toBe(2);
  });

  test('never reports a negative gap', () => {
    expect(
      negativeRatingGap({ rating_up: 0, rating_down: 2, provable_down: 5, captured_form: 5, rate_events: 2 }),
    ).toBe(0);
  });
});

describe('hasNegativeRatingCaveat', () => {
  test('a partially attributable figure carries one', () => {
    expect(
      hasNegativeRatingCaveat({ rating_up: 0, rating_down: 7, provable_down: 5, captured_form: 5, rate_events: 7 }),
    ).toBe(true);
  });

  test('a fully attributable figure carries none', () => {
    expect(
      hasNegativeRatingCaveat({ rating_up: 1, rating_down: 3, provable_down: 3, captured_form: 4, rate_events: 4 }),
    ).toBe(false);
  });

  test('an unrated conversation carries none', () => {
    expect(
      hasNegativeRatingCaveat({ rating_up: 0, rating_down: 0, provable_down: 0, captured_form: 0, rate_events: 0 }),
    ).toBe(false);
  });

  test('an unresolved figure carries none', () => {
    expect(
      hasNegativeRatingCaveat({
        rating_up: null,
        rating_down: null,
        provable_down: null,
        captured_form: null,
        rate_events: null,
      }),
    ).toBe(false);
  });
});

describe('negativeRatingGap :: unresolved figures', () => {
  test('reports no gap where the provable count was never resolved', () => {
    expect(negativeRatingGap({ rating_up: 0, rating_down: 4, provable_down: null })).toBe(0);
  });

  test('reports no gap where the provable count is absent', () => {
    expect(negativeRatingGap({ rating_up: 0, rating_down: 4 })).toBe(0);
  });

  test('reports no gap where the negative figure was never resolved', () => {
    expect(negativeRatingGap({ rating_up: null, rating_down: null, provable_down: 0 })).toBe(0);
  });
});

describe('attachRatings', () => {
  test('takes both directions from the one result set', () => {
    const given = [row({ chat_id: 'chat-1' }), row({ chat_id: 'chat-2' })];

    const attached = attachRatings(given, [
      ratingRow('chat-1', { rating_up: 2, rate_zero: 3 }),
      ratingRow('chat-2', { rate_negative: 1 }),
    ]);

    expect(attached.map(({ rating_up, rating_down }) => ({ rating_up, rating_down }))).toEqual([
      { rating_up: 2, rating_down: 3 },
      { rating_up: 0, rating_down: 1 },
    ]);
  });

  test('carries the caveat figures onto the row so the cell can state them', () => {
    const [attached] = attachRatings(
      [row({ chat_id: 'chat-1' })],
      [ratingRow('chat-1', { rate_zero: 4, rate_bool_false: 1, rate_raw: 1, rate_events: 4 })],
    );

    expect(attached).toMatchObject({ rating_down: 4, provable_down: 1, captured_form: 1, rate_events: 4 });
  });

  test('ignores rating rows for conversations not on the page, preserving order and other fields', () => {
    const attached = attachRatings(rows(2), [ratingRow('chat-9', { rating_up: 5 })]);

    expect(attached.map(({ chat_id }) => chat_id)).toEqual(['chat-0', 'chat-1']);
    expect(attached[0]).toMatchObject({ project_id: 'data-team', rating_up: 0, rating_down: 0 });
  });

  test('does not mutate the rows it was given', () => {
    const given = [row({ chat_id: 'chat-1', rating_up: null, rating_down: null })];

    attachRatings(given, [ratingRow('chat-1', { rating_up: 1 })]);

    expect(given[0].rating_up).toBeNull();
  });
});

describe('unresolvedRatings', () => {
  test('marks both sides unresolved so the cell shows nothing rather than a false zero', () => {
    const [marked] = unresolvedRatings([row({ rating_up: 2, rating_down: 1 })]);

    expect(marked).toMatchObject({ chat_id: 'chat-1', rating_up: null, rating_down: null, provable_down: null });
  });
});

// The conversation count and the total cost are whole-result figures resolved by their own query, so
// this helper deliberately reports neither — only what the loaded rows can prove.
describe('summariseConversations', () => {
  test('reports zero for an empty result', () => {
    expect(summariseConversations([])).toEqual({ rated: 0, negative: 0 });
  });

  test('counts a conversation rated in either direction once, and negatives separately', () => {
    const summary = summariseConversations([
      row({ chat_id: 'a', rating_up: 1, rating_down: 0 }),
      row({ chat_id: 'b', rating_up: 0, rating_down: 2 }),
      row({ chat_id: 'c', rating_up: 2, rating_down: 3 }),
      row({ chat_id: 'd', rating_up: 0, rating_down: 0 }),
    ]);

    expect(summary).toEqual({ rated: 3, negative: 2 });
  });

  // An unresolved rating is not evidence of an absent one, so it must not be counted as rated.
  test('does not count an unresolved rating as rated', () => {
    expect(summariseConversations([row({ rating_up: null, rating_down: null })])).toEqual({
      rated: 0,
      negative: 0,
    });
  });

  test('reports no conversation count and no cost', () => {
    const summary = summariseConversations([row()]) as Record<string, unknown>;

    expect(summary.conversations).toBeUndefined();
    expect(summary.cost).toBeUndefined();
    expect(summary.isTruncated).toBeUndefined();
  });
});
