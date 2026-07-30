import { describe, expect, test } from 'vitest';

import { CONVERSATION_PAGE_SIZE } from '@/src/constants/analytics/conversations-trace';
import { ConversationRatingRow, ConversationRow } from '@/src/models/analytics/conversations-trace';
import { attachRatings, summariseConversations, unresolvedRatings } from '@/src/utils/analytics/conversation-rows';

const ratingRow = (chat_id: string, rating_count: number | string | null): ConversationRatingRow => ({
  chat_id,
  rating_count,
});

const row = (overrides: Partial<ConversationRow> = {}): ConversationRow => ({
  chat_id: 'chat-1',
  project: 'data-team',
  turns: 3,
  tokens: 10,
  cost: '0.100000000000',
  last_activity: 1,
  first_activity: 0,
  model: 'gpt-4o',
  model_count: 1,
  title: null,
  snippet: null,
  rating_up: 0,
  rating_down: 0,
  ...overrides,
});

const rows = (count: number, overrides: Partial<ConversationRow> = {}) =>
  Array.from({ length: count }, (_, index) => row({ chat_id: `chat-${index}`, ...overrides }));

describe('attachRatings', () => {
  // `rate` is signed: DIAL sends 1 for a like and -1 for a dislike, and a normalized boolean false is 0.
  // The two directions are therefore counted by separate queries, not split out of one count and sum.
  test('takes each direction from its own result set', () => {
    const given = [row({ chat_id: 'chat-1' }), row({ chat_id: 'chat-2' })];

    const attached = attachRatings(given, [ratingRow('chat-1', 2)], [ratingRow('chat-1', 3), ratingRow('chat-2', 1)]);

    expect(attached.map(({ rating_up, rating_down }) => ({ rating_up, rating_down }))).toEqual([
      { rating_up: 2, rating_down: 3 },
      { rating_up: 0, rating_down: 1 },
    ]);
  });

  // The case the previous count-and-sum split got wrong: one like and one dislike summed to zero.
  test('reports one like and one dislike as one each', () => {
    const [attached] = attachRatings([row({ chat_id: 'chat-1' })], [ratingRow('chat-1', 1)], [ratingRow('chat-1', 1)]);

    expect(attached).toMatchObject({ rating_up: 1, rating_down: 1 });
  });

  test('reads a count returned as a string, as a ClickHouse aggregate may', () => {
    const [attached] = attachRatings([row({ chat_id: 'chat-1' })], [ratingRow('chat-1', '4')], []);

    expect(attached).toMatchObject({ rating_up: 4, rating_down: 0 });
  });

  test.each([
    ['a null count', null],
    ['an unparseable count', 'nonsense'],
  ])('treats %s as zero rather than as a rating', (_label, count) => {
    const [attached] = attachRatings([row({ chat_id: 'chat-1' })], [ratingRow('chat-1', count)], []);

    expect(attached).toMatchObject({ rating_up: 0, rating_down: 0 });
  });

  test('ignores rating rows for conversations not on the page, preserving order and other fields', () => {
    const attached = attachRatings(rows(2), [ratingRow('chat-9', 5)], []);

    expect(attached.map(({ chat_id }) => chat_id)).toEqual(['chat-0', 'chat-1']);
    expect(attached[0]).toMatchObject({ project: 'data-team', rating_up: 0, rating_down: 0 });
  });

  test('does not mutate the rows it was given', () => {
    const given = [row({ chat_id: 'chat-1', rating_up: null, rating_down: null })];

    attachRatings(given, [ratingRow('chat-1', 1)], []);

    expect(given[0].rating_up).toBeNull();
  });
});

describe('unresolvedRatings', () => {
  test('marks both sides unresolved so the cell shows nothing rather than a false zero', () => {
    const [marked] = unresolvedRatings([row({ rating_up: 2, rating_down: 1 })]);

    expect(marked).toMatchObject({ chat_id: 'chat-1', rating_up: null, rating_down: null });
  });
});

describe('summariseConversations :: counts', () => {
  test('reports zero for an empty result', () => {
    expect(summariseConversations([])).toMatchObject({ conversations: 0, rated: 0, negative: 0, cost: '0' });
  });

  test('counts a conversation rated in either direction once, and negatives separately', () => {
    const summary = summariseConversations([
      row({ chat_id: 'a', rating_up: 1, rating_down: 0 }),
      row({ chat_id: 'b', rating_up: 0, rating_down: 2 }),
      row({ chat_id: 'c', rating_up: 2, rating_down: 3 }),
      row({ chat_id: 'd', rating_up: 0, rating_down: 0 }),
    ]);

    expect(summary).toMatchObject({ conversations: 4, rated: 3, negative: 2 });
  });

  // An unresolved rating is not evidence of an absent one, so it must not be counted as rated.
  test('does not count an unresolved rating as rated', () => {
    expect(summariseConversations([row({ rating_up: null, rating_down: null })])).toMatchObject({
      rated: 0,
      negative: 0,
    });
  });
});

describe('summariseConversations :: cost', () => {
  // Summing 12-decimal strings as JS numbers would drift; the sum runs through Big.
  test('sums full-scale decimals without floating-point drift', () => {
    const summary = summariseConversations([
      row({ cost: '0.070000000001' }),
      row({ chat_id: 'b', cost: '0.070000000002' }),
    ]);

    expect(summary.cost).toBe('0.14');
  });

  test.each([
    ['rounds for display rather than showing every fractional digit', '0.090342871559', '0.09'],
    ['keeps a value that needs the display precision', '0.533456', '0.533'],
  ])('%s', (_label, cost, expected) => {
    expect(summariseConversations([row({ cost })]).cost).toBe(expected);
  });

  test.each([
    ['a null cost', null],
    ['an empty cost', ''],
    ['an unparseable cost', 'n/a'],
  ])('treats %s as zero rather than failing the whole summary', (_label, cost) => {
    expect(summariseConversations([row({ cost }), row({ chat_id: 'b', cost: '1' })]).cost).toBe('1');
  });

  test('reads a numeric cost as well as a string one', () => {
    expect(summariseConversations([row({ cost: 0.25 }), row({ chat_id: 'b', cost: '0.25' })]).cost).toBe('0.5');
  });
});

describe('summariseConversations :: truncation', () => {
  // A full page means the query hit its limit, so the totals are a lower bound rather than the real ones.
  test.each([
    [CONVERSATION_PAGE_SIZE - 1, false],
    [CONVERSATION_PAGE_SIZE, true],
  ])('reports %i rows as truncated=%s', (count, expected) => {
    expect(summariseConversations(rows(count)).isTruncated).toBe(expected);
  });
});
