import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ConversationFeedbackPanel from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationFeedbackPanel';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { ConversationFeedbackRow } from '@/src/models/analytics/conversations-trace';

const row = (overrides: Partial<ConversationFeedbackRow> = {}): ConversationFeedbackRow => ({
  response_id: 'chatcmpl-a',
  first_rate_time: '2026-07-20T19:12:59.268Z',
  last_rate_time: '2026-07-20T19:12:59.268Z',
  rate_pos_count: 1,
  rate_zero_count: 0,
  rate_neg_count: 0,
  rate_distinct_count: 1,
  comment_count: 0,
  ...overrides,
});

const setup = (rows: ConversationFeedbackRow[] = [row()], total: number | null = rows.length, isReadable = false) =>
  render(<ConversationFeedbackPanel rows={rows} total={total} isCommentTextReadable={isReadable} />);

describe('ConversationFeedbackPanel', () => {
  test('states that a conversation carries no ratings rather than rendering an empty list', () => {
    setup([], 0);

    expect(screen.getByText(ConversationsTraceI18nKey.DetailNoRatings)).toBeInTheDocument();
  });

  test('reads a response direction from its own counts', () => {
    setup([row(), row({ response_id: 'b', rate_pos_count: 0, rate_zero_count: 1 })]);

    expect(screen.getByText(ConversationsTraceI18nKey.DetailRatingPositive)).toBeInTheDocument();
    expect(screen.getByText(ConversationsTraceI18nKey.DetailRatingNegative)).toBeInTheDocument();
  });

  test('reads a zero-normalized rating as negative', () => {
    setup([row({ rate_pos_count: 0, rate_zero_count: 1 })]);

    expect(screen.getByText(ConversationsTraceI18nKey.DetailRatingNegative)).toBeInTheDocument();
  });

  test('states a window for a re-rated response', () => {
    setup([row({ first_rate_time: '2026-07-20T19:00:00.000Z', last_rate_time: '2026-07-20T19:12:59.268Z' })]);

    expect(screen.getByText(ConversationsTraceI18nKey.DetailRatingWindow)).toBeInTheDocument();
  });

  test('states a single time for a response rated once', () => {
    setup();

    expect(screen.queryByText(ConversationsTraceI18nKey.DetailRatingWindow)).toBeNull();
  });

  test('says so where a response own ratings disagree', () => {
    setup([row({ rate_distinct_count: 2 })]);

    expect(screen.getByText(ConversationsTraceI18nKey.DetailRatingContested)).toBeInTheDocument();
  });

  test('makes no disagreement claim for a response rated one way', () => {
    setup();

    expect(screen.queryByText(ConversationsTraceI18nKey.DetailRatingContested)).toBeNull();
  });

  test('states a comment count without the text where the schema does not offer it', () => {
    setup([row({ comment_count: 2 })], 1, false);

    expect(screen.getByText(ConversationsTraceI18nKey.DetailCommentCount, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(ConversationsTraceI18nKey.DetailCommentRestricted, { exact: false })).toBeInTheDocument();
  });

  test('renders the comment text where the schema offers it', () => {
    setup([row({ comment_count: 1, comment_sample: 'The rotation steps were wrong.' })], 1, true);

    expect(screen.getByText('The rotation steps were wrong.', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.DetailCommentRestricted, { exact: false })).toBeNull();
  });

  test('distinguishes no comments from a comment it may not read', () => {
    setup([row({ comment_count: 0 })], 1, true);

    expect(screen.getByText(ConversationsTraceI18nKey.DetailNoComments)).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.DetailCommentCount)).toBeNull();
  });

  test('declares a truncated list partial', () => {
    setup([row()], 6);

    expect(screen.getByText(ConversationsTraceI18nKey.DetailFeedbackPartial)).toBeInTheDocument();
  });

  test('makes no partial claim for a complete list', () => {
    setup([row()], 1);

    expect(screen.queryByText(ConversationsTraceI18nKey.DetailFeedbackPartial)).toBeNull();
  });

  test('a response whose events carried no rating value is labelled neither way', () => {
    setup([row({ rate_pos_count: 0, rate_zero_count: 0, rate_neg_count: 0, comment_count: 1 })]);

    expect(screen.getByText(ConversationsTraceI18nKey.DetailRatingNoValue)).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.DetailRatingNegative)).toBeNull();
    expect(screen.queryByText(ConversationsTraceI18nKey.DetailRatingPositive)).toBeNull();
  });

  test('states the comment count alongside the text an elevated caller may read', () => {
    setup([row({ comment_count: 3, comment_sample: 'Actually fine' })], 1, true);

    expect(screen.getByText(ConversationsTraceI18nKey.DetailCommentCount, { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Actually fine', { exact: false })).toBeInTheDocument();
  });

  test('uses a singular label for one comment', () => {
    const { unmount } = setup([row({ comment_count: 1 })], 1, false);

    expect(screen.getByText(ConversationsTraceI18nKey.DetailCommentCountOne, { exact: false })).toBeInTheDocument();
    unmount();

    setup([row({ comment_count: 4 })], 1, false);

    expect(screen.queryByText(ConversationsTraceI18nKey.DetailCommentCountOne, { exact: false })).toBeNull();
    expect(screen.getByText(ConversationsTraceI18nKey.DetailCommentCount, { exact: false })).toBeInTheDocument();
  });
});
